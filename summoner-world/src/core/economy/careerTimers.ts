import { SeededRandom } from '../../utils/SeededRandom';
import type { CareerSystemBonuses } from '../../data/careerTreeIntegration';
import {
  getBasePrice,
  getGoodsPriceForWorld,
  isArbitrageProfitable,
  getGoodCategory,
  type GoodCategory,
} from './tradeCaravan';

export const STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS = 5 * 60;
export const STOREFRONT_MIN_CUSTOMER_INTERVAL_SECONDS = 30;
export const STOREFRONT_MAX_SPEED_REDUCTION_PCT = 90;
export const STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT = 15;
export const STOREFRONT_BULK_PURCHASE_MIN_QUANTITY = 3;
export const STOREFRONT_BULK_PURCHASE_MAX_QUANTITY = 8;

export const SMELTING_BASE_SECONDS_PER_BAR = 30;
export const SMELTING_MIN_SECONDS_PER_BAR = 5;
export const SMELTING_MAX_SPEED_REDUCTION_PCT = 90;
export const SMELTING_QUEUE_MAX_JOBS = 8;
export const SMELTING_BARS_PER_JOB = 1;
export const SMELTING_BLAST_FURNACE_MASTERY_NODE_ID = 'blast_furnace_mastery';

export const BROKER_ROUTE_BASE_INTERVAL_SECONDS = 60 * 60;
export const BROKER_ROUTE_MIN_INTERVAL_SECONDS = 60;
export const BROKER_ROUTE_MAX_SPEED_REDUCTION_PCT = 90;
export const BROKER_DEFAULT_CARAVAN_TRAVEL_SECONDS = 4 * 60 * 60;
export const BROKER_OPPORTUNITY_MIN_PROFIT_PCT = 5;

export interface StorefrontCustomerEvent {
  quantity: number;
  isBulk: boolean;
  unitPrice: number;
  totalRevenue: number;
  itemTemplateKey: string;
  worldId: number;
}

export interface Storefront {
  storefrontId: string;
  ownerId: string;
  worldId: number;
  stockedItemTemplateKey: string;
  customerIntervalSeconds: number;
  lastCustomerArrivalAt: number;
  pendingCustomerArrivals: number;
  totalCustomersServed: number;
  totalRevenue: number;
}

export function calculateStorefrontCustomerInterval(
  bonuses: CareerSystemBonuses | undefined,
  baseIntervalSeconds: number = STOREFRONT_BASE_CUSTOMER_INTERVAL_SECONDS
): number {
  if (baseIntervalSeconds <= 0) return baseIntervalSeconds;
  const pct = Math.max(0, bonuses?.store_traffic_pct ?? 0);
  const clampedPct = Math.min(STOREFRONT_MAX_SPEED_REDUCTION_PCT, pct);
  const compressed = baseIntervalSeconds * (1 - clampedPct / 100);
  return Math.max(
    STOREFRONT_MIN_CUSTOMER_INTERVAL_SECONDS,
    Math.floor(compressed)
  );
}

export function createStorefront(params: {
  storefrontId: string;
  ownerId: string;
  worldId: number;
  stockedItemTemplateKey: string;
  bonuses?: CareerSystemBonuses;
  now?: number;
}): Storefront {
  return {
    storefrontId: params.storefrontId,
    ownerId: params.ownerId,
    worldId: params.worldId,
    stockedItemTemplateKey: params.stockedItemTemplateKey,
    customerIntervalSeconds: calculateStorefrontCustomerInterval(params.bonuses),
    lastCustomerArrivalAt: params.now ?? 0,
    pendingCustomerArrivals: 0,
    totalCustomersServed: 0,
    totalRevenue: 0,
  };
}

export function tickStorefrontCustomers(
  storefront: Storefront,
  now: number
): { storefront: Storefront; arrivals: number } {
  if (now < storefront.lastCustomerArrivalAt) {
    return { storefront, arrivals: 0 };
  }
  const interval = storefront.customerIntervalSeconds;
  if (interval <= 0) {
    return { storefront, arrivals: 0 };
  }
  const elapsedSeconds = now - storefront.lastCustomerArrivalAt;
  const arrivals = Math.floor(elapsedSeconds / interval);
  if (arrivals <= 0) {
    return { storefront, arrivals: 0 };
  }
  const next: Storefront = {
    ...storefront,
    lastCustomerArrivalAt: storefront.lastCustomerArrivalAt + arrivals * interval,
    pendingCustomerArrivals: storefront.pendingCustomerArrivals + arrivals,
  };
  return { storefront: next, arrivals };
}

export function calculateBulkPurchaseChancePct(
  bonuses: CareerSystemBonuses | undefined
): number {
  const sellingBonusPct = Math.max(0, bonuses?.selling_price_pct ?? 0);
  return Math.min(100, STOREFRONT_BULK_PURCHASE_BASE_CHANCE_PCT + sellingBonusPct);
}

export function resolveCustomerPurchase(params: {
  storefront: Storefront;
  rng: SeededRandom;
  bonuses?: CareerSystemBonuses;
}): { storefront: Storefront; event: StorefrontCustomerEvent } {
  const { storefront, rng, bonuses } = params;
  const itemTemplateKey = storefront.stockedItemTemplateKey;
  const unitPrice = getGoodsPriceForWorld(itemTemplateKey, storefront.worldId);
  const isBulk = rng.next() * 100 < calculateBulkPurchaseChancePct(bonuses);
  const quantity = isBulk
    ? rng.int(STOREFRONT_BULK_PURCHASE_MIN_QUANTITY, STOREFRONT_BULK_PURCHASE_MAX_QUANTITY)
    : 1;
  const totalRevenue = unitPrice * quantity;

  const next: Storefront = {
    ...storefront,
    pendingCustomerArrivals: Math.max(0, storefront.pendingCustomerArrivals - 1),
    totalCustomersServed: storefront.totalCustomersServed + 1,
    totalRevenue: storefront.totalRevenue + totalRevenue,
  };

  return {
    storefront: next,
    event: {
      quantity,
      isBulk,
      unitPrice,
      totalRevenue,
      itemTemplateKey,
      worldId: storefront.worldId,
    },
  };
}

export interface SmeltingJob {
  jobId: string;
  recipeItemTemplateKey: string;
  bars: number;
  secondsPerBar: number;
  startedAt: number;
  completesAt: number;
}

export interface SmeltingQueue {
  ownerId: string;
  jobs: SmeltingJob[];
  lastTickAt: number;
  totalBarsSmelted: number;
  totalJobsCompleted: number;
}

export function calculateSmeltingSecondsPerBar(
  bonuses: CareerSystemBonuses | undefined,
  baseSecondsPerBar: number = SMELTING_BASE_SECONDS_PER_BAR
): number {
  if (baseSecondsPerBar <= 0) return baseSecondsPerBar;
  const pct = Math.max(0, bonuses?.smelting_speed_pct ?? 0);
  const clampedPct = Math.min(SMELTING_MAX_SPEED_REDUCTION_PCT, pct);
  const compressed = baseSecondsPerBar * (1 - clampedPct / 100);
  return Math.max(SMELTING_MIN_SECONDS_PER_BAR, Math.floor(compressed));
}

export function hasBlastFurnaceMastery(bonuses: CareerSystemBonuses | undefined): boolean {
  if (!bonuses) return false;
  if (bonuses.unlocks_trade_routes && bonuses.unlocks_trade_routes > 0) {
    return true;
  }
  const speed = bonuses.smelting_speed_pct ?? 0;
  return speed >= 50;
}

export function enqueueSmeltingJob(params: {
  queue: SmeltingQueue;
  recipeItemTemplateKey: string;
  bars: number;
  bonuses?: CareerSystemBonuses;
  baseSecondsPerBar?: number;
  now: number;
  jobIdFactory?: () => string;
}): { queue: SmeltingQueue; enqueued: boolean; reason?: string } {
  const { queue, bonuses, now, bars, recipeItemTemplateKey } = params;
  if (bars <= 0) {
    return { queue, enqueued: false, reason: 'Bars must be positive' };
  }
  if (queue.jobs.length >= SMELTING_QUEUE_MAX_JOBS) {
    return { queue, enqueued: false, reason: `Smelting queue full (max ${SMELTING_QUEUE_MAX_JOBS})` };
  }
  const secondsPerBar = calculateSmeltingSecondsPerBar(bonuses, params.baseSecondsPerBar);
  const jobId = params.jobIdFactory
    ? params.jobIdFactory()
    : `smelt_${now}_${queue.jobs.length + 1}`;
  const job: SmeltingJob = {
    jobId,
    recipeItemTemplateKey,
    bars,
    secondsPerBar,
    startedAt: now,
    completesAt: now + bars * secondsPerBar,
  };
  return {
    queue: { ...queue, jobs: [...queue.jobs, job] },
    enqueued: true,
  };
}

export function tickSmeltingQueue(
  queue: SmeltingQueue,
  now: number
): { queue: SmeltingQueue; completedJobs: SmeltingJob[] } {
  if (queue.jobs.length === 0) {
    return { queue: { ...queue, lastTickAt: now }, completedJobs: [] };
  }
  const completedJobs: SmeltingJob[] = [];
  const remaining: SmeltingJob[] = [];
  for (const job of queue.jobs) {
    if (now >= job.completesAt) {
      completedJobs.push(job);
    } else {
      remaining.push(job);
    }
  }
  const totalBars = completedJobs.reduce((sum, job) => sum + job.bars, 0);
  return {
    queue: {
      ...queue,
      jobs: remaining,
      lastTickAt: now,
      totalBarsSmelted: queue.totalBarsSmelted + totalBars,
      totalJobsCompleted: queue.totalJobsCompleted + completedJobs.length,
    },
    completedJobs,
  };
}

export function getSmeltingQueueRemainingSeconds(queue: SmeltingQueue, now: number): number {
  if (queue.jobs.length === 0) return 0;
  let max = 0;
  for (const job of queue.jobs) {
    const remaining = Math.max(0, job.completesAt - now);
    if (remaining > max) max = remaining;
  }
  return max;
}

export type BrokerRouteStatus = 'idle' | 'scheduled' | 'departed' | 'arrived';

export interface BrokerRoute {
  routeId: string;
  ownerId: string;
  originWorldId: number;
  destinationWorldId: number;
  intervalSeconds: number;
  lastDepartureAt: number;
  scheduledDepartureAt?: number;
  status: BrokerRouteStatus;
  totalDepartures: number;
  totalArrivals: number;
  lastOpportunityProfitPct?: number;
}

export function calculateBrokerRouteInterval(
  bonuses: CareerSystemBonuses | undefined,
  baseIntervalSeconds: number = BROKER_ROUTE_BASE_INTERVAL_SECONDS
): number {
  if (baseIntervalSeconds <= 0) return baseIntervalSeconds;
  const pct = Math.max(0, bonuses?.caravan_speed_pct ?? 0);
  const clampedPct = Math.min(BROKER_ROUTE_MAX_SPEED_REDUCTION_PCT, pct);
  const compressed = baseIntervalSeconds * (1 - clampedPct / 100);
  return Math.max(BROKER_ROUTE_MIN_INTERVAL_SECONDS, Math.floor(compressed));
}

export function createBrokerRoute(params: {
  routeId: string;
  ownerId: string;
  originWorldId: number;
  destinationWorldId: number;
  bonuses?: CareerSystemBonuses;
  now?: number;
}): BrokerRoute {
  return {
    routeId: params.routeId,
    ownerId: params.ownerId,
    originWorldId: params.originWorldId,
    destinationWorldId: params.destinationWorldId,
    intervalSeconds: calculateBrokerRouteInterval(params.bonuses),
    lastDepartureAt: params.now ?? 0,
    status: 'idle',
    totalDepartures: 0,
    totalArrivals: 0,
  };
}

export interface BrokerArbitrageOpportunity {
  originWorldId: number;
  destinationWorldId: number;
  itemTemplateKey: string;
  originPrice: number;
  destinationPrice: number;
  profitPct: number;
  distance: number;
  isProfitable: boolean;
}

export function scanBrokerOpportunities(params: {
  route: BrokerRoute;
  candidateTemplateKeys: string[];
  rng: SeededRandom;
  bonuses?: CareerSystemBonuses;
}): { opportunity?: BrokerArbitrageOpportunity; detected: boolean } {
  const { route, candidateTemplateKeys, rng, bonuses } = params;
  if (candidateTemplateKeys.length === 0) {
    return { detected: false };
  }
  const baseChance = Math.max(0, Math.min(100, bonuses?.arbitrage_opportunity_chance ?? 0)) / 100;
  if (baseChance <= 0) {
    return { detected: false };
  }
  if (!rng.chance(baseChance)) {
    return { detected: false };
  }
  const pickedKey = rng.pick(candidateTemplateKeys);
  if (!pickedKey) {
    return { detected: false };
  }
  const originPrice = getGoodsPriceForWorld(pickedKey, route.originWorldId);
  const destinationPrice = getGoodsPriceForWorld(pickedKey, route.destinationWorldId);
  const distance = Math.abs(route.destinationWorldId - route.originWorldId);
  const profit = destinationPrice - originPrice;
  const profitPct = originPrice > 0 ? (profit / originPrice) * 100 : 0;
  return {
    detected: true,
    opportunity: {
      originWorldId: route.originWorldId,
      destinationWorldId: route.destinationWorldId,
      itemTemplateKey: pickedKey,
      originPrice,
      destinationPrice,
      profitPct,
      distance,
      isProfitable: isArbitrageProfitable(originPrice, destinationPrice, 1, distance)
        && profitPct >= BROKER_OPPORTUNITY_MIN_PROFIT_PCT,
    },
  };
}

export function scheduleBrokerDeparture(
  route: BrokerRoute,
  now: number,
  bonuses?: CareerSystemBonuses
): BrokerRoute {
  const interval = bonuses
    ? calculateBrokerRouteInterval(bonuses, route.intervalSeconds)
    : route.intervalSeconds;
  const next = route.lastDepartureAt + interval;
  return {
    ...route,
    intervalSeconds: interval,
    scheduledDepartureAt: Math.max(next, now),
    status: 'scheduled',
  };
}

export function tickBrokerRoute(
  route: BrokerRoute,
  now: number,
  bonuses?: CareerSystemBonuses
): { route: BrokerRoute; departed: boolean; arrived: boolean } {
  if (route.status === 'scheduled' && route.scheduledDepartureAt !== undefined && now >= route.scheduledDepartureAt) {
    return {
      route: {
        ...route,
        status: 'departed',
        lastDepartureAt: now,
        scheduledDepartureAt: undefined,
        totalDepartures: route.totalDepartures + 1,
      },
      departed: true,
      arrived: false,
    };
  }
  if (route.status === 'departed') {
    const arrivalAt = route.lastDepartureAt + BROKER_DEFAULT_CARAVAN_TRAVEL_SECONDS;
    if (now >= arrivalAt) {
      return {
        route: {
          ...route,
          status: 'arrived',
          totalArrivals: route.totalArrivals + 1,
        },
        departed: false,
        arrived: true,
      };
    }
  }
  if (route.status === 'arrived' || route.status === 'idle') {
    const interval = bonuses
      ? calculateBrokerRouteInterval(bonuses, route.intervalSeconds)
      : route.intervalSeconds;
    if (now - route.lastDepartureAt >= interval) {
      return {
        route: {
          ...route,
          status: 'scheduled',
          scheduledDepartureAt: route.lastDepartureAt + interval,
          intervalSeconds: interval,
        },
        departed: false,
        arrived: false,
      };
    }
  }
  return { route, departed: false, arrived: false };
}

export function getNextBrokerDepartureAt(
  route: BrokerRoute,
  now: number,
  bonuses?: CareerSystemBonuses
): number {
  if (route.status === 'scheduled' && route.scheduledDepartureAt !== undefined) {
    return route.scheduledDepartureAt;
  }
  const interval = calculateBrokerRouteInterval(bonuses, route.intervalSeconds);
  return Math.max(now, route.lastDepartureAt + interval);
}

export function recordOpportunityOnRoute(
  route: BrokerRoute,
  opportunity: BrokerArbitrageOpportunity
): BrokerRoute {
  return {
    ...route,
    lastOpportunityProfitPct: opportunity.profitPct,
  };
}

export interface CareerTimerSnapshot {
  storefront: {
    customerIntervalSeconds: number;
    pendingArrivals: number;
    totalCustomersServed: number;
    totalRevenue: number;
  };
  smelting: {
    activeJobs: number;
    totalBarsSmelted: number;
    totalJobsCompleted: number;
    remainingSeconds: number;
  };
  broker: {
    routeIntervalSeconds: number;
    totalDepartures: number;
    totalArrivals: number;
    lastOpportunityProfitPct: number | null;
  };
}

export function buildCareerTimerSnapshot(params: {
  storefront: Storefront;
  smeltingQueue: SmeltingQueue;
  brokerRoute: BrokerRoute;
  now: number;
}): CareerTimerSnapshot {
  const { storefront, smeltingQueue, brokerRoute, now } = params;
  return {
    storefront: {
      customerIntervalSeconds: storefront.customerIntervalSeconds,
      pendingArrivals: storefront.pendingCustomerArrivals,
      totalCustomersServed: storefront.totalCustomersServed,
      totalRevenue: storefront.totalRevenue,
    },
    smelting: {
      activeJobs: smeltingQueue.jobs.length,
      totalBarsSmelted: smeltingQueue.totalBarsSmelted,
      totalJobsCompleted: smeltingQueue.totalJobsCompleted,
      remainingSeconds: getSmeltingQueueRemainingSeconds(smeltingQueue, now),
    },
    broker: {
      routeIntervalSeconds: brokerRoute.intervalSeconds,
      totalDepartures: brokerRoute.totalDepartures,
      totalArrivals: brokerRoute.totalArrivals,
      lastOpportunityProfitPct:
        brokerRoute.lastOpportunityProfitPct !== undefined
          ? brokerRoute.lastOpportunityProfitPct
          : null,
    },
  };
}


