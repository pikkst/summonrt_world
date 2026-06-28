import { describe, it, expect } from 'vitest';
import type { CreatureInstance } from '../types/game';

describe('fusionRecipe (T5.8)', () => {
  it('CreatureInstance type accepts fusionRecipe property', () => {
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: 'fused_fang_wyrm',
      level: 1,
      experience: 0n,
      currentHealth: 50,
      currentMana: 20,
      maxHealth: 50,
      maxMana: 20,
      attack: 12,
      defense: 8,
      speed: 6,
      skills: [],
      traits: [],
      mutations: [],
      affection: 5,
      class: 'uncommon',
      elements: ['fire', 'air'],
      type: 'beast',
      fusionRecipe: {
        parentAKey: 'fang_line_stage0_brave_fang',
        parentBKey: 'wyrm_line_stage0_young_wyrm',
      },
    };

    expect(creature.fusionRecipe).toBeDefined();
    expect(creature.fusionRecipe?.parentAKey).toBe('fang_line_stage0_brave_fang');
    expect(creature.fusionRecipe?.parentBKey).toBe('wyrm_line_stage0_young_wyrm');
  });

  it('CreatureInstance without fusionRecipe is valid for non-fused creatures', () => {
    const creature: CreatureInstance = {
      id: 'test-2',
      templateKey: 'fang_line_stage0_brave_fang',
      level: 5,
      experience: 150n,
      currentHealth: 60,
      currentMana: 25,
      maxHealth: 60,
      maxMana: 25,
      attack: 14,
      defense: 9,
      speed: 7,
      skills: ['scratch'],
      traits: ['strong'],
      mutations: [],
      affection: 10,
      class: 'common',
      elements: ['fire'],
      type: 'beast',
    };

    expect(creature.fusionRecipe).toBeUndefined();
    expect(creature.templateKey).toBe('fang_line_stage0_brave_fang');
  });

  it('fusionRecipe parent keys are strings and non-empty', () => {
    const creature: CreatureInstance = {
      id: 'test-3',
      templateKey: 'fused_test_a_b',
      level: 1,
      experience: 0n,
      currentHealth: 100,
      currentMana: 40,
      maxHealth: 100,
      maxMana: 40,
      attack: 20,
      defense: 12,
      speed: 10,
      skills: ['fire_blast', 'wind_slash'],
      traits: [],
      mutations: ['Ancient Bloodline'],
      affection: 5,
      class: 'rare',
      elements: ['air', 'lightning'],
      type: 'dragon',
      fusionRecipe: {
        parentAKey: 'parent_template_a',
        parentBKey: 'parent_template_b',
      },
    };

    expect(typeof creature.fusionRecipe!.parentAKey).toBe('string');
    expect(typeof creature.fusionRecipe!.parentBKey).toBe('string');
    expect(creature.fusionRecipe!.parentAKey.length).toBeGreaterThan(0);
    expect(creature.fusionRecipe!.parentBKey.length).toBeGreaterThan(0);
  });
});
