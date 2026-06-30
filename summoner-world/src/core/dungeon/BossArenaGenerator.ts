import { SeededRandom } from '../../utils/SeededRandom';
import { getDungeonFloorSeed } from './DungeonSeeds';
import { getWorldElement, calculateBossScaling } from './BossScaling';
import { getBossFloorEnvironmentalHazards } from './DungeonHazards';
import type { DungeonFloorGraph, DungeonRoom, RoomType, Element } from '../../types/game';
import type { DungeonEnvironmentalHazard, DungeonBossScaling } from '../../types/game';

export function generateBossFloor(
  worldIndex: number,
  floorIndex: number,
  globalSeed: number
): DungeonFloorGraph {
  const seed = getDungeonFloorSeed(worldIndex, floorIndex, globalSeed);
  const rooms = createOpenBossArenaRooms();

  return {
    floorIndex,
    worldIndex,
    seed,
    rooms,
    entranceRoomId: 'arena_2_0',
    bossRoomId: 'arena_2_2',
    treasureRoomIds: []
  };
}

function createOpenBossArenaRooms(): DungeonRoom[] {
  const rooms: DungeonRoom[] = [];
  const width = 5;
  const height = 5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `arena_${y}_${x}`;
      const connections: string[] = [];

      if (y > 0) connections.push(`arena_${y - 1}_${x}`);
      if (y < height - 1) connections.push(`arena_${y + 1}_${x}`);
      if (x > 0) connections.push(`arena_${y}_${x - 1}`);
      if (x < width - 1) connections.push(`arena_${y}_${x + 1}`);

      rooms.push({
        id,
        x,
        y,
        type: getBossArenaRoomType(x, y),
        connections
      });
    }
  }

  return rooms;
}

function getBossArenaRoomType(x: number, y: number): RoomType {
  if (x === 0 && y === 2) return 'entrance';
  if (x === 2 && y === 2) return 'boss';
  if ((x === 1 && y === 1) || (x === 3 && y === 1) || (x === 1 && y === 3) || (x === 3 && y === 3)) {
    return 'trap';
  }
  if (x === 2 && (y === 0 || y === 4)) return 'rest';
  return 'combat';
}
