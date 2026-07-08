import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../../utils/SeededRandom';
import {
  STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS,
  STOREFRONT_MIN_CUSTOMER_INTERVAL_SECONDS,
  STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT,
  STOREFRONT_BULK_PURCHASE_MAX_QUANTITY,
  STOREFRONT_BULK_PURCHASE_MIN_QUANTITY,
  SMELTING_BASE_SECONDS_PER_BAR,
  SMELTING_MIN_SECONDS_PER_BAR,
  SMELTING_QUEUE_MAX_JOBS,
  BROKER_ROUTE_BASE_INTERVAL_SECONDS,
  BROKER_ROUTE_MIN_INTERVAL_SECONDS,
  BROKER_DEFAULT_CARAVAN_TRAVEL_SECONDS,
  BROKER_OPPORTUNITY_MIN_PROFIT_PCT,
  buildCareerTimerSnapshot,
  calculateBrokerRouteInterval,
  calculateBulkPurchaseChancePct,
  calculateSmeltingSecondsPerBar,
  calculateStorefrontCustomerInterval,
  createBrokerRoute,
  createStorefront,
  enqueueSmeltingJob,
  hasBlastFurnaceMastery,
  resolveCustomerPurchase,
  scanBrokerOpportunities,
  scheduleBrokerDeparture,
  tickBrokerRoute,
  tickSmeltingQueue,
  tickStorefrontCustomers,
  getSmeltingQueueRemainingSeconds,
  recordOpportunityOnRoute,
  getNextBrokerDepartureAt,
} from './careerTimers';
import { getGoodsPriceForWorld } from './tradeCaravan';

describe('T8.16 - Non-Combat Career Timers', () => {
  describe('T8.16.1 Shopkeeper storefront customer arrival timer', () => {
    it('uses base 5min interval with no Shopkeeper bonuses', () => {
      expect(calculateStorefrontCustomerInterval(undefined)).toBe(STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS);
      expect(calculateStorefrontCustomerInterval({})).toBe(STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS);
    });

    it('reduces customer interval when store_traffic_pct is positive', () => {
      const result = calculateStorefrontCustomerInterval({ store_traffic_pct: 20 });
      expect(result).toBe(Math.floor(STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS * 0.8));
      expect(result).toBeLessThan(STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS);
    });

    it('clamps the reduction at 90% of the base interval', () => {
      const result = calculateStorefrontCustomerInterval({ store_traffic_pct: 1000 });
      expect(result).toBeGreaterThanOrEqual(STOREFRONT_MIN_CUSTOMER_INTERVAL_SECONDS);
      expect(result).toBe(STOREFRONT_MIN_CUSTOMER_INTERVAL_SECONDS);
    });

    it('returns the base interval when baseSeconds is non-positive', () => {
      expect(calculateStorefrontCustomerInterval({ store_traffic_pct: 50 }, 0)).toBe(0);
    });

    it('creates a storefront with a computed interval from bonuses', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        bonuses: { store_traffic_pct: 25 },
        now: 0,
      });
      expect(storefront.customerIntervalSeconds).toBe(
        Math.floor(STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS * 0.75)
      );
      expect(storefront.pendingCustomerArrivals).toBe(0);
      expect(storefront.totalCustomersServed).toBe(0);
    });

    it('tickStorefrontCustomers adds pending arrivals based on elapsed time', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 0,
      });
      const { storefront: ticked, arrivals } = tickStorefrontCustomers(storefront, 1500);
      expect(arrivals).toBe(Math.floor(1500 / STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS));
      expect(ticked.pendingCustomerArrivals).toBe(arrivals);
    });

    it('tickStorefrontCustomers advances lastCustomerArrivalAt by completed intervals', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 0,
      });
      const interval = STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS;
      const { storefront: ticked } = tickStorefrontCustomers(storefront, interval * 3);
      expect(ticked.lastCustomerArrivalAt).toBe(interval * 3);
    });

    it('tickStorefrontCustomers returns zero arrivals when interval has not elapsed', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        bonuses: { store_traffic_pct: 90 },
        now: 0,
      });
      const { storefront: ticked, arrivals } = tickStorefrontCustomers(storefront, 10);
      expect(arrivals).toBe(0);
      expect(ticked.pendingCustomerArrivals).toBe(0);
    });

    it('tickStorefrontCustomers ignores negative time deltas', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 1000,
      });
      const { arrivals } = tickStorefrontCustomers(storefront, 500);
      expect(arrivals).toBe(0);
    });

    it('bulk purchase chance starts at base 15% and grows with selling_price_pct', () => {
      expect(calculateBulkPurchaseChancePct(undefined)).toBe(STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT);
      expect(calculateBulkPurchaseChancePct({})).toBe(STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT);
      const boosted = calculateBulkPurchaseChancePct({ selling_price_pct: 20 });
      expect(boosted).toBe(STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT + 20);
    });

    it('bulk purchase chance caps at 100%', () => {
      const capped = calculateBulkPurchaseChancePct({ selling_price_pct: 5000 });
      expect(capped).toBeLessThanOrEqual(100);
      expect(capped).toBe(100);
    });

    it('resolveCustomerPurchase produces revenue and updates storefront stats for a single purchase', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 0,
      });
      storefront.pendingCustomerArrivals = 1;
      const rng = new SeededRandom('test-bulk-off');
      const { storefront: after, event } = resolveCustomerPurchase({ storefront, rng, bonuses: { selling_price_pct: 0 } });
      expect(after.pendingCustomerArrivals).toBe(0);
      expect(after.totalCustomersServed).toBe(1);
      expect(event.quantity).toBe(1);
      expect(event.isBulk).toBe(false);
      expect(event.unitPrice).toBe(getGoodsPriceForWorld('healing_salve', 5));
      expect(event.totalRevenue).toBe(event.unitPrice);
      expect(after.totalRevenue).toBe(event.totalRevenue);
    });

    it('resolveCustomerPurchase produces bulk quantity in the configured range', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'player-1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 0,
      });
      storefront.pendingCustomerArrivals = 1;
      const rng = new SeededRandom('test-bulk-on');
      const { event } = resolveCustomerPurchase({
        storefront,
        rng,
        bonuses: { selling_price_pct: 1000 },
      });
      expect(event.isBulk).toBe(true);
      expect(event.quantity).toBeGreaterThanOrEqual(STOREFRONT_BULK_PURCHASE_MIN_QUANTITY);
      expect(event.quantity).toBeLessThanOrEqual(STOREFRONT_BULK_PURCHASE_MAX_QUANTITY);
      expect(event.totalRevenue).toBe(event.unitPrice * event.quantity);
    });
  });

  describe('T8.16.2 Blacksmith smelting queue (30s per bar, Blast Furnace Mastery)', () => {
    it('uses 30s per bar base duration with no bonuses', () => {
      expect(calculateSmeltingSecondsPerBar(undefined)).toBe(SMELTING_BASE_SECONDS_PER_BAR);
      expect(calculateSmeltingSecondsPerBar({})).toBe(SMELTING_BASE_SECONDS_PER_BAR);
    });

    it('reduces seconds per bar when smelting_speed_pct is positive', () => {
      const result = calculateSmeltingSecondsPerBar({ smelting_speed_pct: 50 });
      expect(result).toBe(Math.floor(SMELTING_BASE_SECONDS_PER_BAR * 0.5));
    });

    it('clamps the speed boost at 90% reduction (5s floor)', () => {
      const result = calculateSmeltingSecondsPerBar({ smelting_speed_pct: 1000 });
      expect(result).toBe(SMELTING_MIN_SECONDS_PER_BAR);
    });

    it('returns base seconds when baseSeconds is non-positive', () => {
      expect(calculateSmeltingSecondsPerBar({ smelting_speed_pct: 50 }, 0)).toBe(0);
    });

    it('detects Blast Furnace Mastery as a high smelting bonus or trade route unlock', () => {
      expect(hasBlastFurnaceMastery(undefined)).toBe(false);
      expect(hasBlastFurnaceMastery({ smelting_speed_pct: 25 })).toBe(false);
      expect(hasBlastFurnaceMastery({ smelting_speed_pct: 50 })).toBe(true);
      expect(hasBlastFurnaceMastery({ unlocks_trade_routes: 1 })).toBe(true);
    });

    it('enqueueSmeltingJob records a job with computed completion time', () => {
      const queue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { queue: next, enqueued } = enqueueSmeltingJob({
        queue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 4,
        bonuses: { smelting_speed_pct: 50 },
        now: 100,
      });
      expect(enqueued).toBe(true);
      expect(next.jobs).toHaveLength(1);
      const job = next.jobs[0]!;
      expect(job.bars).toBe(4);
      expect(job.secondsPerBar).toBe(Math.floor(SMELTING_BASE_SECONDS_PER_BAR * 0.5));
      expect(job.completesAt).toBe(100 + 4 * job.secondsPerBar);
    });

    it('enqueueSmeltingJob refuses to add jobs past the queue maximum', () => {
      const jobs = Array.from({ length: SMELTING_QUEUE_MAX_JOBS }, (_, i) => ({
        jobId: `j${i}`,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 1,
        secondsPerBar: SMELTING_BASE_SECONDS_PER_BAR,
        startedAt: 0,
        completesAt: SMELTING_BASE_SECONDS_PER_BAR,
      }));
      const queue = { ownerId: 'p1', jobs, lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { enqueued, reason } = enqueueSmeltingJob({
        queue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 1,
        now: 0,
      });
      expect(enqueued).toBe(false);
      expect(reason).toContain('full');
    });

    it('enqueueSmeltingJob rejects non-positive bar counts', () => {
      const queue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { enqueued, reason } = enqueueSmeltingJob({
        queue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 0,
        now: 0,
      });
      expect(enqueued).toBe(false);
      expect(reason).toContain('positive');
    });

    it('tickSmeltingQueue completes finished jobs and accumulates bars', () => {
      const queue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { queue: withJob } = enqueueSmeltingJob({
        queue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 2,
        now: 0,
      });
      const { queue: ticked, completedJobs } = tickSmeltingQueue(withJob, SMELTING_BASE_SECONDS_PER_BAR * 2);
      expect(completedJobs).toHaveLength(1);
      expect(ticked.jobs).toHaveLength(0);
      expect(ticked.totalBarsSmelted).toBe(2);
      expect(ticked.totalJobsCompleted).toBe(1);
    });

    it('tickSmeltingQueue keeps in-progress jobs and reports zero completions', () => {
      const queue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { queue: withJob } = enqueueSmeltingJob({
        queue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 5,
        now: 0,
      });
      const { queue: ticked, completedJobs } = tickSmeltingQueue(withJob, SMELTING_BASE_SECONDS_PER_BAR);
      expect(completedJobs).toHaveLength(0);
      expect(ticked.jobs).toHaveLength(1);
      expect(ticked.totalBarsSmelted).toBe(0);
    });

    it('getSmeltingQueueRemainingSeconds returns the longest job ETA', () => {
      const queue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { queue: a } = enqueueSmeltingJob({ queue, recipeItemTemplateKey: 'iron_ingot', bars: 1, now: 0 });
      const { queue: b } = enqueueSmeltingJob({ queue: a, recipeItemTemplateKey: 'iron_ingot', bars: 3, now: 0 });
      const remaining = getSmeltingQueueRemainingSeconds(b, 0);
      expect(remaining).toBe(SMELTING_BASE_SECONDS_PER_BAR * 3);
    });
  });

  describe('T8.16.3 Broker trade route timer and arbitrage detection', () => {
    it('uses 1h base route interval with no bonuses', () => {
      expect(calculateBrokerRouteInterval(undefined)).toBe(BROKER_ROUTE_BASE_INTERVAL_SECONDS);
      expect(calculateBrokerRouteInterval({})).toBe(BROKER_ROUTE_BASE_INTERVAL_SECONDS);
    });

    it('reduces the route interval when caravan_speed_pct is positive', () => {
      const result = calculateBrokerRouteInterval({ caravan_speed_pct: 25 });
      expect(result).toBe(Math.floor(BROKER_ROUTE_BASE_INTERVAL_SECONDS * 0.75));
    });

    it('clamps the speed boost at 90% reduction (1min floor)', () => {
      const result = calculateBrokerRouteInterval({ caravan_speed_pct: 1000 });
      expect(result).toBeLessThanOrEqual(BROKER_ROUTE_BASE_INTERVAL_SECONDS / 10 + 1);
      expect(result).toBeGreaterThanOrEqual(BROKER_ROUTE_MIN_INTERVAL_SECONDS);
    });

    it('returns base interval when baseSeconds is non-positive', () => {
      expect(calculateBrokerRouteInterval({ caravan_speed_pct: 50 }, 0)).toBe(0);
    });

    it('createBrokerRoute initializes a route in idle status', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        bonuses: { caravan_speed_pct: 10 },
        now: 0,
      });
      expect(route.status).toBe('idle');
      expect(route.totalDepartures).toBe(0);
      expect(route.totalArrivals).toBe(0);
      expect(route.intervalSeconds).toBe(Math.floor(BROKER_ROUTE_BASE_INTERVAL_SECONDS * 0.9));
    });

    it('scheduleBrokerDeparture sets the next departure timestamp', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const scheduled = scheduleBrokerDeparture(route, 100);
      expect(scheduled.status).toBe('scheduled');
      expect(scheduled.scheduledDepartureAt).toBe(BROKER_ROUTE_BASE_INTERVAL_SECONDS);
    });

    it('scheduleBrokerDeparture never schedules in the past', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 10_000,
      });
      const scheduled = scheduleBrokerDeparture(route, 20_000);
      expect(scheduled.scheduledDepartureAt).toBeGreaterThanOrEqual(20_000);
    });

    it('tickBrokerRoute transitions scheduled -> departed when due', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const scheduled = scheduleBrokerDeparture(route, 0);
      const { route: ticked, departed } = tickBrokerRoute(scheduled, scheduled.scheduledDepartureAt!);
      expect(departed).toBe(true);
      expect(ticked.status).toBe('departed');
      expect(ticked.totalDepartures).toBe(1);
    });

    it('tickBrokerRoute transitions departed -> arrived after travel time', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const departed = {
        ...route,
        status: 'departed' as const,
        lastDepartureAt: 1000,
      };
      const { route: arrived, arrived: arrivedFlag } = tickBrokerRoute(
        departed,
        1000 + BROKER_DEFAULT_CARAVAN_TRAVEL_SECONDS
      );
      expect(arrivedFlag).toBe(true);
      expect(arrived.status).toBe('arrived');
      expect(arrived.totalArrivals).toBe(1);
    });

    it('tickBrokerRoute reschedules when idle/arrived past the interval', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const arrived = { ...route, status: 'arrived' as const, lastDepartureAt: 0 };
      const { route: ticked } = tickBrokerRoute(arrived, BROKER_ROUTE_BASE_INTERVAL_SECONDS + 1);
      expect(ticked.status).toBe('scheduled');
      expect(ticked.scheduledDepartureAt).toBe(BROKER_ROUTE_BASE_INTERVAL_SECONDS);
    });

    it('tickBrokerRoute leaves an in-progress caravan as departed', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const departed = { ...route, status: 'departed' as const, lastDepartureAt: 1000 };
      const { route: ticked, arrived } = tickBrokerRoute(departed, 1000 + 60);
      expect(arrived).toBe(false);
      expect(ticked.status).toBe('departed');
    });

    it('scanBrokerOpportunities returns no opportunity when no chance bonus', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
      });
      const rng = new SeededRandom('opps');
      const result = scanBrokerOpportunities({
        route,
        candidateTemplateKeys: ['iron_ingot', 'wood'],
        rng,
        bonuses: undefined,
      });
      expect(result.detected).toBe(false);
    });

    it('scanBrokerOpportunities returns an opportunity when chance succeeds', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
      });
      const rng = new SeededRandom('opps-2');
      const { detected, opportunity } = scanBrokerOpportunities({
        route,
        candidateTemplateKeys: ['iron_ingot', 'wood', 'healing_salve'],
        rng,
        bonuses: { arbitrage_opportunity_chance: 100 },
      });
      expect(detected).toBe(true);
      expect(opportunity).toBeDefined();
      expect(opportunity?.originWorldId).toBe(1);
      expect(opportunity?.destinationWorldId).toBe(50);
      expect(opportunity?.distance).toBe(49);
    });

    it('scanBrokerOpportunities marks the opportunity as profitable when threshold met', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
      });
      const rng = new SeededRandom('opps-profitable');
      const { opportunity } = scanBrokerOpportunities({
        route,
        candidateTemplateKeys: ['wood'],
        rng,
        bonuses: { arbitrage_opportunity_chance: 100 },
      });
      expect(opportunity).toBeDefined();
      expect(opportunity!.profitPct).toBeGreaterThanOrEqual(BROKER_OPPORTUNITY_MIN_PROFIT_PCT);
      expect(opportunity!.isProfitable).toBe(true);
    });

    it('scanBrokerOpportunities with empty candidates is a no-op', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
      });
      const result = scanBrokerOpportunities({
        route,
        candidateTemplateKeys: [],
        rng: new SeededRandom('empty'),
        bonuses: { arbitrage_opportunity_chance: 100 },
      });
      expect(result.detected).toBe(false);
    });

    it('recordOpportunityOnRoute stores last profit pct on the route', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
      });
      const updated = recordOpportunityOnRoute(route, {
        originWorldId: 1,
        destinationWorldId: 50,
        itemTemplateKey: 'iron_ingot',
        originPrice: 10,
        destinationPrice: 20,
        profitPct: 100,
        distance: 49,
        isProfitable: true,
      });
      expect(updated.lastOpportunityProfitPct).toBe(100);
    });

    it('getNextBrokerDepartureAt returns the scheduled time or computed next', () => {
      const route = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      const scheduled = scheduleBrokerDeparture(route, 0);
      expect(getNextBrokerDepartureAt(scheduled, 0)).toBe(scheduled.scheduledDepartureAt);
      const idle = { ...route, status: 'idle' as const, lastDepartureAt: 0 };
      expect(getNextBrokerDepartureAt(idle, 0)).toBe(BROKER_ROUTE_BASE_INTERVAL_SECONDS);
    });
  });

  describe('T8.16 snapshot', () => {
    it('buildCareerTimerSnapshot aggregates the three systems', () => {
      const storefront = createStorefront({
        storefrontId: 'shop-1',
        ownerId: 'p1',
        worldId: 5,
        stockedItemTemplateKey: 'healing_salve',
        now: 0,
      });
      storefront.pendingCustomerArrivals = 2;
      storefront.totalCustomersServed = 5;
      storefront.totalRevenue = 250;

      const smeltingQueue = { ownerId: 'p1', jobs: [], lastTickAt: 0, totalBarsSmelted: 0, totalJobsCompleted: 0 };
      const { queue: withJob } = enqueueSmeltingJob({
        queue: smeltingQueue,
        recipeItemTemplateKey: 'iron_ingot',
        bars: 3,
        now: 0,
      });

      const brokerRoute = createBrokerRoute({
        routeId: 'r1',
        ownerId: 'p1',
        originWorldId: 1,
        destinationWorldId: 50,
        now: 0,
      });
      brokerRoute.totalDepartures = 4;
      brokerRoute.totalArrivals = 3;
      brokerRoute.lastOpportunityProfitPct = 42;

      const snapshot = buildCareerTimerSnapshot({
        storefront,
        smeltingQueue: withJob,
        brokerRoute,
        now: 0,
      });

      expect(snapshot.storefront.pendingArrivals).toBe(2);
      expect(snapshot.storefront.totalCustomersServed).toBe(5);
      expect(snapshot.storefront.totalRevenue).toBe(250);
      expect(snapshot.smelting.activeJobs).toBe(1);
      expect(snapshot.smelting.remainingSeconds).toBe(SMELTING_BASE_SECONDS_PER_BAR * 3);
      expect(snapshot.broker.totalDepartures).toBe(4);
      expect(snapshot.broker.totalArrivals).toBe(3);
      expect(snapshot.broker.lastOpportunityProfitPct).toBe(42);
    });
  });
});
