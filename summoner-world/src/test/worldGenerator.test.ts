import { describe, expect, it } from 'vitest';
import { BIOME_TYPES, getFloorSeed } from '../data/constants';
import { getBiomeForCoords, sampleBiomeGeneration } from '../core/dungeon/Biome';
import { generateTile, generateTileFromSeed, generateWorld } from '../core/worldGenerator';

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

describe('T7.12 - Deterministic tile generation for all players', () => {
  it('generates identical full tile for same seed and coordinates', () => {
    const first = generateTileFromSeed(100, 200, 1337);
    const second = generateTileFromSeed(100, 200, 1337);
    const third = generateTileFromSeed(100, 200, 1337);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it('generates identical tiles for same worldId across all tile properties', () => {
    const firstTile = generateTile(750, 420, 5);
    const secondTile = generateTile(750, 420, 5);

    expect(secondTile).toEqual(firstTile);
  });

  it('generates identical tiles across many coordinate samples for the same seed', () => {
    const seed = 5555;
    const coords: Array<[number, number]> = [
      [0, 0],
      [10, 10],
      [50, 200],
      [100, 1000],
      [500, 750],
      [999, 888],
      [1000, 1000],
      [1500, 25],
      [1999, 1999],
    ];

    for (const [x, y] of coords) {
      const first = generateTileFromSeed(x, y, seed);
      const second = generateTileFromSeed(x, y, seed);
      expect(second).toEqual(first);
    }
  });

  it('generates identical world tile collections for the same worldId', () => {
    const firstWorld = generateWorld(7, null);
    const secondWorld = generateWorld(7, null);

    expect(firstWorld.tiles.size).toBe(secondWorld.tiles.size);

    for (const [key, tile] of firstWorld.tiles) {
      const other = secondWorld.tiles.get(key);
      expect(other).toEqual(tile);
    }
  });

  it('verifies worldId maps to a stable deterministic floor seed', () => {
    const worldId = 3;
    const firstSeed = getFloorSeed(worldId);
    const secondSeed = getFloorSeed(worldId);
    expect(secondSeed).toBe(firstSeed);
  });

  it('simulates two players generating identical tiles in the same world', () => {
    const worldId = 15;
    const coords: Array<[number, number]> = [
      [120, 340],
      [500, 750],
      [1000, 1000],
      [1770, 420],
    ];

    const player1Tiles = coords.map(([x, y]) => generateTile(x, y, worldId));
    const player2Tiles = coords.map(([x, y]) => generateTile(x, y, worldId));

    for (let i = 0; i < coords.length; i++) {
      expect(player2Tiles[i]).toEqual(player1Tiles[i]);
    }
  });

  it('produces different tiles for different seeds at the same coordinates', () => {
    const seed1 = 1000;
    const seed2 = 2000;
    const [x, y] = [500, 500];

    const tile1 = generateTileFromSeed(x, y, seed1);
    const tile2 = generateTileFromSeed(x, y, seed2);

    expect(tile2).not.toEqual(tile1);
  });

  it('generates deterministic encounter seeds for the same tile', () => {
    const worldId = 25;
    const coords: Array<[number, number]> = [[100, 200], [500, 500], [1000, 1000]];

    for (const [x, y] of coords) {
      const first = generateTile(x, y, worldId);
      const second = generateTile(x, y, worldId);
      expect(second.encounterSeed).toBe(first.encounterSeed);
    }
  });
});
