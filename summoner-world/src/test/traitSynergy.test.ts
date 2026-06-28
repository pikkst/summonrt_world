import { describe, it, expect } from 'vitest';
import { 
  TRAIT_SYNERGIES, 
  getSynergyForTraits, 
  getAllSynergies, 
  getTraitSynergyCount,
  calculateSynergyEffects,
  getSynergyNames
} from '../data/traitSynergy';

describe('traitSynergy', () => {
  describe('TRAIT_SYNERGIES', () => {
    it('contains at least 50 documented trait combinations', () => {
      expect(TRAIT_SYNERGIES.length).toBeGreaterThanOrEqual(50);
    });

    it('each synergy has required fields', () => {
      TRAIT_SYNERGIES.forEach(synergy => {
        expect(synergy.key).toBeDefined();
        expect(synergy.name).toBeDefined();
        expect(synergy.description).toBeDefined();
        expect(synergy.effect).toBeDefined();
      });
    });
  });

  describe('getSynergyForTraits', () => {
    it('returns correct synergy for regeneration + poison', () => {
      const synergy = getSynergyForTraits('poison', 'regeneration');
      expect(synergy).toBeDefined();
      expect(synergy?.name).toBe('Acidic Recovery');
    });

    it('returns undefined for non-synergistic traits', () => {
      const synergy = getSynergyForTraits('unknown_trait_a', 'unknown_trait_b');
      expect(synergy).toBeUndefined();
    });

    it('handles trait order independence', () => {
      const synergy1 = getSynergyForTraits('poison', 'regeneration');
      const synergy2 = getSynergyForTraits('regeneration', 'poison');
      expect(synergy1?.key).toBe(synergy2?.key);
    });
  });

  describe('getAllSynergies', () => {
    it('returns a copy of the synergies array', () => {
      const synergies1 = getAllSynergies();
      const synergies2 = getAllSynergies();
      expect(synergies1).not.toBe(synergies2);
      expect(synergies1.length).toBe(synergies2.length);
    });

    it('returns at least 50 synergies', () => {
      const synergies = getAllSynergies();
      expect(synergies.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('getTraitSynergyCount', () => {
    it('returns the correct count of synergies', () => {
      expect(getTraitSynergyCount()).toBe(TRAIT_SYNERGIES.length);
      expect(getTraitSynergyCount()).toBeGreaterThanOrEqual(50);
    });
  });

  describe('calculateSynergyEffects', () => {
    it('returns empty bonuses for single trait', () => {
      const result = calculateSynergyEffects(['regeneration']);
      expect(result.statBonuses).toEqual({});
      expect(result.specialEffects).toEqual([]);
    });

    it('returns stat bonuses for synergistic trait pair', () => {
      const result = calculateSynergyEffects(['poison', 'regeneration']);
      expect(result.statBonuses['attack']).toBeGreaterThan(0);
      expect(result.specialEffects.length).toBeGreaterThan(0);
    });

    it('accumulates bonuses from multiple synergies', () => {
      const result = calculateSynergyEffects(['poison', 'regeneration', 'sturdy', 'tough']);
      expect(result.statBonuses['attack']).toBeGreaterThan(0);
      expect(result.statBonuses['defense']).toBeGreaterThan(0);
    });
  });

  describe('getSynergyNames', () => {
    it('returns synergy names for trait pairs', () => {
      const names = getSynergyNames(['poison', 'regeneration', 'sturdy', 'tough']);
      expect(names).toContain('Acidic Recovery');
      expect(names).toContain('Impenetrable Defense');
    });

    it('returns empty array for single trait', () => {
      const names = getSynergyNames(['regeneration']);
      expect(names).toEqual([]);
    });
  });
});