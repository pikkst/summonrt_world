export const DUNGEON_BASE_FLOORS = 3;
export const GRID_WIDTH = 5;
export const GRID_HEIGHT = 5;

export function getDungeonFloorSeed(worldIndex: number, floorIndex: number, globalSeed: number): number {
  const combined = `${worldIndex}:${floorIndex}:${globalSeed}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getDungeonTowerFloorCount(worldIndex: number): number {
  return DUNGEON_BASE_FLOORS + Math.max(1, worldIndex);
}
