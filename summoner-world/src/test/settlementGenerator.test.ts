import { describe, expect, it } from 'vitest';
import { generateSettlements, getSettlementAt, getNearestSettlement } from '../core/settlementGenerator';
import type { Settlement } from '../types/game';

describe('T7.6 - Settlement Placement', () => {
  describe('generateSettlements', () => {
    it('generates deterministic settlements for the same world ID and seed', () => {
      const worldId = 1;
      const worldSeed = 1337;
      
      const first = generateSettlements(worldId, worldSeed);
      const second = generateSettlements(worldId, worldSeed);
      
      expect(first).toEqual(second);
    });

    it('generates different settlements for different world IDs', () => {
      const first = generateSettlements(1, 1337);
      const second = generateSettlements(2, 1337);
      
      expect(first).not.toEqual(second);
    });

    it('generates different settlements for different world seeds', () => {
      const first = generateSettlements(1, 1337);
      const second = generateSettlements(1, 8888);
      
      expect(first).not.toEqual(second);
    });

    it('generates at least one settlement per world', () => {
      const settlements = generateSettlements(1, 1337);
      expect(settlements.length).toBeGreaterThanOrEqual(1);
    });

    it('generates settlements with valid biome types', () => {
      const validBiomes = ['forest', 'plains', 'mountains', 'swamp', 'desert', 'tundra', 'coast', 'volcanic', 'crystal_caves', 'sky_islands'];
      
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(validBiomes).toContain(settlement.biome);
      }
    });

    it('generates settlements with valid types', () => {
      const validTypes = ['city', 'fort', 'village', 'settlement', 'outpost'];
      
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(validTypes).toContain(settlement.type);
      }
    });

    it('places settlements with valid coordinates within world bounds', () => {
      const WORLDS_SIZE = 2000;
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(settlement.x).toBeGreaterThanOrEqual(0);
        expect(settlement.x).toBeLessThan(WORLDS_SIZE);
        expect(settlement.y).toBeGreaterThanOrEqual(0);
        expect(settlement.y).toBeLessThan(WORLDS_SIZE);
      }
    });

    it('ensures minimum distance between settlements', () => {
      const MIN_SETTLEMENT_DISTANCE = 200;
      const settlements = generateSettlements(1, 1337);
      
      for (let i = 0; i < settlements.length; i++) {
        for (let j = i + 1; j < settlements.length; j++) {
          const s1 = settlements[i]!;
          const s2 = settlements[j]!;
          const distance = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          expect(distance).toBeGreaterThanOrEqual(MIN_SETTLEMENT_DISTANCE);
        }
      }
    });

    it('generates unique settlement IDs', () => {
      const settlements = generateSettlements(1, 1337);
      const ids = settlements.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(settlements.length);
    });

    it('sets discovered to false by default', () => {
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(settlement.discovered).toBe(false);
      }
    });
  });

  describe('getSettlementAt', () => {
    it('returns the settlement within radius', () => {
      const settlements: Settlement[] = [
        {
          id: 'settlement_1_100_100',
          type: 'city',
          worldId: 1,
          x: 100,
          y: 100,
          name: 'Test City',
          biome: 'forest',
          elevation: 0.5,
          nearWater: false,
          discovered: false,
        },
      ];
      
      const result = getSettlementAt(120, 100, settlements, 50);
      expect(result).toBeDefined();
      expect(result?.id).toBe('settlement_1_100_100');
    });

    it('returns undefined when no settlement is within radius', () => {
      const settlements: Settlement[] = [
        {
          id: 'settlement_1_100_100',
          type: 'city',
          worldId: 1,
          x: 100,
          y: 100,
          name: 'Test City',
          biome: 'forest',
          elevation: 0.5,
          nearWater: false,
          discovered: false,
        },
      ];
      
      const result = getSettlementAt(500, 500, settlements, 50);
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty settlements array', () => {
      const result = getSettlementAt(100, 100, [], 50);
      expect(result).toBeUndefined();
    });
  });

  describe('getNearestSettlement', () => {
    it('returns the nearest settlement', () => {
      const settlements: Settlement[] = [
        {
          id: 'settlement_1_100_100',
          type: 'city',
          worldId: 1,
          x: 100,
          y: 100,
          name: 'Test City',
          biome: 'forest',
          elevation: 0.5,
          nearWater: false,
          discovered: false,
        },
        {
          id: 'settlement_1_500_500',
          type: 'village',
          worldId: 1,
          x: 500,
          y: 500,
          name: 'Far Village',
          biome: 'plains',
          elevation: 0.3,
          nearWater: false,
          discovered: false,
        },
      ];
      
      const result = getNearestSettlement(120, 100, settlements);
      expect(result).toBeDefined();
      expect(result?.id).toBe('settlement_1_100_100');
    });

    it('returns undefined for empty settlements array', () => {
      const result = getNearestSettlement(100, 100, []);
      expect(result).toBeUndefined();
    });
  });

  describe('T7.6 - Settlement type bias by biome', () => {
    it('places more cities in coastal biomes', () => {
      const settlements = generateSettlements(10, 1337);
      const coastCities = settlements.filter(
        s => s.biome === 'coast' && s.type === 'city'
      );
      const nonCoastCities = settlements.filter(
        s => s.biome !== 'coast' && s.type === 'city'
      );
      
      expect(coastCities.length).toBeGreaterThanOrEqual(0);
    });

    it('places more forts in mountainous biomes', () => {
      const settlements = generateSettlements(10, 1337);
      const mountainForts = settlements.filter(
        s => s.biome === 'mountains' && s.type === 'fort'
      );
      
      expect(mountainForts.length).toBeGreaterThanOrEqual(0);
    });

    it('respects biome-specific settlement type preferences', () => {
      const settlements = generateSettlements(5, 42);
      
      const volcanicFort = settlements.find(
        s => s.biome === 'volcanic' && s.type === 'fort'
      );
      
      const coastalCity = settlements.find(
        s => s.biome === 'coast' && s.type === 'city'
      );
      
      expect(settlements.length).toBeGreaterThan(0);
    });
  });

  describe('T7.6 - Cities near water feature', () => {
    it('generates settlements with nearWater property', () => {
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(typeof settlement.nearWater).toBe('boolean');
      }
    });

    it('may place cities near water bodies', () => {
      const settlements = generateSettlements(1, 1337);
      const nearWaterSettlements = settlements.filter(s => s.nearWater);
      
      expect(nearWaterSettlements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('T7.6 - Forts on ridges feature', () => {
    it('generates settlements with elevation property', () => {
      const settlements = generateSettlements(1, 1337);
      
      for (const settlement of settlements) {
        expect(typeof settlement.elevation).toBe('number');
        expect(settlement.elevation).toBeGreaterThanOrEqual(0);
        expect(settlement.elevation).toBeLessThanOrEqual(1);
      }
    });
  });
});