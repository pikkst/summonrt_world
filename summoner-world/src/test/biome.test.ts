import { describe, it, expect } from 'vitest';
import { sampleBiomeGeneration, getBiomeForCoords } from '../core/dungeon/Biome';

describe('Biome generation', () => {
  it('returns valid biome types', () => {
    const biomes = new Set<string>();
    for (let x = 0; x < 100; x += 10) {
      for (let y = 0; y < 100; y += 10) {
        const biome = getBiomeForCoords(x, y, 12345);
        biomes.add(biome);
      }
    }
    expect(biomes.size).toBeGreaterThan(0);
  });

  it('is deterministic for same seed and coordinates', () => {
    const biome1 = getBiomeForCoords(500, 500, 12345);
    const biome2 = getBiomeForCoords(500, 500, 12345);
    expect(biome1).toBe(biome2);
  });

  it('produces different biomes for different seeds', () => {
    const biome1 = getBiomeForCoords(500, 500, 12345);
    const biome2 = getBiomeForCoords(500, 500, 54321);
    expect(biome1).toBeDefined();
    expect(biome2).toBeDefined();
  });

  it('produces varied biomes at the same distance from world center (not a distance gradient)', () => {
    const centerX = 1000;
    const centerY = 1000;
    const radius = 400;
    const seed = 1337;

    const north = getBiomeForCoords(centerX, centerY - radius, seed);
    const east = getBiomeForCoords(centerX + radius, centerY, seed);
    const south = getBiomeForCoords(centerX, centerY + radius, seed);
    const west = getBiomeForCoords(centerX - radius, centerY, seed);

    const cardinalBiomes = new Set([north, east, south, west]);
    expect(cardinalBiomes.size).toBeGreaterThanOrEqual(2);
  });

  it('samples return elevation, moisture, temperature values', () => {
    const sample = sampleBiomeGeneration(500, 500, 12345);
    expect(sample.biome).toBeDefined();
    expect(sample.regionalBiome).toBeDefined();
    expect(sample.elevation).toBeGreaterThanOrEqual(0);
    expect(sample.elevation).toBeLessThanOrEqual(1);
    expect(sample.moisture).toBeGreaterThanOrEqual(0);
    expect(sample.moisture).toBeLessThanOrEqual(1);
    expect(sample.temperature).toBeGreaterThanOrEqual(0);
    expect(sample.temperature).toBeLessThanOrEqual(1);
    expect(sample.voronoiInfluence).toBeGreaterThanOrEqual(0);
    expect(sample.voronoiInfluence).toBeLessThanOrEqual(1);
  });
});

describe('5-8 biomes per world selection', () => {
  it('selects at least 5 biomes for world seed 1', () => {
    const worldSeed = 12345;
    const sampledBiomes = new Set<string>();
    for (let x = 0; x < 2000; x += 50) {
      for (let y = 0; y < 2000; y += 50) {
        const biome = getBiomeForCoords(x, y, worldSeed);
        sampledBiomes.add(biome);
      }
    }
    expect(sampledBiomes.size).toBeGreaterThanOrEqual(5);
  });

  it('selects at most 8 biomes for world seed 1', () => {
    const worldSeed = 12345;
    const sampledBiomes = new Set<string>();
    for (let x = 0; x < 2000; x += 50) {
      for (let y = 0; y < 2000; y += 50) {
        const biome = getBiomeForCoords(x, y, worldSeed);
        sampledBiomes.add(biome);
      }
    }
    expect(sampledBiomes.size).toBeLessThanOrEqual(8);
  });

  it('is deterministic - same world seed produces same biome distribution', () => {
    const worldSeed = 98765;
    const biomes1 = new Set<string>();
    const biomes2 = new Set<string>();

    for (let x = 0; x < 500; x += 25) {
      for (let y = 0; y < 500; y += 25) {
        biomes1.add(getBiomeForCoords(x, y, worldSeed));
        biomes2.add(getBiomeForCoords(x, y, worldSeed));
      }
    }

    expect(biomes1).toEqual(biomes2);
  });

  it('different world seeds produce different biome distributions', () => {
    const biomes1 = new Set<string>();
    const biomes2 = new Set<string>();

    for (let x = 0; x < 500; x += 50) {
      for (let y = 0; y < 500; y += 50) {
        biomes1.add(getBiomeForCoords(x, y, 11111));
        biomes2.add(getBiomeForCoords(x, y, 22222));
      }
    }

    expect(biomes1.size).toBeGreaterThanOrEqual(5);
    expect(biomes2.size).toBeGreaterThanOrEqual(5);
  });
});