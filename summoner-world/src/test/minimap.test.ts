import { describe, it, expect } from 'vitest';
import { computeMinimapCells } from '../core/minimap.ts';
import type { WorldData, TileData, BiomeType } from '../types/game.ts';

function buildWorld(tiles: Array<{ x: number; y: number; biome?: BiomeType; discovered?: boolean; explored?: boolean; specialType?: TileData['specialType'] }>): WorldData {
  const map = new Map<string, TileData>();
  for (const t of tiles) {
    map.set(`${t.x},${t.y}`, {
      x: t.x,
      y: t.y,
      biome: t.biome || 'forest',
      discovered: t.discovered ?? false,
      explored: t.explored ?? false,
      specialType: t.specialType,
    });
  }
  return {
    id: 1,
    seed: 123,
    name: 'Test World',
    tier: 1,
    bossDefeated: false,
    dungeonFloors: 3,
    tiles: map,
    startTile: { x: 0, y: 0 },
    weather: { currentWeather: 'Clear', weatherIntensity: 0, nextChangeTurn: 0, baseDuration: 0 },
    settlements: [],
  };
}

describe('computeMinimapCells', () => {
  it('returns grid sized by radius', () => {
    const world = buildWorld([]);
    const cells = computeMinimapCells(0, 0, 2, world);
    expect(cells.length).toBe(25); // (2*2+1)^2
  });

  it('marks player position correctly', () => {
    const world = buildWorld([]);
    const cells = computeMinimapCells(10, 10, 1, world);
    const playerCell = cells.find(c => c.isPlayer);
    expect(playerCell).toBeDefined();
    expect(playerCell!.x).toBe(1);
    expect(playerCell!.y).toBe(1);
  });

  it('renders undiscovered tiles as fog-of-war', () => {
    const world = buildWorld([{ x: 10, y: 10, discovered: false }]);
    const cells = computeMinimapCells(10, 10, 1, world);
    const tileCell = cells.find(c => !c.isPlayer);
    expect(tileCell?.discovered).toBe(false);
  });

  it('preserves discovered biome data', () => {
    const world = buildWorld([{ x: 11, y: 10, biome: 'desert', discovered: true }]);
    const cells = computeMinimapCells(10, 10, 1, world);
    const tileCell = cells.find(c => !c.isPlayer && c.discovered);
    expect(tileCell?.biome).toBe('desert');
    expect(tileCell?.discovered).toBe(true);
  });

  it('handles explored special tiles', () => {
    const world = buildWorld([{ x: 11, y: 10, discovered: true, explored: true, specialType: 'city' }]);
    const cells = computeMinimapCells(10, 10, 1, world);
    const tileCell = cells.find(c => !c.isPlayer && c.specialType === 'city');
    expect(tileCell?.specialType).toBe('city');
    expect(tileCell?.explored).toBe(true);
  });
});
