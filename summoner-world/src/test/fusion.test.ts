import { describe, it, expect } from 'vitest';
import { getFusionResult, isLightDarknessFusion, UNSTABLE_VOID_CREATURE, getAllPairKeys } from '../data/fusionMatrix';

describe('fusionMatrix', () => {
  describe('getFusionResult', () => {
    it('returns correct result for standard element combinations', () => {
      expect(getFusionResult('fire', 'air')).toBe('storm');
      expect(getFusionResult('water', 'ice')).toBe('glacier');
      expect(getFusionResult('earth', 'fire')).toBe('magma');
    });

    it('returns same element when both elements are identical', () => {
      expect(getFusionResult('fire', 'fire')).toBe('fire');
      expect(getFusionResult('water', 'water')).toBe('water');
      expect(getFusionResult('light', 'light')).toBe('light');
    });

    it('returns undefined for invalid element combinations', () => {
      expect(getFusionResult('invalid', 'fire')).toBeUndefined();
    });
  });

  describe('Light+Darkness special fusion (T5.2)', () => {
    it('should have 5% chance to produce Aether with uniform RNG', () => {
      const outcomes: string[] = [];
      let roll = 0;
      const mockRng = () => {
        const result = roll;
        roll += 0.01;
        if (roll > 1) roll = 0;
        return result;
      };

      for (let i = 0; i < 100; i++) {
        outcomes.push(getFusionResult('light', 'darkness', mockRng)!);
      }

      const aetherCount = outcomes.filter(o => o === 'aether').length;
      const voidCount = outcomes.filter(o => o === 'unstable_void').length;

      expect(aetherCount + voidCount).toBe(100);
      expect(aetherCount).toBe(5);
      expect(voidCount).toBe(95);
    });

    it('should return unstable_void when roll is >= 0.05', () => {
      const mockRng = () => 0.5;
      expect(getFusionResult('light', 'darkness', mockRng)).toBe('unstable_void');
      expect(getFusionResult('darkness', 'light', mockRng)).toBe('unstable_void');
    });

    it('should return aether when roll is < 0.05', () => {
      const mockRng = () => 0.03;
      expect(getFusionResult('light', 'darkness', mockRng)).toBe('aether');
      expect(getFusionResult('darkness', 'light', mockRng)).toBe('aether');
    });

    it('should return aether on roll exactly 0.049', () => {
      const mockRng = () => 0.049;
      expect(getFusionResult('light', 'darkness', mockRng)).toBe('aether');
    });

    it('should return unstable_void on roll exactly 0.05', () => {
      const mockRng = () => 0.05;
      expect(getFusionResult('light', 'darkness', mockRng)).toBe('unstable_void');
    });

    it('handles case-insensitive element names for special fusion', () => {
      const mockRng = () => 0.03;
      expect(getFusionResult('Light', 'Darkness', mockRng)).toBe('aether');
      expect(getFusionResult('DARKNESS', 'LIGHT', mockRng)).toBe('aether');
    });

    it('returns sorted combination key for special fusion', () => {
      const mockRng = () => 0.6;
      expect(getFusionResult('darkness', 'light', mockRng)).toBe('unstable_void');
    });
  });

  describe('isLightDarknessFusion', () => {
    it('returns true for light+darkness combinations', () => {
      expect(isLightDarknessFusion('light', 'darkness')).toBe(true);
      expect(isLightDarknessFusion('darkness', 'light')).toBe(true);
      expect(isLightDarknessFusion('Light', 'Darkness')).toBe(true);
    });

    it('returns false for other combinations', () => {
      expect(isLightDarknessFusion('fire', 'water')).toBe(false);
      expect(isLightDarknessFusion('light', 'light')).toBe(false);
      expect(isLightDarknessFusion('darkness', 'darkness')).toBe(false);
    });
  });

  describe('UNSTABLE_VOID_CREATURE', () => {
    it('has correct base stats', () => {
      expect(UNSTABLE_VOID_CREATURE.key).toBe('unstable_void');
      expect(UNSTABLE_VOID_CREATURE.name).toBe('Unstable Void Creature');
      expect(UNSTABLE_VOID_CREATURE.class).toBe('rare');
      expect(UNSTABLE_VOID_CREATURE.type).toBe('demon');
      expect(UNSTABLE_VOID_CREATURE.elements).toContain('void');
      expect(UNSTABLE_VOID_CREATURE.isBoss).toBe(false);
    });

    it('has valid stat values', () => {
      expect(UNSTABLE_VOID_CREATURE.baseHealth).toBe(45);
      expect(UNSTABLE_VOID_CREATURE.baseAttack).toBe(12);
      expect(UNSTABLE_VOID_CREATURE.baseDefense).toBe(8);
      expect(UNSTABLE_VOID_CREATURE.baseSpeed).toBe(7);
      expect(UNSTABLE_VOID_CREATURE.baseMana).toBe(35);
    });

    it('has void blast skill', () => {
      const voidBlastSkill = UNSTABLE_VOID_CREATURE.skills.find(s => s.key === 'void_blast');
      expect(voidBlastSkill).toBeDefined();
      expect(voidBlastSkill?.element).toBe('void');
    });
  });

  describe('getAllPairKeys', () => {
    it('returns all fusion matrix keys including darkness+light', () => {
      const keys = getAllPairKeys();
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('darkness+light');
    });

    it('does not include unstable_void as a key since it is generated dynamically', () => {
      const keys = getAllPairKeys();
      expect(keys).not.toContain('unstable_void');
    });
  });
});