import { describe, expect, it } from 'vitest';
import {
  createTradeCaravan,
  calculateCaravanProfit,
  isArbitrageProfitable,
  resolveCaravanTrade,
  validateCaravanGoods,
  getWorldPriceModifier,
  getGoodsPriceForWorld,
  CARAVAN_CAPACITY,
  ARBITRAGE_MIN_DISTANCE,
  ARBITRAGE_MIN_PROFIT_PCT,
} from './tradeCaravan';

describe('T8.14 - Trade Caravan System', () => {
  describe('getWorldPriceModifier', () => {
    it('returns cheaper modifier for raw materials in low worlds', () => {
      expect(getWorldPriceModifier(1, 'raw_material')).toBeLessThan(1);
    });

    it('returns expensive modifier for raw materials in high worlds', () => {
      expect(getWorldPriceModifier(100, 'raw_material')).toBeGreaterThan(1);
    });

    it('returns expensive modifier for refined materials in low worlds', () => {
      expect(getWorldPriceModifier(1, 'refined_material')).toBeGreaterThan(1);
    });

    it('returns cheaper modifier for refined materials in high worlds', () => {
      expect(getWorldPriceModifier(50, 'refined_material')).toBeLessThan(1);
    });

    it('scales linearly between World 1 and World 100', () => {
      const world1 = getWorldPriceModifier(1, 'raw_material');
      const world100 = getWorldPriceModifier(100, 'raw_material');
      expect(world100).toBeGreaterThan(world1);
    });
  });

  describe('getGoodsPriceForWorld', () => {
    it('returns price modified by world tier', () => {
      const basePrice = 10;
      const world1Price = getGoodsPriceForWorld('wood', 1);
      const world50Price = getGoodsPriceForWorld('wood', 50);
      expect(world1Price).toBeLessThan(world50Price);
    });

    it('returns price >= 1 for any world', () => {
      expect(getGoodsPriceForWorld('wood', 1)).toBeGreaterThanOrEqual(1);
      expect(getGoodsPriceForWorld('crystal', 100)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createTradeCaravan', () => {
    it('creates a caravan with deterministic ID from seed', () => {
      const caravan1 = createTradeCaravan({
        seed: 12345,
        originWorldId: 1,
        originSettlementId: 'settlement-1',
        destinationWorldId: 50,
        destinationSettlementId: 'settlement-50',
        goods: [{ templateKey: 'wood', quantity: 5 }],
        totalBuyCost: 50,
        totalSellRevenue: 100,
      });
      const caravan2 = createTradeCaravan({
        seed: 12345,
        originWorldId: 1,
        originSettlementId: 'settlement-1',
        destinationWorldId: 50,
        destinationSettlementId: 'settlement-50',
        goods: [{ templateKey: 'wood', quantity: 5 }],
        totalBuyCost: 50,
        totalSellRevenue: 100,
      });
      expect(caravan1.caravanId).toBe(caravan2.caravanId);
    });

    it('computes distance correctly', () => {
      const caravan = createTradeCaravan({
        seed: 1,
        originWorldId: 1,
        originSettlementId: 's1',
        destinationWorldId: 50,
        destinationSettlementId: 's50',
        goods: [],
        totalBuyCost: 0,
        totalSellRevenue: 0,
      });
      expect(caravan.distance).toBe(49);
    });

    it('computes profit percentage', () => {
      const caravan = createTradeCaravan({
        seed: 1,
        originWorldId: 1,
        originSettlementId: 's1',
        destinationWorldId: 50,
        destinationSettlementId: 's50',
        goods: [],
        totalBuyCost: 100,
        totalSellRevenue: 150,
      });
      expect(caravan.profitPct).toBe(50);
    });
  });

  describe('calculateCaravanProfit', () => {
    it('returns zero profit when origin and destination prices are equal', () => {
      const result = calculateCaravanProfit(10, 10, 5, 10);
      expect(result.buyCost).toBe(50);
      expect(result.sellRevenue).toBe(50);
      expect(result.profit).toBe(0);
      expect(result.profitPct).toBe(0);
    });

    it('computes profit when destination price is higher', () => {
      const result = calculateCaravanProfit(10, 15, 5, 10);
      expect(result.buyCost).toBe(50);
      expect(result.sellRevenue).toBe(75);
      expect(result.profit).toBe(25);
      expect(result.profitPct).toBe(50);
    });

    it('does not allow negative profit', () => {
      const result = calculateCaravanProfit(15, 10, 5, 10);
      expect(result.profit).toBe(0);
      expect(result.profitPct).toBe(0);
    });
  });

  describe('isArbitrageProfitable', () => {
    it('rejects when distance is below minimum', () => {
      expect(isArbitrageProfitable(10, 20, 1, 5)).toBe(false);
    });

    it('rejects when profit percentage is below minimum', () => {
      expect(isArbitrageProfitable(10, 10, 1, 20)).toBe(false);
    });

    it('rejects when quantity is zero', () => {
      expect(isArbitrageProfitable(10, 20, 0, 20)).toBe(false);
    });

    it('accepts valid arbitrage with sufficient distance and profit', () => {
      expect(isArbitrageProfitable(10, 20, 1, 20)).toBe(true);
    });
  });

  describe('resolveCaravanTrade', () => {
    it('applies tax and profit share correctly', () => {
      const caravan = createTradeCaravan({
        seed: 1,
        originWorldId: 1,
        originSettlementId: 's1',
        destinationWorldId: 50,
        destinationSettlementId: 's50',
        goods: [{ templateKey: 'wood', quantity: 5 }],
        totalBuyCost: 100,
        totalSellRevenue: 200,
      });
      const result = resolveCaravanTrade(caravan, true);
      expect(result.profit).toBe(100);
      expect(result.taxPaid).toBe(10);
      expect(result.netProfit).toBe(63);
      expect(result.success).toBe(true);
    });

    it('skips tax when applyTax is false', () => {
      const caravan = createTradeCaravan({
        seed: 1,
        originWorldId: 1,
        originSettlementId: 's1',
        destinationWorldId: 50,
        destinationSettlementId: 's50',
        goods: [{ templateKey: 'wood', quantity: 5 }],
        totalBuyCost: 100,
        totalSellRevenue: 200,
      });
      const result = resolveCaravanTrade(caravan, false);
      expect(result.taxPaid).toBe(0);
      expect(result.netProfit).toBe(70);
    });

    it('returns failure for empty goods', () => {
      const result = resolveCaravanTrade({
        ...createTradeCaravan({
          seed: 1,
          originWorldId: 1,
          originSettlementId: 's1',
          destinationWorldId: 50,
          destinationSettlementId: 's50',
          goods: [],
          totalBuyCost: 0,
          totalSellRevenue: 0,
        }),
        goods: [],
      });
      expect(result.success).toBe(false);
      expect(result.netProfit).toBe(0);
    });
  });

  describe('validateCaravanGoods', () => {
    it('rejects empty goods array', () => {
      const result = validateCaravanGoods([]);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Caravan must carry at least one good');
    });

    it('rejects goods exceeding capacity', () => {
      const result = validateCaravanGoods(
        Array.from({ length: 21 }, (_, i) => ({ templateKey: `item_${i}`, quantity: 1 })),
        20
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('capacity exceeded');
    });

    it('rejects goods without templateKey', () => {
      const result = validateCaravanGoods([{ templateKey: '', quantity: 1 }]);
      expect(result.valid).toBe(false);
    });

    it('rejects goods with non-positive quantity', () => {
      const result = validateCaravanGoods([{ templateKey: 'wood', quantity: 0 }]);
      expect(result.valid).toBe(false);
    });

    it('accepts valid goods within capacity', () => {
      const result = validateCaravanGoods([{ templateKey: 'wood', quantity: 5 }]);
      expect(result.valid).toBe(true);
    });
  });

  describe('World 1 raw -> World 50 refined arbitrage scenario', () => {
    it('demonstrates arbitrage profit from World 1 raw to World 50 refined', () => {
      const originPrice = getGoodsPriceForWorld('wood', 1);
      const destPrice = getGoodsPriceForWorld('wood', 50);
      const quantity = 10;
      const distance = 49;

      expect(originPrice).toBeLessThan(destPrice);
      expect(isArbitrageProfitable(originPrice, destPrice, quantity, distance)).toBe(true);
    });

    it('demonstrates arbitrage profit from World 50 refined to World 1 raw', () => {
      const originPrice = getGoodsPriceForWorld('crystal', 50);
      const destPrice = getGoodsPriceForWorld('crystal', 1);
      const quantity = 10;
      const distance = 49;

      expect(originPrice).toBeLessThan(destPrice);
      expect(isArbitrageProfitable(originPrice, destPrice, quantity, distance)).toBe(true);
    });

    it('validates World 1 raw -> World 50 refined trade yields positive profit', () => {
      const buyCost = getGoodsPriceForWorld('wood', 1) * 5;
      const sellRevenue = getGoodsPriceForWorld('wood', 50) * 5;
      const result = calculateCaravanProfit(buyCost, sellRevenue, 5, 49);
      expect(result.profit).toBeGreaterThan(0);
      expect(result.profitPct).toBeGreaterThan(ARBITRAGE_MIN_PROFIT_PCT);
    });
  });
});
