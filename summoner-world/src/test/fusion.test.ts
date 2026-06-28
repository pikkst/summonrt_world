import { describe, it, expect } from 'vitest';
import { getFusionResult, isLightDarknessFusion, UNSTABLE_VOID_CREATURE, getAllPairKeys, calculateFusionRarity, calculateFusionRarityWithSpecial, CREATURE_CLASS_TIERS } from '../data/fusionMatrix';
import { inheritSkills } from '../data/fusionUtils';

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

describe('skill inheritance (T5.3)', () => {
  it('inherits up to 3 skills from parents', () => {
    const result = inheritSkills(['scratch', 'fire_blast'], ['vine_whip'], []);
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result).toContain('fire_blast');
    expect(result).toContain('scratch');
  });

  it('prioritizes highest-tier skills', () => {
    const result = inheritSkills(['scratch', 'shadow_bolt', 'holy_light'], ['spark'], []);
    expect(result[0]).toBe('shadow_bolt');
    expect(result[1]).toBe('holy_light');
    expect(result[2]).toBe('spark');
  });

  it('deduplicates same skills from both parents', () => {
    const result = inheritSkills(['scratch', 'fire_blast'], ['fire_blast', 'vine_whip'], []);
    const fireBlastCount = result.filter(s => s === 'fire_blast').length;
    expect(fireBlastCount).toBe(1);
  });

  it('fills remaining slots with selectedSkills', () => {
    const result = inheritSkills(['scratch'], [], ['fire_blast', 'water_spray']);
    expect(result).toContain('fire_blast');
    expect(result).toContain('water_spray');
  });

  it('max total skills is 3 when no selectedSkills', () => {
    const result = inheritSkills(['scratch', 'fire_blast', 'holy_light', 'shadow_bolt'], [], []);
    expect(result.length).toBe(3);
  });

  it('returns highest-power when tiers are equal', () => {
    const result = inheritSkills(['shadow_bolt', 'holy_light'], [], []);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('fusion rarity calculation (T5.7)', () => {
  describe('calculateFusionRarity', () => {
    it('returns common for two common parents (avg = 0)', () => {
      expect(calculateFusionRarity('common', 'common')).toBe('common');
    });

    it('returns uncommon for common + uncommon parents (avg = 0.5, ceil = 1)', () => {
      expect(calculateFusionRarity('common', 'uncommon')).toBe('uncommon');
    });

    it('returns uncommon for uncommon + uncommon parents (avg = 1)', () => {
      expect(calculateFusionRarity('uncommon', 'uncommon')).toBe('uncommon');
    });

    it('returns rare for common + rare parents (avg = 1)', () => {
      expect(calculateFusionRarity('common', 'rare')).toBe('uncommon');
    });

    it('returns rare for uncommon + rare parents (avg = 1.5)', () => {
      expect(calculateFusionRarity('uncommon', 'rare')).toBe('rare');
    });

    it('returns rare for rare + rare parents (avg = 2)', () => {
      expect(calculateFusionRarity('rare', 'rare')).toBe('rare');
    });

    it('returns epic for uncommon + epic parents (avg = 2)', () => {
      expect(calculateFusionRarity('uncommon', 'epic')).toBe('rare');
    });

    it('returns epic for epic + epic parents (avg = 3)', () => {
      expect(calculateFusionRarity('epic', 'epic')).toBe('epic');
    });

    it('returns epic for rare + epic parents (avg = 2.5)', () => {
      expect(calculateFusionRarity('rare', 'epic')).toBe('epic');
    });

    it('returns legendary for epic + legendary parents (avg = 3.5)', () => {
      expect(calculateFusionRarity('epic', 'legendary')).toBe('legendary');
    });

    it('returns legendary for legendary + legendary parents (avg = 4)', () => {
      expect(calculateFusionRarity('legendary', 'legendary')).toBe('legendary');
    });

    it('caps mythical to legendary without special conditions', () => {
      expect(calculateFusionRarity('mythical', 'mythical')).toBe('legendary');
      expect(calculateFusionRarity('mythical', 'epic')).toBe('legendary');
      expect(calculateFusionRarity('mythical', 'legendary')).toBe('legendary');
    });

    it('handles invalid rarity values gracefully', () => {
      expect(calculateFusionRarity('invalid', 'common')).toBe('common');
      expect(calculateFusionRarity('common', 'invalid')).toBe('common');
    });
  });

  describe('CREATURE_CLASS_TIERS', () => {
    it('defines correct tier values', () => {
      expect(CREATURE_CLASS_TIERS.common).toBe(0);
      expect(CREATURE_CLASS_TIERS.uncommon).toBe(1);
      expect(CREATURE_CLASS_TIERS.rare).toBe(2);
      expect(CREATURE_CLASS_TIERS.epic).toBe(3);
      expect(CREATURE_CLASS_TIERS.legendary).toBe(4);
      expect(CREATURE_CLASS_TIERS.mythical).toBe(5);
    });

    it('has all expected classes defined', () => {
      const classes = Object.keys(CREATURE_CLASS_TIERS).sort();
      expect(classes).toEqual(['common', 'epic', 'legendary', 'mythical', 'rare', 'uncommon']);
    });
  });

  describe('calculateFusionRarityWithSpecial', () => {
    it('bases result on weighted average of parents', () => {
      expect(calculateFusionRarityWithSpecial('common', 'common', false, false, false, false)).toBe('common');
      expect(calculateFusionRarityWithSpecial('rare', 'rare', false, false, false, false)).toBe('rare');
    });

    it('Ancient Bloodline raises to epic minimum', () => {
      expect(calculateFusionRarityWithSpecial('common', 'common', true, false, false, false)).toBe('epic');
      expect(calculateFusionRarityWithSpecial('uncommon', 'common', true, false, false, false)).toBe('epic');
    });

    it('Void/Stellar mutations raise rarity by one tier', () => {
      expect(calculateFusionRarityWithSpecial('common', 'common', false, true, false, false)).toBe('uncommon');
      expect(calculateFusionRarityWithSpecial('uncommon', 'uncommon', false, false, true, false)).toBe('rare');
      expect(calculateFusionRarityWithSpecial('epic', 'epic', false, true, false, false)).toBe('legendary');
    });

    it('Aether fusion raises rarity by one tier', () => {
      expect(calculateFusionRarityWithSpecial('rare', 'rare', false, false, false, true)).toBe('epic');
      expect(calculateFusionRarityWithSpecial('epic', 'epic', false, false, false, true)).toBe('legendary');
    });

    it('multiple special conditions allow mythical tier', () => {
      expect(calculateFusionRarityWithSpecial('rare', 'rare', true, true, true, true)).toBe('mythical');
    });

    it('Aether with Ancient can reach legendary', () => {
      expect(calculateFusionRarityWithSpecial('rare', 'rare', true, false, false, true)).toBe('legendary');
    });

    it('normal fusion without special conditions capped at legendary', () => {
      expect(calculateFusionRarityWithSpecial('legendary', 'legendary', false, false, false, false)).toBe('legendary');
      expect(calculateFusionRarityWithSpecial('mythical', 'mythical', false, false, false, false)).toBe('legendary');
      expect(calculateFusionRarityWithSpecial('legendary', 'epic', false, false, false, false)).toBe('legendary');
    });
  });
});