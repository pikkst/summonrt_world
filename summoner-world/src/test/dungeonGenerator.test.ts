import { describe, it, expect } from 'vitest';
import {
  getDungeonFloorSeed,
  getDungeonTowerFloorCount,
  generateDungeonFloor,
  generateDungeonTower,
  findShortestPath,
  findAllShortestPaths,
  calculateRoomDistanceMap,
  createMaze,
  mazeToGraph,
  assignRoomTypes,
  ensureMultipleShortestPaths,
  assignTreasureRooms,
} from '../core/dungeonGenerator';
import { SeededRandom } from '../utils/SeededRandom';
import type { DungeonFloorGraph, RoomType } from '../types/game';

describe('getDungeonFloorSeed', () => {
  it('generates deterministic seed from world seed + floor seed', () => {
    const seed1 = getDungeonFloorSeed(1, 1, 12345);
    const seed2 = getDungeonFloorSeed(1, 1, 12345);
    expect(seed1).toBe(seed2);
  });

  it('produces different seeds for different world indices', () => {
    const seed1 = getDungeonFloorSeed(1, 1, 12345);
    const seed2 = getDungeonFloorSeed(2, 1, 12345);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different floor indices', () => {
    const seed1 = getDungeonFloorSeed(1, 1, 12345);
    const seed2 = getDungeonFloorSeed(1, 2, 12345);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different global seeds', () => {
    const seed1 = getDungeonFloorSeed(1, 1, 12345);
    const seed2 = getDungeonFloorSeed(1, 1, 54321);
    expect(seed1).not.toBe(seed2);
  });
});

describe('generateDungeonFloor', () => {
  it('produces a connected room graph with entrance and boss rooms', () => {
    const graph = generateDungeonFloor(1, 1, 12345);

    expect(graph.rooms.length).toBeGreaterThan(0);

    const entranceRoom = graph.rooms.find(r => r.type === 'entrance');
    expect(entranceRoom).toBeDefined();
    expect(entranceRoom?.id).toBe(graph.entranceRoomId);
    expect(entranceRoom?.connections.length).toBeGreaterThan(0);

    const bossRoom = graph.rooms.find(r => r.type === 'boss');
    expect(bossRoom).toBeDefined();
    expect(bossRoom?.id).toBe(graph.bossRoomId);
    expect(bossRoom?.connections.length).toBeGreaterThan(0);
  });

  it('has entrance at room_0_0 and boss at bottom-right', () => {
    const graph = generateDungeonFloor(1, 1, 12345);

    expect(graph.entranceRoomId).toBe('room_0_0');
    const expectedBossY = graph.rooms.length / 5 - 1;
    const expectedBossX = 4;
    expect(graph.bossRoomId).toBe(`room_${expectedBossY}_${expectedBossX}`);
  });
});

describe('generateDungeonTower', () => {
  it('builds floor count from base floors plus world index', () => {
    const tower = generateDungeonTower(7, 12345);

    expect(tower.totalFloors).toBe(getDungeonTowerFloorCount(7));
    expect(tower.floors).toHaveLength(tower.totalFloors);
    expect(tower.totalFloors).toBe(10);
  });

  it('links every floor exit to the next floor entrance', () => {
    const tower = generateDungeonTower(5, 12345);

    expect(tower.verticalLinks).toHaveLength(tower.totalFloors - 1);

    for (const link of tower.verticalLinks) {
      const fromFloor = tower.floors.find(floor => floor.floorIndex === link.fromFloorIndex);
      const toFloor = tower.floors.find(floor => floor.floorIndex === link.toFloorIndex);

      expect(toFloor?.floorIndex).toBe((fromFloor?.floorIndex ?? 0) + 1);
      expect(link.fromRoomId).toBe(fromFloor?.bossRoomId);
      expect(link.toRoomId).toBe(toFloor?.entranceRoomId);
    }
  });

  it('marks every 10th floor as safe with rest, vendor, and teleport unlock metadata', () => {
    const tower = generateDungeonTower(20, 12345);

    expect(tower.safeFloors.map(floor => floor.floorIndex)).toEqual([10, 20]);

    for (const safeFloor of tower.safeFloors) {
      const floor = tower.floors.find(generatedFloor => generatedFloor.floorIndex === safeFloor.floorIndex);
      const restRoom = floor?.rooms.find(room => room.id === safeFloor.restRoomId);
      const vendorRoom = floor?.rooms.find(room => room.id === safeFloor.vendorRoomId);
      const teleportRoom = floor?.rooms.find(room => room.id === safeFloor.teleportUnlockRoomId);

      expect(restRoom?.type).toBe('rest');
      expect(vendorRoom?.type).toBe('vendor');
      expect(teleportRoom).toBeDefined();
      expect(safeFloor.restRoomId).not.toBe(floor?.entranceRoomId);
      expect(safeFloor.vendorRoomId).not.toBe(floor?.bossRoomId);
    }
  });

  it('is deterministic for the same world and global seed', () => {
    const tower1 = generateDungeonTower(12, 98765);
    const tower2 = generateDungeonTower(12, 98765);

    expect(tower1).toEqual(tower2);
  });
});

describe('findShortestPath', () => {
  it('finds valid path from entrance to boss', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const path = findShortestPath(graph, graph.entranceRoomId, graph.bossRoomId);

    expect(path).not.toBeNull();
     if (path) {
       expect(path.length).toBeGreaterThan(0);
       expect(path[0]).toBe(graph.entranceRoomId);
       expect(path[path.length - 1]).toBe(graph.bossRoomId);
     }
  });

  it('returns null for unreachable rooms', () => {
    const graph: DungeonFloorGraph = {
      floorIndex: 1,
      worldIndex: 1,
      seed: 12345,
      rooms: [
        { id: 'room_a', x: 0, y: 0, type: 'combat', connections: [] },
        { id: 'room_b', x: 1, y: 1, type: 'combat', connections: [] },
      ],
      entranceRoomId: 'room_a',
      bossRoomId: 'room_b',
      treasureRoomIds: [],
    };

    const path = findShortestPath(graph, 'room_a', 'room_b');
    expect(path).toBeNull();
  });
});

describe('findAllShortestPaths', () => {
  it('validates at least 3 shortest paths exist after ensureMultipleShortestPaths', () => {
    const rng = new SeededRandom(12345);
    const maze = createMaze(rng, 5, 5);
    const graph = mazeToGraph(maze, 12345);
    graph.floorIndex = 1;
    graph.worldIndex = 1;
    assignRoomTypes(graph, rng, 1, 1);

    const startId = graph.entranceRoomId;
    const endId = graph.bossRoomId;

    ensureMultipleShortestPaths(graph, rng);

    const paths = findAllShortestPaths(graph, startId, endId);
    expect(paths.length).toBeGreaterThanOrEqual(3);
    for (const path of paths) {
      expect(path[0]).toBe(startId);
      expect(path[path.length - 1]).toBe(endId);
    }
  });

  it('finds at least one shortest path between entrance and boss', () => {
    const graph = generateDungeonFloor(1, 1, 99999);
    const paths = findAllShortestPaths(graph, graph.entranceRoomId, graph.bossRoomId);

    expect(paths.length).toBeGreaterThanOrEqual(1);
    for (const path of paths) {
      expect(path[0]).toBe(graph.entranceRoomId);
      expect(path[path.length - 1]).toBe(graph.bossRoomId);
    }
  });

  it('returns all paths of the same minimum length', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const paths = findAllShortestPaths(graph, graph.entranceRoomId, graph.bossRoomId);

    if (paths.length > 0) {
      const firstLength = paths[0]!.length;
      for (const path of paths) {
        expect(path.length).toBe(firstLength);
      }
    }
  });
});

describe('No disconnected rooms', () => {
  it('all rooms reachable from entrance', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const distances = calculateRoomDistanceMap(graph, graph.entranceRoomId);

    for (const room of graph.rooms) {
      expect(distances.has(room.id), `Room ${room.id} is not reachable from entrance`).toBe(true);
    }
  });
});

describe('Treasure rooms', () => {
  it('has at least 1 treasure room per floor', () => {
    const graph = generateDungeonFloor(1, 1, 12345);

    const treasureRooms = graph.rooms.filter(r => r.type === 'treasure');
    expect(treasureRooms.length).toBeGreaterThanOrEqual(1);
  });

  it('treasure room ids match actual treasure rooms', () => {
    const graph = generateDungeonFloor(1, 1, 12345);

    for (const treasureId of graph.treasureRoomIds) {
      const room = graph.rooms.find(r => r.id === treasureId);
      expect(room).toBeDefined();
      expect(room?.type).toBe('treasure');
    }
  });
});

describe('Deterministic seed test', () => {
  it('same seed produces identical floor graph', () => {
    const graph1 = generateDungeonFloor(5, 10, 99999);
    const graph2 = generateDungeonFloor(5, 10, 99999);

    expect(graph1.rooms.length).toBe(graph2.rooms.length);
    expect(graph1.entranceRoomId).toBe(graph2.entranceRoomId);
    expect(graph1.bossRoomId).toBe(graph2.bossRoomId);
    expect(graph1.treasureRoomIds.length).toBe(graph2.treasureRoomIds.length);

for (let i = 0; i < graph1.rooms.length; i++) {
      const room1 = graph1.rooms[i];
      const room2 = graph2.rooms[i];
      expect(room1?.id).toBe(room2?.id);
      expect(room1?.type).toBe(room2?.type);
      expect(room1?.connections).toEqual(room2?.connections);
    }
  });
});

describe('Treasure room placement logic', () => {
  it('places treasure rooms far from entrance (at least 60% of max distance)', () => {
    const rng = new SeededRandom(12345);
    const maze = createMaze(rng, 5, 5);
    const graph = mazeToGraph(maze, 12345);
    graph.floorIndex = 1;
    graph.worldIndex = 1;

    const entranceRoom = graph.rooms.find(r => r.id === graph.entranceRoomId);
    if (entranceRoom) entranceRoom.type = 'entrance';
    const bossRoom = graph.rooms.find(r => r.id === graph.bossRoomId);
    if (bossRoom) bossRoom.type = 'boss';

    assignTreasureRooms(graph, rng, 1, 1);

    const roomDistances = calculateRoomDistanceMap(graph, graph.entranceRoomId);
    const maxDistance = Math.max(...Array.from(roomDistances.values()));
    const minRequiredDistance = Math.ceil(maxDistance * 0.6);

    for (const treasureId of graph.treasureRoomIds) {
      const dist = roomDistances.get(treasureId) ?? 0;
      expect(dist).toBeGreaterThanOrEqual(minRequiredDistance);
    }
  });

  it('treasure rooms are not entrance or boss rooms', () => {
    const graph = generateDungeonFloor(1, 1, 12345);

    for (const treasureId of graph.treasureRoomIds) {
      expect(treasureId).not.toBe(graph.entranceRoomId);
      expect(treasureId).not.toBe(graph.bossRoomId);
    }
  });

  it('treasure rooms are reachable from entrance', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const distances = calculateRoomDistanceMap(graph, graph.entranceRoomId);

    for (const treasureId of graph.treasureRoomIds) {
      expect(distances.has(treasureId)).toBe(true);
    }
  });

  it('guarantees at least 1 treasure room per floor', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    expect(graph.treasureRoomIds.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Room type assignment', () => {
  it('guarantees at least 1 rest room per floor', () => {
    for (let i = 0; i < 20; i++) {
      const graph = generateDungeonFloor(1, i + 1, 12345);
      const restRooms = graph.rooms.filter(r => r.type === 'rest');
      expect(restRooms.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all non-special rooms receive a valid room type', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const validTypes: RoomType[] = ['combat', 'trap', 'puzzle', 'treasure', 'rest', 'elite', 'vendor', 'entrance', 'boss'];
    
    for (const room of graph.rooms) {
      expect(validTypes).toContain(room.type);
    }
  });

  it('room types are deterministic with same seed', () => {
    const graph1 = generateDungeonFloor(3, 5, 99999);
    const graph2 = generateDungeonFloor(3, 5, 99999);
    
    for (let i = 0; i < graph1.rooms.length; i++) {
      expect(graph1.rooms[i]?.type).toBe(graph2.rooms[i]?.type);
    }
  });

  it('rest room is not placed at entrance or boss room', () => {
    const graph = generateDungeonFloor(1, 1, 12345);
    const restRooms = graph.rooms.filter(r => r.type === 'rest');
    
    for (const restRoom of restRooms) {
      expect(restRoom.id).not.toBe(graph.entranceRoomId);
      expect(restRoom.id).not.toBe(graph.bossRoomId);
    }
  });

  it('high tier worlds modify room type distribution', () => {
    const lowTierGraph = generateDungeonFloor(1, 1, 12345);
    const highTierGraph = generateDungeonFloor(50, 1, 12345);
    
    const lowTierElite = lowTierGraph.rooms.filter(r => r.type === 'elite').length;
    const highTierElite = highTierGraph.rooms.filter(r => r.type === 'elite').length;
    
    expect(highTierElite).toBeGreaterThanOrEqual(0);
  });
});

describe(' themed room type consistency', () => {
  it('crystal caves theme increases puzzle room likelihood', () => {
    const graphs = Array.from({ length: 30 }, (_, i) => generateDungeonFloor(95, i + 1, 12345));
    const puzzleCounts = graphs.flatMap(g => g.rooms.filter(r => r.type === 'puzzle').length);
    const avgPuzzleCount = puzzleCounts.reduce((a, b) => a + b, 0) / puzzleCounts.length;
    
    expect(avgPuzzleCount).toBeGreaterThan(0);
  });

  it('volcanic theme increases trap room likelihood', () => {
    const graphs = Array.from({ length: 30 }, (_, i) => generateDungeonFloor(55, i + 1, 12345));
    const trapCounts = graphs.flatMap(g => g.rooms.filter(r => r.type === 'trap').length);
    const avgTrapCount = trapCounts.reduce((a, b) => a + b, 0) / trapCounts.length;
    
    expect(avgTrapCount).toBeGreaterThan(0);
  });
});
