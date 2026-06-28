import { describe, it, expect } from 'vitest';
import {
  getAffectionLevel,
  getAffectionLevelInfo,
  getAffectionDamageMultiplier,
  getAffectionXPBonus,
  applyAffectionGain,
  type AffectionLevel,
} from '../core/affection';
import type { CreatureInstance } from '../types/game';

const createTestCreature = (overrides: Partial<CreatureInstance> = {}): CreatureInstance => ({
  id: 'test-creature',
  templateKey: 'test_template',
  nickname: 'Test Creature',
  level: 1,
  experience: 0n,
  currentHealth: 50,
  currentMana: 20,
  maxHealth: 50,
  maxMana: 20,
  attack: 10,
  defense: 5,
  speed: 5,
  skills: [],
  traits: [],
  mutations: [],
  affection: 0,
  ...overrides,
});

describe('getAffectionLevel', () => {
  it('returns level 1 for affection 0-19', () => {
    expect(getAffectionLevel(0)).toBe(1);
    expect(getAffectionLevel(10)).toBe(1);
    expect(getAffectionLevel(19)).toBe(1);
  });

  it('returns level 2 for affection 20-39', () => {
    expect(getAffectionLevel(20)).toBe(2);
    expect(getAffectionLevel(30)).toBe(2);
    expect(getAffectionLevel(39)).toBe(2);
  });

  it('returns level 3 for affection 40-59', () => {
    expect(getAffectionLevel(40)).toBe(3);
    expect(getAffectionLevel(50)).toBe(3);
    expect(getAffectionLevel(59)).toBe(3);
  });

  it('returns level 4 for affection 60-79', () => {
    expect(getAffectionLevel(60)).toBe(4);
    expect(getAffectionLevel(70)).toBe(4);
    expect(getAffectionLevel(79)).toBe(4);
  });

  it('returns level 5 for affection 80-100', () => {
    expect(getAffectionLevel(80)).toBe(5);
    expect(getAffectionLevel(90)).toBe(5);
    expect(getAffectionLevel(100)).toBe(5);
  });
});

describe('getAffectionLevelInfo', () => {
  it('returns correct info for each level', () => {
    const level1 = getAffectionLevelInfo(1);
    expect(level1.minAffection).toBe(0);
    expect(level1.maxAffection).toBe(19);
    expect(level1.damageMultiplier).toBe(1.0);
    expect(level1.xpBonusMultiplier).toBe(1.0);

    const level3 = getAffectionLevelInfo(3);
    expect(level3.minAffection).toBe(40);
    expect(level3.damageMultiplier).toBe(1.15);
    expect(level3.xpBonusMultiplier).toBe(1.2);

    const level5 = getAffectionLevelInfo(5);
    expect(level5.minAffection).toBe(80);
    expect(level5.damageMultiplier).toBe(1.4);
    expect(level5.xpBonusMultiplier).toBe(1.5);
  });
});

describe('getAffectionDamageMultiplier', () => {
  it('returns 1.0x for level 1 affection', () => {
    const creature = createTestCreature({ affection: 10 });
    expect(getAffectionDamageMultiplier(creature)).toBe(1.0);
  });

  it('returns 1.07x for level 2 affection', () => {
    const creature = createTestCreature({ affection: 30 });
    expect(getAffectionDamageMultiplier(creature)).toBe(1.07);
  });

  it('returns 1.15x for level 3 affection', () => {
    const creature = createTestCreature({ affection: 50 });
    expect(getAffectionDamageMultiplier(creature)).toBe(1.15);
  });

  it('returns 1.25x for level 4 affection', () => {
    const creature = createTestCreature({ affection: 70 });
    expect(getAffectionDamageMultiplier(creature)).toBe(1.25);
  });

  it('returns 1.4x for level 5 affection', () => {
    const creature = createTestCreature({ affection: 90 });
    expect(getAffectionDamageMultiplier(creature)).toBe(1.4);
  });
});

describe('getAffectionXPBonus', () => {
  it('returns 1.0x for level 1 affection', () => {
    const creature = createTestCreature({ affection: 10 });
    expect(getAffectionXPBonus(creature)).toBe(1.0);
  });

  it('returns 1.1x for level 2 affection', () => {
    const creature = createTestCreature({ affection: 30 });
    expect(getAffectionXPBonus(creature)).toBe(1.1);
  });

  it('returns 1.2x for level 3 affection', () => {
    const creature = createTestCreature({ affection: 50 });
    expect(getAffectionXPBonus(creature)).toBe(1.2);
  });

  it('returns 1.35x for level 4 affection', () => {
    const creature = createTestCreature({ affection: 70 });
    expect(getAffectionXPBonus(creature)).toBe(1.35);
  });

  it('returns 1.5x for level 5 affection', () => {
    const creature = createTestCreature({ affection: 90 });
    expect(getAffectionXPBonus(creature)).toBe(1.5);
  });
});

describe('applyAffectionGain', () => {
  it('grants 8 affection for victory source', () => {
    const creature = createTestCreature({ affection: 50 });
    const updated = applyAffectionGain(creature, 'victory');
    expect(updated.affection).toBe(58);
  });

  it('grants 5 affection for training source', () => {
    const creature = createTestCreature({ affection: 30 });
    const updated = applyAffectionGain(creature, 'training');
    expect(updated.affection).toBe(35);
  });

  it('grants 10 affection for capture source', () => {
    const creature = createTestCreature({ affection: 0 });
    const updated = applyAffectionGain(creature, 'capture');
    expect(updated.affection).toBe(10);
  });

  it('caps affection at 100', () => {
    const creature = createTestCreature({ affection: 95 });
    const updated = applyAffectionGain(creature, 'victory');
    expect(updated.affection).toBe(100);
  });

  it('preserves all other creature properties', () => {
    const creature = createTestCreature({
      affection: 20,
      level: 5,
      attack: 15,
      defense: 8,
    });
    const updated = applyAffectionGain(creature, 'training');
    expect(updated.level).toBe(5);
    expect(updated.attack).toBe(15);
    expect(updated.defense).toBe(8);
  });

  it('handles undefined affection as 0', () => {
    const creature = createTestCreature({ affection: undefined as unknown as number });
    const updated = applyAffectionGain(creature, 'capture');
    expect(updated.affection).toBe(10);
  });
});

describe('affection level boundaries', () => {
  it('damage multiplier increases with each level', () => {
    const multipliers: number[] = [];
    for (const level of [1, 2, 3, 4, 5] as AffectionLevel[]) {
      const info = getAffectionLevelInfo(level);
      const creature = createTestCreature({ affection: info.minAffection });
      multipliers.push(getAffectionDamageMultiplier(creature));
    }
    for (let i = 1; i < multipliers.length; i++) {
      expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]!);
    }
  });

  it('XP bonus increases with each level', () => {
    const bonuses: number[] = [];
    for (const level of [1, 2, 3, 4, 5] as AffectionLevel[]) {
      const info = getAffectionLevelInfo(level);
      const creature = createTestCreature({ affection: info.minAffection });
      bonuses.push(getAffectionXPBonus(creature));
    }
    for (let i = 1; i < bonuses.length; i++) {
      expect(bonuses[i]).toBeGreaterThan(bonuses[i - 1]!);
    }
  });
});