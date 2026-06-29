import { describe, it, expect } from 'vitest';
import {
  getDungeonFloorSeed,
  generateDungeonFloor,
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
import type { DungeonFloorGraph } from '../types/game';

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