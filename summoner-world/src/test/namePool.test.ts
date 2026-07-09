import { describe, expect, it } from 'vitest';
import { generateName, generateFirstName, generateLastName, getCultureForBiome, getAvailableBiomes } from '../core/npc/namePool';
import type { BiomeType } from '../types/game';

const ALL_BIOMES: BiomeType[] = [
  'forest','plains','mountains','swamp','desert','tundra','coast','volcanic','crystal_caves','sky_islands'
];

describe('T9.1 - NamePool system', () => {
  it('generates deterministic names for the same seed', () => {
    const name1 = generateName('forest', 'npc-seed-42');
    const name2 = generateName('forest', 'npc-seed-42');
    expect(name1).toBe(name2);
  });

  it('generates different names for different seeds', () => {
    const name1 = generateName('forest', 'npc-seed-1');
    const name2 = generateName('forest', 'npc-seed-2');
    expect(name1).not.toBe(name2);
  });

  it('returns a non-empty string for every supported biome', () => {
    for (const biome of ALL_BIOMES) {
      const name = generateName(biome, 12345);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('returns valid culture-themed first and last names', () => {
    const culture = getCultureForBiome('forest');
    expect(culture.firstNames.length).toBeGreaterThan(0);
    expect(culture.lastNames.length).toBeGreaterThan(0);
    expect(culture.epithets.length).toBeGreaterThan(0);
  });

  it('falls back to plains for an unknown biome', () => {
    const culture = getCultureForBiome('unknown_biome' as BiomeType);
    expect(culture.firstNames.length).toBeGreaterThan(0);
  });

  it('generates deterministic first names from seed', () => {
    const first1 = generateFirstName('mountains', 'seed-a');
    const first2 = generateFirstName('mountains', 'seed-a');
    expect(first1).toBe(first2);
  });

  it('generates deterministic last names from seed', () => {
    const last1 = generateLastName('desert', 'seed-b');
    const last2 = generateLastName('desert', 'seed-b');
    expect(last1).toBe(last2);
  });

  it('reports all available biomes', () => {
    const biomes = getAvailableBiomes();
    expect(biomes.length).toBe(ALL_BIOMES.length);
    for (const b of ALL_BIOMES) {
      expect(biomes).toContain(b);
    }
  });
});
