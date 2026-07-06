import type { TileData, WorldData } from '../types/game.ts';
import { getTileKey } from '../data/constants.ts';

export interface MinimapCell {
  x: number;
  y: number;
  biome: string;
  discovered: boolean;
  explored: boolean;
  specialType?: string;
  isPlayer: boolean;
}

export function computeMinimapCells(
  playerX: number,
  playerY: number,
  radius: number,
  world: WorldData
): MinimapCell[] {
  const cells: MinimapCell[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tx = playerX + dx;
      const ty = playerY + dy;
      const key = getTileKey(tx, ty);
      const tile = world.tiles.get(key) as TileData | undefined;
      cells.push({
        x: dx + radius,
        y: dy + radius,
        biome: tile?.biome || 'forest',
        discovered: tile?.discovered || false,
        explored: tile?.explored || false,
        specialType: tile?.specialType,
        isPlayer: dx === 0 && dy === 0,
      });
    }
  }
  return cells;
}
