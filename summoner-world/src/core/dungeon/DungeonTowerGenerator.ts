import { getDungeonTowerFloorCount } from './DungeonSeeds';
import { generateBossFloor } from './BossArenaGenerator';
import { generateDungeonFloor } from './MazeGenerator';
import type { DungeonTower, DungeonFloorGraph, DungeonTowerSafeFloor, DungeonTowerVerticalLink, DungeonRun, DungeonRoom } from '../../types/game';

export function generateDungeonTower(
  worldIndex: number,
  globalSeed = 12345
): DungeonTower {
  const totalFloors = getDungeonTowerFloorCount(worldIndex);
  const floors: DungeonFloorGraph[] = [];
  const verticalLinks: DungeonTowerVerticalLink[] = [];
  const safeFloors: DungeonTowerSafeFloor[] = [];

  for (let floorIndex = 1; floorIndex <= totalFloors; floorIndex++) {
    const floor = floorIndex === totalFloors
      ? generateBossFloor(worldIndex, floorIndex, globalSeed)
      : generateDungeonFloor(worldIndex, floorIndex, globalSeed);

    if (isSafeTowerFloor(floorIndex) && floorIndex !== totalFloors) {
      const safeFloor = markSafeTowerFloor(floor);
      if (safeFloor) safeFloors.push(safeFloor);
    }

    floors.push(floor);
  }

  for (let i = 0; i < floors.length - 1; i++) {
    const fromFloor = floors[i];
    const toFloor = floors[i + 1];
    if (!fromFloor || !toFloor) continue;

    verticalLinks.push({
      fromFloorIndex: fromFloor.floorIndex,
      fromRoomId: fromFloor.bossRoomId,
      toFloorIndex: toFloor.floorIndex,
      toRoomId: toFloor.entranceRoomId
    });
  }

  return {
    worldIndex,
    globalSeed,
    totalFloors,
    floors,
    verticalLinks,
    safeFloors
  };
}

export function exportDungeonRun(tower: DungeonTower, runId?: string): DungeonRun {
  return {
    runId: runId || `run_${tower.worldIndex}_${tower.globalSeed}_${Date.now()}`,
    worldIndex: tower.worldIndex,
    globalSeed: tower.globalSeed,
    totalFloors: tower.totalFloors,
    currentFloor: 1,
    clearedFloors: [],
    bossDefeated: false,
    active: true,
    tower
  };
}

function isSafeTowerFloor(floorIndex: number): boolean {
  return floorIndex > 0 && floorIndex % 10 === 0;
}

function markSafeTowerFloor(floor: DungeonFloorGraph): DungeonTowerSafeFloor | null {
  const serviceRooms = floor.rooms
    .filter((room: DungeonRoom) => room.id !== floor.entranceRoomId && room.id !== floor.bossRoomId && room.type !== 'treasure')
    .sort((a: DungeonRoom, b: DungeonRoom) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

  if (serviceRooms.length === 0) return null;

  const restRoom = serviceRooms[0];
  if (!restRoom) return null;

  const vendorRoom: DungeonRoom = serviceRooms.length > 1 && serviceRooms[1] ? serviceRooms[1] : restRoom;
  const teleportRoom: DungeonRoom = serviceRooms.length > 2 && serviceRooms[2] ? serviceRooms[2] : (vendorRoom !== restRoom ? vendorRoom : restRoom);

  restRoom.type = 'rest';
  vendorRoom.type = 'vendor';

  return {
    floorIndex: floor.floorIndex,
    restRoomId: restRoom.id,
    vendorRoomId: vendorRoom.id,
    teleportUnlockRoomId: teleportRoom.id
  };
}
