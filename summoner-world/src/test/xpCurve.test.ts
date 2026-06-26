import { describe, it, expect } from 'vitest';
import { getXPThreshold, getCumulativeXP, getXPForLevel, getWorldModifier, getAffinityBonusXP, calculateEncounterXP, type Element } from '../core/xpCurve';

describe('getXPThreshold', () => {
  it('Level 1 threshold equals 100 XP', () => {
    expect(getXPThreshold(1)).toBe(100n);
  });

  it('Level 2 threshold equals 115 XP', () => {
    expect(getXPThreshold(2)).toBe(115n);
  });

  it('Level 10 threshold matches formula', () => {
    expect(getXPThreshold(10)).toBe(352n);
  });

  it('Level 1000 threshold is calculable without overflow', () => {
    const result = getXPThreshold(1000);
    expect(typeof result).toBe('bigint');
    expect(result > 0n).toBe(true);
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
