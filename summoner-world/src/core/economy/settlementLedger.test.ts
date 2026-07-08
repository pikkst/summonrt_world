import { describe, expect, it } from 'vitest';
import type { Settlement, SettlementType } from '../../types/game.ts';
import {
  createSettlementLedger,
  initializeSettlementGoods,
  calculateGoodsPrice,
  calculateSettlementSupply,
  calculateSettlementDemand,
  tickSettlementEconomy,
  getBasePrice,
  getGoodCategory,
  PRICE_ELASTICITY_K,
} from './settlementLedger';

function createMockSettlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    id: 'settlement-1',
    type: 'village',
    worldId: 1,
    x: 100,
    y: 200,
    name: 'Test Village',
    biome: 'plains',
    elevation: 0.5,
    nearWater: false,
    discovered: true,
    ...overrides,
  };
}

describe('T8.10 - Settlement Economic Simulation', () => {
  describe('getGoodCategory', () => {
    it('returns raw_material for wood', () => {
      expect(getGoodCategory('wood')).toBe('raw_material');
    });

    it('returns food for basic_food', () => {
      expect(getGoodCategory('basic_food')).toBe('food');
    });

    it('returns trade_good for unknown keys', () => {
      expect(getGoodCategory('unknown_item')).toBe('trade_good');
    });
  });

  describe('getBasePrice', () => {
    it('returns scaled price based on rarity', () => {
      expect(getBasePrice('wood')).toBe(10);
      expect(getBasePrice('crystal')).toBe(15);
      expect(getBasePrice('legendary_ingot')).toBe(30);
    });

    it('returns default price for unknown items', () => {
      expect(getBasePrice('missing_item')).toBe(10);
    });
  });

  describe('createSettlementLedger', () => {
    it('creates an empty ledger with correct settlementId', () => {
      const ledger = createSettlementLedger('settlement-1');
      expect(ledger.settlementId).toBe('settlement-1');
      expect(ledger.ledger).toEqual({});
      expect(ledger.lastTickTurn).toBe(0);
    });
  });

  describe('initializeSettlementGoods', () => {
    it('populates the ledger with initial entries', () => {
      const ledger = createSettlementLedger('settlement-1');
      const goods = [
        { key: 'wood', basePrice: 10 },
        { key: 'herbs', basePrice: 12 },
      ];
      const result = initializeSettlementGoods(ledger, goods);
      expect(Object.keys(result.ledger)).toHaveLength(2);
      const wood = result.ledger.wood!;
      expect(wood.basePrice).toBe(10);
      expect(wood.supply).toBe(10);
      expect(wood.demand).toBe(10);
      expect(wood.currentPrice).toBe(10);
    });
  });

  describe('calculateGoodsPrice', () => {
    it('returns basePrice when demand equals supply', () => {
      expect(calculateGoodsPrice(10, 10, 10)).toBe(10);
    });

    it('increases price when demand exceeds supply', () => {
      expect(calculateGoodsPrice(10, 15, 5)).toBeGreaterThan(10);
    });

    it('decreases price when supply exceeds demand', () => {
      expect(calculateGoodsPrice(10, 5, 15)).toBeLessThan(10);
    });

    it('never returns less than 1', () => {
      expect(calculateGoodsPrice(10, 0, 100)).toBeGreaterThanOrEqual(1);
    });

    it('returns 1 for non-positive basePrice', () => {
      expect(calculateGoodsPrice(0, 10, 10)).toBe(1);
      expect(calculateGoodsPrice(-5, 10, 10)).toBe(1);
    });

    it('uses default elasticity k = PRICE_ELASTICITY_K', () => {
      expect(PRICE_ELASTICITY_K).toBe(0.1);
    });

    it('computes exact formula Price(i) = BasePrice * (1 + k * (Demand - Supply))', () => {
      const basePrice = 100;
      const demand = 20;
      const supply = 10;
      const k = 0.1;
      const expected = Math.floor(basePrice * (1 + k * (demand - supply)));
      expect(calculateGoodsPrice(basePrice, demand, supply, k)).toBe(expected);
    });

    it('computes exact formula with custom k', () => {
      const basePrice = 50;
      const demand = 15;
      const supply = 5;
      const k = 0.2;
      const expected = Math.floor(basePrice * (1 + k * (demand - supply)));
      expect(calculateGoodsPrice(basePrice, demand, supply, k)).toBe(expected);
    });

    it('floors the result of the formula', () => {
      const basePrice = 10;
      const demand = 11;
      const supply = 10;
      const k = 0.15;
      const expected = Math.floor(basePrice * (1 + k * (demand - supply)));
      expect(calculateGoodsPrice(basePrice, demand, supply, k)).toBe(expected);
    });
  });

  describe('calculateSettlementSupply', () => {
    it('returns higher supply for cities than outposts', () => {
      const village = createMockSettlement({ type: 'village' });
      const city = createMockSettlement({ type: 'city', worldId: 1 });
      const villageSupply = calculateSettlementSupply(village, 'raw_material', 0);
      const citySupply = calculateSettlementSupply(city, 'raw_material', 0);
      expect(citySupply).toBeGreaterThan(villageSupply);
    });

    it('scales with worldId', () => {
      const world1 = createMockSettlement({ type: 'village', worldId: 1 });
      const world50 = createMockSettlement({ type: 'village', worldId: 50 });
      const supply1 = calculateSettlementSupply(world1, 'raw_material', 0);
      const supply50 = calculateSettlementSupply(world50, 'raw_material', 0);
      expect(supply50).toBeGreaterThan(supply1);
    });
  });

  describe('calculateSettlementDemand', () => {
    it('returns higher demand for cities than outposts', () => {
      const village = createMockSettlement({ type: 'village' });
      const city = createMockSettlement({ type: 'city', worldId: 1 });
      const villageDemand = calculateSettlementDemand(village, 'raw_material', 0);
      const cityDemand = calculateSettlementDemand(city, 'raw_material', 0);
      expect(cityDemand).toBeGreaterThan(villageDemand);
    });

    it('applies category bonus to demand', () => {
      const settlement = createMockSettlement({ type: 'village', worldId: 1 });
      const rawDemand = calculateSettlementDemand(settlement, 'raw_material', 0);
      const foodDemand = calculateSettlementDemand(settlement, 'food', 0);
      expect(foodDemand).toBeGreaterThan(rawDemand);
    });
  });

  describe('tickSettlementEconomy', () => {
    it('does nothing when turnsElapsed is 0', () => {
      const ledger = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const result = tickSettlementEconomy(ledger, settlement, 0, [{ key: 'wood', basePrice: 10 }]);
      expect(result).toBe(ledger);
    });

    it('initializes missing goods on first tick', () => {
      const ledger = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const result = tickSettlementEconomy(ledger, settlement, 1, [{ key: 'wood', basePrice: 10 }]);
      const wood = result.ledger.wood!;
      expect(wood.basePrice).toBe(10);
    });

    it('updates lastTickTurn correctly', () => {
      const ledger = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const result = tickSettlementEconomy(ledger, settlement, 5, [{ key: 'wood', basePrice: 10 }]);
      expect(result.lastTickTurn).toBe(5);
    });

    it('updates prices based on supply and demand', () => {
      const ledger = createSettlementLedger('settlement-1');
      const village = createMockSettlement({ type: 'village' });
      const city = createMockSettlement({ type: 'city', worldId: 1 });
      const goods = [{ key: 'wood', basePrice: 10 }];

      const villageResult = tickSettlementEconomy(ledger, village, 1, goods);
      const cityResult = tickSettlementEconomy(ledger, city, 1, goods);

      const villageWood = villageResult.ledger.wood!;
      const cityWood = cityResult.ledger.wood!;
      expect(villageWood.supply).toBeGreaterThanOrEqual(1);
      expect(villageWood.demand).toBeGreaterThanOrEqual(1);
      expect(villageWood.currentPrice).toBeGreaterThanOrEqual(1);
    });

    it('produces deterministic results for the same turn count', () => {
      const ledger1 = createSettlementLedger('settlement-1');
      const ledger2 = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const goods = [{ key: 'wood', basePrice: 10 }];

      const result1 = tickSettlementEconomy(ledger1, settlement, 10, goods);
      const result2 = tickSettlementEconomy(ledger2, settlement, 10, goods);

      const wood1 = result1.ledger.wood!;
      const wood2 = result2.ledger.wood!;
      expect(wood1.supply).toBe(wood2.supply);
      expect(wood1.demand).toBe(wood2.demand);
      expect(wood1.currentPrice).toBe(wood2.currentPrice);
    });

    it('applies optional rng when provided', () => {
      const ledger = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const goods = [{ key: 'wood', basePrice: 10 }];
      const fixedRng = () => 0.9;
      const result = tickSettlementEconomy(ledger, settlement, 1, goods, fixedRng);

      const supply = calculateSettlementSupply(settlement, 'raw_material', 1);
      const demand = calculateSettlementDemand(settlement, 'raw_material', 1);
      const wood = result.ledger.wood!;
      expect(wood.supply).toBe(Math.max(1, supply + 1));
      expect(wood.demand).toBe(Math.max(1, demand + 1));
    });

    it('uses supplied basePrice for new goods instead of template default', () => {
      const ledger = createSettlementLedger('settlement-1');
      const settlement = createMockSettlement();
      const customPrice = 999;
      const goods = [{ key: 'wood', basePrice: customPrice }];
      const result = tickSettlementEconomy(ledger, settlement, 1, goods);
      const wood = result.ledger.wood!;
      expect(wood.basePrice).toBe(customPrice);
      expect(wood.currentPrice).toBeGreaterThanOrEqual(1);
    });
  });
});
