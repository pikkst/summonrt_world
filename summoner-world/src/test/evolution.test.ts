import { describe, it, expect, beforeEach } from 'vitest';
import { generateCreatureTemplate, registerTemplate, getTemplateByKey, getAvailableTemplatesForElement, clearTemplateRegistry, registerSpeciesLine, pickRandomSpeciesKey, getRandomSpeciesStage } from '../modules/creatures/creatureFactory';
import { applyCreatureXP, checkEvolution, getCreatureXPThreshold } from '../core/xpCurve';
import { SeededRandom } from '../utils/SeededRandom';
import type { CreatureInstance } from '../types/game';

describe('species line generation', () => {
  beforeEach(() => {
    clearTemplateRegistry();
  });

  it('generates deterministic templates for species line stages', () => {
    const rng = new SeededRandom(42);
    const template = generateCreatureTemplate(1, rng, false, 'fang_line', 0);

    expect(template.key).toBe('fang_line_stage0_brave_fang');
    expect(template.name).toBe('Brave Fang');
    expect(template.class).toBe('common');
    expect(template.type).toBe('beast');
    expect(template.elements).toEqual(['fire']);
    expect(template.evolutionLevel).toBe(10);
    expect(template.evolvesIntoKey).toBe('fang_line_stage1_mighty_lion');
  });

  it('generates stage 1 with uncommon class and correct evolution target', () => {
    const rng = new SeededRandom(42);
    const template = generateCreatureTemplate(1, rng, false, 'fang_line', 1);

    expect(template.key).toBe('fang_line_stage1_mighty_lion');
    expect(template.class).toBe('uncommon');
    expect(template.evolutionLevel).toBe(25);
    expect(template.evolvesIntoKey).toBe('fang_line_stage2_ancient_bear');
  });

  it('last stage has no evolvesIntoKey', () => {
    const rng = new SeededRandom(42);
    const template = generateCreatureTemplate(1, rng, false, 'fang_line', 3);

    expect(template.key).toBe('fang_line_stage3_eternal_behemoth');
    expect(template.class).toBe('epic');
    expect(template.evolutionLevel).toBe(70);
    expect(template.evolvesIntoKey).toBeUndefined();
  });

  it('registerSpeciesLine registers all stages', () => {
    registerSpeciesLine('wyrm_line', 1);

    expect(getTemplateByKey('wyrm_line_stage0_young_wyrm')).toBeDefined();
    expect(getTemplateByKey('wyrm_line_stage1_storm_drake')).toBeDefined();
    expect(getTemplateByKey('wyrm_line_stage2_ancient_serpent')).toBeDefined();
    expect(getTemplateByKey('wyrm_line_stage3_elder_titan')).toBeDefined();

    const s0 = getTemplateByKey('wyrm_line_stage0_young_wyrm')!;
    expect(s0.evolvesIntoKey).toBe('wyrm_line_stage1_storm_drake');
    expect(s0.evolutionLevel).toBe(10);
  });

  it('all 5 species lines generate distinct templates', () => {
    registerSpeciesLine('fang_line', 1);
    registerSpeciesLine('wyrm_line', 1);
    registerSpeciesLine('wraith_line', 1);
    registerSpeciesLine('golem_line', 1);
    registerSpeciesLine('spirit_line', 1);

    const keys = [
      'fang_line_stage0_brave_fang',
      'fang_line_stage1_mighty_lion',
      'fang_line_stage2_ancient_bear',
      'fang_line_stage3_eternal_behemoth',
      'wyrm_line_stage0_young_wyrm',
      'wyrm_line_stage1_storm_drake',
      'wyrm_line_stage2_ancient_serpent',
      'wyrm_line_stage3_elder_titan',
      'wraith_line_stage0_shade_walker',
      'wraith_line_stage1_wraith_lord',
      'wraith_line_stage2_specter_reaper',
      'wraith_line_stage3_phantom_harbinger',
      'golem_line_stage0_rusty_golem',
      'golem_line_stage1_iron_guardian',
      'golem_line_stage2_fortified_bastion',
      'golem_line_stage3_colossal_monolith',
      'spirit_line_stage0_wisp_spirit',
      'spirit_line_stage1_ethereal_wyrd',
      'spirit_line_stage2_celestial_entity',
      'spirit_line_stage3_divine_presence',
    ];

    keys.forEach(key => {
      expect(getTemplateByKey(key)).toBeDefined();
    });
  });
});

describe('template registry', () => {
  beforeEach(() => {
    clearTemplateRegistry();
  });

  it('getTemplateByKey returns registered templates', () => {
    const rng = new SeededRandom(1);
    const template = generateCreatureTemplate(1, rng);
    expect(getTemplateByKey(template.key)).toBe(template);
  });

  it('getTemplateByKey returns undefined for unknown keys', () => {
    expect(getTemplateByKey('nonexistent_key')).toBeUndefined();
  });

  it('getAvailableTemplatesForElement filters by element', () => {
    clearTemplateRegistry();
    const rng = new SeededRandom(99);
    for (let i = 0; i < 20; i++) {
      generateCreatureTemplate(1, rng);
    }
    const fireTemplates = getAvailableTemplatesForElement('fire');
    fireTemplates.forEach(t => {
      expect(t.elements).toContain('fire');
    });
  });
});

describe('template evolution via checkEvolution', () => {
  beforeEach(() => {
    clearTemplateRegistry();
    registerSpeciesLine('fang_line', 1);
  });

  it('returns template evolution when level meets target threshold', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 10,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const result = checkEvolution(creature);
    expect(result).not.toBeNull();
    expect(result!.templateKey).toBe('fang_line_stage1_mighty_lion');
    expect(result!.newClass).toBe('uncommon');
    expect(result!.evolvedFromKey).toBe('fang_line_stage0_brave_fang');
  });

  it('returns template evolution only after reaching evolutionLevel', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 9,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const result = checkEvolution(creature);
    expect(result).toBeNull();
  });

  it('falls back to class-based chain when no template evolution exists', () => {
    const rng = new SeededRandom(1);
    const randomTemplate = generateCreatureTemplate(1, rng);
    expect(randomTemplate.evolvesIntoKey).toBeUndefined();

    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: randomTemplate.key,
      level: 10,
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
      evolutionStage: 0,
    };

    const result = checkEvolution(creature);
    expect(result).not.toBeNull();
    expect(result!.templateKey).toBeUndefined();
    expect(result!.newClass).toBe('uncommon');
  });
});

describe('applyCreatureXP with template evolution', () => {
  beforeEach(() => {
    clearTemplateRegistry();
    registerSpeciesLine('fang_line', 1);
  });

  it('switches templateKey and sets evolvedFromKey on template evolution', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 9,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(creature, Number(xpNeeded) + 10);

    expect(result.evolved).toBe(true);
    expect(result.creature.templateKey).toBe('fang_line_stage1_mighty_lion');
    expect(result.creature.evolvedFromKey).toBe('fang_line_stage0_brave_fang');
    expect(result.newClass).toBe('uncommon');
    expect(result.creature.attack).toBeGreaterThan(10);
    expect(result.creature.defense).toBeGreaterThan(5);
    expect(result.creature.speed).toBeGreaterThan(5);
  });

  it('updates elements and skills from evolved template', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 9,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(creature, Number(xpNeeded) + 10);

    expect(result.evolved).toBe(true);
    const evolvedTemplate = getTemplateByKey(result.creature.templateKey)!;
    expect(result.creature.elements).toEqual(evolvedTemplate.elements);
    expect(result.creature.skills.length).toBeGreaterThanOrEqual(evolvedTemplate.skills.length);
  });

  it('preserves evolvedFromKey through subsequent level-ups', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 9,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(creature, Number(xpNeeded) + 10);
    expect(result.evolved).toBe(true);

    const secondResult = applyCreatureXP(result.creature, 500);
    expect(secondResult.creature.evolvedFromKey).toBe('fang_line_stage0_brave_fang');
    expect(secondResult.creature.templateKey).toBe('fang_line_stage1_mighty_lion');
  });

  it('does not evolve twice in same batch', () => {
    const template = getTemplateByKey('fang_line_stage0_brave_fang')!;
    const creature: CreatureInstance = {
      id: 'test-1',
      templateKey: template.key,
      level: 9,
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
      type: 'beast',
      elements: ['fire'],
      baseExpValue: 20,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const xpNeeded = getCreatureXPThreshold(9);
    const result = applyCreatureXP(creature, Number(xpNeeded) + 1000);
    expect(result.evolved).toBe(true);
    expect(result.evolutionStage).toBe(1);
  });
});

describe('species line helper functions', () => {
  it('pickRandomSpeciesKey returns a valid species key', () => {
    const rng = new SeededRandom(1);
    const key = pickRandomSpeciesKey(rng);
    expect(key).toBeDefined();
    expect(['fang_line', 'wyrm_line', 'wraith_line', 'golem_line', 'spirit_line']).toContain(key);
  });

  it('getRandomSpeciesStage returns stage 0 most often', () => {
    const rng = new SeededRandom(1);
    const counts: number[] = [0, 0, 0, 0];
    for (let i = 0; i < 1000; i++) {
      const stage = getRandomSpeciesStage('fang_line', rng);
      const idx = Math.max(0, Math.min(stage, counts.length - 1));
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    expect(counts[0] ?? 0).toBeGreaterThan(counts[1] ?? 0);
    expect(counts[1] ?? 0).toBeGreaterThan(counts[2] ?? 0);
  });
});
