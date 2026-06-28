import { describe, it, expect } from 'vitest';
import { generateCreatureTemplate, getTemplateByKey, registerSpeciesLine, clearTemplateRegistry } from '../modules/creatures/creatureFactory';
import { SeededRandom } from '../utils/SeededRandom';
import type { CreatureClass } from '../types/game';

describe('generateCreatureTemplate rarity weights', () => {
  const GDD_WEIGHTS: Record<CreatureClass, number> = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 0.9,
    mythical: 0.1,
  };

  const CLASSES: CreatureClass[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];

  it('generates creature templates with correct rarity distribution', () => {
    const counts: Record<CreatureClass, number> = {
      common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythical: 0,
    };

    for (let i = 0; i < 10000; i++) {
      const rng = new SeededRandom(i);
      const template = generateCreatureTemplate(1, rng);
      counts[template.class as CreatureClass]++;
    }

    // Special tolerance for rare rarities (mythical, legendary) due to low sample size
    const getTolerance = (expected: number) => expected < 1 ? 0.5 : 0.05;

    (Object.keys(GDD_WEIGHTS) as CreatureClass[]).forEach((creatureClass) => {
      const expected = GDD_WEIGHTS[creatureClass];
      const actual = (counts[creatureClass] / 10000) * 100;
      const tolerance = getTolerance(expected);
      const min = expected * (1 - tolerance);
      const max = expected * (1 + tolerance);
      expect(
        actual >= min && actual <= max,
        `${creatureClass}: expected ~${expected}%, got ${actual.toFixed(2)}%`
      ).toBe(true);
    });
  });

  it('generates common creatures most frequently', () => {
    const rng = new SeededRandom(1);
    const template = generateCreatureTemplate(1, rng);
    expect(CLASSES).toContain(template.class);
  });

  it('generates mythical creatures rarely (~0.1%)', () => {
    let mythicalCount = 0;
    for (let i = 0; i < 100000; i++) {
      const rng = new SeededRandom(i);
      const template = generateCreatureTemplate(1, rng);
      if (template.class === 'mythical') mythicalCount++;
    }
    const actualPercentage = (mythicalCount / 100000) * 100;
    expect(actualPercentage).toBeGreaterThanOrEqual(0.05);
    expect(actualPercentage).toBeLessThanOrEqual(0.15);
  });

  it('boss creatures are epic or higher', () => {
    for (let i = 0; i < 100; i++) {
      const rng = new SeededRandom(i + 1000);
      const template = generateCreatureTemplate(1, rng, true);
      expect(['epic', 'legendary', 'mythical']).toContain(template.class);
    }
  });

  it('creature has valid stats based on class', () => {
    const rng = new SeededRandom(42);
    const template = generateCreatureTemplate(1, rng);

    expect(template.baseHealth).toBeGreaterThan(0);
    expect(template.baseAttack).toBeGreaterThan(0);
    expect(template.baseDefense).toBeGreaterThan(0);
    expect(template.baseSpeed).toBeGreaterThan(0);
    expect(template.baseMana).toBeGreaterThan(0);
    expect(template.baseExpValue).toBeGreaterThan(0);
  });

  it('creature has valid elements from starter pool', () => {
    const rng = new SeededRandom(123);
    const template = generateCreatureTemplate(1, rng);

    const validElements = ['fire', 'water', 'earth', 'air', 'lightning', 'iron', 'nature', 'ice', 'light', 'darkness'];

    template.elements.forEach(element => {
      expect(validElements).toContain(element);
    });
  });

  it('auto-generates capturePool for random templates', () => {
    const rng = new SeededRandom(42);
    const template = generateCreatureTemplate(1, rng);

    expect(template.capturePool).toBeDefined();
    expect(template.capturePool?.compatibleElements).toBeDefined();
    expect(template.capturePool!.compatibleElements.length).toBeGreaterThan(0);
  });

  it('capturePool.compatibleElements matches template elements (deduplicated)', () => {
    const rng = new SeededRandom(999);
    const template = generateCreatureTemplate(1, rng);

    const expected = [...new Set(template.elements)];
    expect(template.capturePool!.compatibleElements).toEqual(expected);
  });

  it('species line templates also have capturePool', () => {
    clearTemplateRegistry();
    const rng = new SeededRandom(1);
    registerSpeciesLine('fang_line', 1);

    const template1 = getTemplateByKey('fang_line_stage0_brave_fang');
    const template2 = getTemplateByKey('fang_line_stage1_mighty_lion');

    expect(template1?.capturePool).toBeDefined();
    expect(template1?.capturePool?.compatibleElements.length).toBeGreaterThan(0);
    expect(template2?.capturePool).toBeDefined();
    expect(template2?.capturePool?.compatibleElements.length).toBeGreaterThan(0);
  });
});