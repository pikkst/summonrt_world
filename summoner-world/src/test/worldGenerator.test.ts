import { describe, expect, it } from 'vitest';
import { BIOME_TYPES } from '../data/constants';
import { getBiomeForCoords, sampleBiomeGeneration } from '../core/dungeon/Biome';
import { generateTile, generateWorld } from '../core/worldGenerator';

describe('T7.1 - Perlin/Voronoi biome generation', () => {
  it('generates deterministic biome samples for the same seed and coordinates', () => {
    const first = sampleBiomeGeneration(412, 977, 1337);
    const second = sampleBiomeGeneration(412, 977, 1337);

    expect(second).toEqual(first);
  });

  it('allows world seed to affect biome placement', () => {
    const coords = [
      [120, 120],
      [360, 740],
      [800, 420],
      [1280, 1640],
      [1740, 920],
    ] as const;

    const firstSeedBiomes = coords.map(([x, y]) => getBiomeForCoords(x, y, 1337));
    const secondSeedBiomes = coords.map(([x, y]) => getBiomeForCoords(x, y, 8888));

    expect(secondSeedBiomes).not.toEqual(firstSeedBiomes);
  });

  it('returns only valid biome types across a broad map sample', () => {
    for (let y = 0; y <= 2000; y += 125) {
      for (let x = 0; x <= 2000; x += 125) {
        expect(BIOME_TYPES).toContain(getBiomeForCoords(x, y, 4242));
      }
    }
  });

  it('creates diverse biome maps instead of a simple distance gradient', () => {
    const sampledBiomes = new Set<string>();

    for (let y = 0; y <= 2000; y += 100) {
      for (let x = 0; x <= 2000; x += 100) {
        sampledBiomes.add(getBiomeForCoords(x, y, 1337));
      }
    }

    expect(sampledBiomes.size).toBeGreaterThanOrEqual(5);
  });

  it('uses Voronoi regions as major biome provinces', () => {
    const samples = [];

    for (let y = 60; y <= 1940; y += 80) {
      for (let x = 60; x <= 1940; x += 80) {
        samples.push(sampleBiomeGeneration(x, y, 1337));
      }
    }

    expect(samples.some(sample => sample.voronoiInfluence > 0.6 && sample.biome === sample.regionalBiome)).toBe(true);
  });

  it('feeds generated tile and starting world data with deterministic biomes', () => {
    const firstTile = generateTile(10, 10, 1);
    const secondTile = generateTile(10, 10, 1);
    const world = generateWorld(1, null);
    const startTile = world.tiles.get('10,10');

    expect(secondTile.biome).toBe(firstTile.biome);
    expect(startTile?.biome).toBe(firstTile.biome);
    expect(BIOME_TYPES).toContain(startTile?.biome);
  });
});
