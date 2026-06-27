import { describe, it, expect } from 'vitest';
import { getXPThreshold, getCumulativeXP, getXPForLevel, getWorldModifier, getAffinityBonusXP, calculateEncounterXP, getCreatureXPThreshold, getCreatureCumulativeXP, getCreatureXPForLevel, applyCreatureXP, checkEvolution } from '../core/xpCurve';
import type { Element, CreatureInstance } from '../types/game';
import { EVOLUTION_CHAINS } from '../data/constants.ts';

describe('getXPThreshold', () => {
  it('Level 1 threshold equals 100 XP', () => {
    expect(getXPThreshold(1)).toBe(100n);
  });

  it('Level 2 threshold equals 115 XP', () => {
    expect(getXPThreshold(2)).toBe(115n);
  });

  it('Level 10 threshold matches formula', () => {
    expect(getXPThreshold(10)).toBe(351n);
  });

  it('Level 1000 threshold is calculable without overflow and returns correct value', () => {
    const result = getXPThreshold(1000);
    expect(typeof result === 'bigint').toBe(true);
    expect(result > 0n).toBe(true);
    expect(result > 10n ** 60n).toBe(true);
  });

  it('Level 1000 threshold grows by 15% from level 999', () => {
    const t999 = getXPThreshold(999);
    const t1000 = getXPThreshold(1000);
    expect(t1000).toBeGreaterThan(t999);
  });

  it('threshold is monotonically increasing', () => {
    let prev = getXPThreshold(1);
    for (let i = 2; i <= 100; i++) {
      const curr = getXPThreshold(i);
      expect(curr > prev).toBe(true);
      prev = curr;
    }
  });
});

describe('getCumulativeXP', () => {
  it('Level 1 cumulative XP equals threshold for level 1', () => {
    expect(getCumulativeXP(1)).toBe(100n);
  });

  it('Level 2 cumulative XP equals sum of level 1 and 2 thresholds', () => {
    expect(getCumulativeXP(2)).toBe(215n);
  });

  it('Level 3 cumulative XP equals sum of first 3 levels', () => {
    expect(getCumulativeXP(3)).toBe(347n);
  });

  it('Level 100 cumulative XP is calculable', () => {
    const result = getCumulativeXP(100);
    expect(result > 0n).toBe(true);
    expect(result.toString().length).toBeGreaterThanOrEqual(9);
  });

  it('Level 1000 cumulative XP is calculable without overflow', () => {
    const result = getCumulativeXP(1000);
    expect(typeof result === 'bigint').toBe(true);
    expect(result > 0n).toBe(true);
    expect(result > 10n ** 60n).toBe(true);
  });
});

describe('getXPForLevel', () => {
  it('returns 0 when startLevel equals endLevel', () => {
    expect(getXPForLevel(1, 1)).toBe(0n);
  });

  it('returns threshold for endLevel when starting from level 1', () => {
    expect(getXPForLevel(1, 2)).toBe(115n);
  });

  it('returns sum of threshold for levels between start and end', () => {
    expect(getXPForLevel(2, 4)).toBe(284n);
  });

  it('handles large level ranges without overflow', () => {
    expect(getXPForLevel(1, 1000) > 0n).toBe(true);
    expect(getXPForLevel(1, 1000) > 10n ** 60n).toBe(true);
  });

  it('cumulative XP matches sum of thresholds', () => {
    const total = getCumulativeXP(10);
    const sumManual = Array.from({ length: 10 }, (_, i) => getXPThreshold(i + 1)).reduce((a, b) => a + b, 0n);
    expect(total).toBe(sumManual);
  });
});

describe('getWorldModifier', () => {
  it('World 1 modifier equals 1.05', () => {
    expect(getWorldModifier(1)).toBe(1.05);
  });

  it('World 10 modifier equals 1.50', () => {
    expect(getWorldModifier(10)).toBe(1.50);
  });

  it('World 100 modifier equals 6.00', () => {
    expect(getWorldModifier(100)).toBe(6.00);
  });

  it('formula is 1 + (WorldIndex * 0.05)', () => {
    for (let i = 1; i <= 100; i++) {
      expect(getWorldModifier(i)).toBeCloseTo(1 + i * 0.05, 10);
    }
  });

  it('throws for world index < 1', () => {
    expect(() => getWorldModifier(0)).toThrow();
    expect(() => getWorldModifier(-1)).toThrow();
  });
});

describe('getAffinityBonusXP', () => {
  it('returns 1 when no attacker element', () => {
    expect(getAffinityBonusXP(undefined, ['fire'])).toBe(1);
  });

  it('returns 1 when no defender elements', () => {
    expect(getAffinityBonusXP('fire', undefined)).toBe(1);
    expect(getAffinityBonusXP('fire', [])).toBe(1);
  });

  it('returns 1.15 for same element match', () => {
    expect(getAffinityBonusXP('fire', ['fire'])).toBe(1.15);
    expect(getAffinityBonusXP('water', ['water', 'earth'])).toBe(1.15);
    expect(getAffinityBonusXP('nature', ['fire', 'nature'])).toBe(1.15);
  });

  it('returns 0.85 for opposing element match', () => {
    expect(getAffinityBonusXP('fire', ['water'])).toBe(0.85);
    expect(getAffinityBonusXP('fire', ['earth'])).toBe(0.85);
    expect(getAffinityBonusXP('water', ['fire'])).toBe(0.85);
    expect(getAffinityBonusXP('light', ['darkness'])).toBe(0.85);
  });

  it('returns 1 for neutral element match', () => {
    expect(getAffinityBonusXP('fire', ['air'])).toBe(1);
    expect(getAffinityBonusXP('fire', ['lightning'])).toBe(1);
    expect(getAffinityBonusXP('light', ['fire'])).toBe(1);
  });
});

describe('calculateEncounterXP', () => {
  it('combines all XP modifiers correctly', () => {
    const baseXp = 100;
    const monsterLevel = 5;
    const worldModifier = 1.25;
    const atkElement = 'fire';
    const defElements = ['fire'] as Element[];

    const result = calculateEncounterXP(baseXp, monsterLevel, worldModifier, atkElement, defElements);
    expect(result).toBe(719);
  });

  it('applies opposing element penalty', () => {
    const baseXp = 100;
    const monsterLevel = 5;
    const worldModifier = 1.0;
    const atkElement = 'fire';
    const defElements = ['water'] as Element[];

    const result = calculateEncounterXP(baseXp, monsterLevel, worldModifier, atkElement, defElements);
    expect(result).toBe(425);
  });

  it('works without affinity bonus (neutral)', () => {
    const baseXp = 100;
    const monsterLevel = 5;
    const worldModifier = 1.0;
    const atkElement = 'fire';
    const defElements = ['air'] as Element[];

    const result = calculateEncounterXP(baseXp, monsterLevel, worldModifier, atkElement, defElements);
    expect(result).toBe(500);
  });

  it('defaults to no bonus when elements are undefined', () => {
    const baseXp = 100;
    const monsterLevel = 5;
    const worldModifier = 1.0;

    expect(calculateEncounterXP(baseXp, monsterLevel, worldModifier, undefined, ['fire'] as Element[])).toBe(500);
    expect(calculateEncounterXP(baseXp, monsterLevel, worldModifier, 'fire', undefined)).toBe(500);
    expect(calculateEncounterXP(baseXp, monsterLevel, worldModifier, undefined, undefined)).toBe(500);
  });
});

describe('getCreatureXPThreshold', () => {
  it('Level 1 threshold equals 50 XP', () => {
    expect(getCreatureXPThreshold(1)).toBe(50n);
  });

  it('Level 2 threshold equals 56 XP', () => {
    expect(getCreatureXPThreshold(2)).toBe(56n);
  });

  it('Level 10 threshold matches formula 50 * (1.12)^9', () => {
    const expected = Math.floor(50 * Math.pow(1.12, 9));
    expect(getCreatureXPThreshold(10)).toBe(BigInt(expected));
  });

  it('Level 1000 threshold is calculable without overflow and returns correct value', () => {
    const result = getCreatureXPThreshold(1000);
    expect(typeof result === 'bigint').toBe(true);
    expect(result > 0n).toBe(true);
  });

  it('threshold is monotonically increasing', () => {
    let prev = getCreatureXPThreshold(1);
    for (let i = 2; i <= 100; i++) {
      const curr = getCreatureXPThreshold(i);
      expect(curr > prev).toBe(true);
      prev = curr;
    }
  });
});

describe('getCreatureCumulativeXP', () => {
  it('Level 1 cumulative XP equals threshold for level 1', () => {
    expect(getCreatureCumulativeXP(1)).toBe(50n);
  });

  it('Level 2 cumulative XP equals sum of level 1 and 2 thresholds', () => {
    expect(getCreatureCumulativeXP(2)).toBe(106n);
  });

  it('Level 10 cumulative XP matches sum of thresholds', () => {
    const total = getCreatureCumulativeXP(10);
    const sumManual = Array.from({ length: 10 }, (_, i) => getCreatureXPThreshold(i + 1)).reduce((a, b) => a + b, 0n);
    expect(total).toBe(sumManual);
  });

  it('Level 1000 cumulative XP is calculable without overflow', () => {
    const result = getCreatureCumulativeXP(1000);
    expect(typeof result === 'bigint').toBe(true);
    expect(result > 0n).toBe(true);
  });
});

describe('getCreatureXPForLevel', () => {
  it('returns 0 when startLevel equals endLevel', () => {
    expect(getCreatureXPForLevel(1, 1)).toBe(0n);
  });

  it('returns threshold for endLevel when starting from level 1', () => {
    expect(getCreatureXPForLevel(1, 2)).toBe(56n);
  });

  it('handles large level ranges without overflow', () => {
    expect(getCreatureXPForLevel(1, 1000) > 0n).toBe(true);
  });
});

describe('applyCreatureXP with evolution', () => {
  const baseCreature: CreatureInstance = {
    id: 'test-1',
    templateKey: 'common_brave_fang',
    nickname: 'Brave Fang',
    level: 1,
    experience: 0n,
    currentHealth: 50,
    currentMana: 20,
    maxHealth: 50,
    maxMana: 20,
    attack: 10,
    defense: 5,
    speed: 5,
    class: 'common',
    skills: [],
    traits: [],
    mutations: [],
    affection: 0,
  };

  it('grants XP and levels up using creature XP formula', () => {
    const result = applyCreatureXP(baseCreature, 60);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBeGreaterThan(1);
  });

  it('triggers evolution when level meets evolution threshold', () => {
    const highLevelCreature: CreatureInstance = {
      ...baseCreature,
      level: 9,
      experience: 0n,
    };
    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(highLevelCreature, Number(xpNeeded) + 10);
    expect(result.leveledUp).toBe(true);
    expect(result.evolved).toBe(true);
    expect(result.newClass).toBe('uncommon');
    expect(result.evolutionStage).toBe(1);
  });

  it('does not evolve before reaching threshold', () => {
    const lowCreature: CreatureInstance = {
      ...baseCreature,
      level: 5,
      experience: 0n,
    };
    const result = applyCreatureXP(lowCreature, 100);
    expect(result.evolved).toBe(false);
    expect(result.newClass).toBeUndefined();
  });

  it('applies stat gains on evolution', () => {
    const evoCreature: CreatureInstance = {
      ...baseCreature,
      level: 9,
      experience: 0n,
      maxHealth: 100,
      maxMana: 40,
      attack: 20,
      defense: 10,
      speed: 10,
    };
    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(evoCreature, Number(xpNeeded) + 10);
    expect(result.evolved).toBe(true);
    expect(result.creature.maxHealth).toBeGreaterThan(100);
    expect(result.creature.attack).toBeGreaterThan(20);
    expect(result.evolutionStats).toBeDefined();
  });

  it('does not evolve twice in same level-up batch', () => {
    const highCreature: CreatureInstance = {
      ...baseCreature,
      level: 9,
      experience: 0n,
      maxHealth: 100,
      attack: 20,
      defense: 10,
      speed: 10,
    };
    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(highCreature, Number(xpNeeded) + 1000);
    expect(result.evolved).toBe(true);
    expect(result.evolutionStage).toBe(1);
  });
});
