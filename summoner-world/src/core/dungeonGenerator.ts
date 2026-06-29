import type { DungeonFloorGraph, DungeonRoom, RoomType } from '../types/game';
import { SeededRandom } from '../utils/SeededRandom';

const DUNGEON_BASE_FLOORS = 3;
const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;

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

interface MazeCell {
  x: number;
  y: number;
  visited: boolean;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
}

export function createMaze(rng: SeededRandom, width: number, height: number): MazeCell[][] {
  const maze: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        visited: false,
        walls: { north: true, south: true, east: true, west: true }
      });
    }
    maze.push(row);
  }

  const stack: MazeCell[] = [];
  let current: MazeCell | undefined = maze[0]?.[0];
  if (current) current.visited = true;

  while (stack.length > 0 || !isMazeComplete(maze)) {
    const neighbors = current ? getUnvisitedNeighbors(current, maze) : [];
    
    if (neighbors.length > 0) {
      if (current) stack.push(current);
      const next = rng.pick(neighbors);
      if (next) {
        if (current) removeWalls(current, next);
        current = next;
        current.visited = true;
      }
    } else if (stack.length > 0) {
      current = stack.pop();
    }
  }

  return maze;
}

function isMazeComplete(maze: MazeCell[][]): boolean {
  for (const row of maze) {
    for (const cell of row) {
      if (!cell.visited) return false;
    }
  }
  return true;
}

function getUnvisitedNeighbors(cell: MazeCell, maze: MazeCell[][]): MazeCell[] {
  const neighbors: MazeCell[] = [];
  const { x, y } = cell;

  const north = maze[y - 1]?.[x];
  if (y > 0 && north && !north.visited) neighbors.push(north);
  
  const south = maze[y + 1]?.[x];
  if (y < maze.length - 1 && south && !south.visited) neighbors.push(south);
  
  const west = maze[y]?.[x - 1];
  if (x > 0 && west && !west.visited) neighbors.push(west);
  
  const east = maze[y]?.[x + 1];
  if (east && x < (maze[0]?.length ?? 0) - 1 && !east.visited) neighbors.push(east);

  return neighbors;
}

function removeWalls(a: MazeCell, b: MazeCell): void {
  if (a.x === b.x) {
    if (a.y > b.y) {
      a.walls.north = false;
      b.walls.south = false;
    } else {
      a.walls.south = false;
      b.walls.north = false;
    }
  } else if (a.y === b.y) {
    if (a.x > b.x) {
      a.walls.west = false;
      b.walls.east = false;
    } else {
      a.walls.east = false;
      b.walls.west = false;
    }
  }
}

export function mazeToGraph(maze: MazeCell[][], seed: number): DungeonFloorGraph {
  const rooms: DungeonRoom[] = [];
  
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < (maze[y]?.length ?? 0); x++) {
      const cell = maze[y]?.[x];
      if (!cell) continue;
      
      const connections: string[] = [];
      
      if (!cell.walls.north && y > 0) connections.push(`room_${y - 1}_${x}`);
      if (!cell.walls.south && y < maze.length - 1) connections.push(`room_${y + 1}_${x}`);
      if (!cell.walls.west && x > 0) connections.push(`room_${y}_${x - 1}`);
      if (!cell.walls.east && x < (maze[0]?.length ?? 0) - 1) connections.push(`room_${y}_${x + 1}`);
      
      rooms.push({
        id: `room_${y}_${x}`,
        x,
        y,
        type: 'combat',
        connections
      });
    }
  }

  const firstRow = maze[0];
  const bossRoomId = `room_${maze.length - 1}_${firstRow ? firstRow.length - 1 : 0}`;
  
  return {
    floorIndex: 0,
    worldIndex: 0,
    seed,
    rooms,
    entranceRoomId: `room_0_0`,
    bossRoomId,
    treasureRoomIds: []
  };
}

export function assignRoomTypes(
  graph: DungeonFloorGraph,
  rng: SeededRandom,
  worldIndex: number,
  floorIndex: number
): void {
  const { rooms, entranceRoomId, bossRoomId } = graph;
  
  const entranceRoom = rooms.find(r => r.id === entranceRoomId);
  if (entranceRoom) entranceRoom.type = 'entrance';

  const bossRoom = rooms.find(r => r.id === bossRoomId);
  if (bossRoom) bossRoom.type = 'boss';

  const otherRooms = rooms.filter(r => r.id !== entranceRoomId && r.id !== bossRoomId);
  const treasureCount = rng.int(1, 3);
  const treasureRooms: DungeonRoom[] = [];

  for (let i = 0; i < treasureCount; i++) {
    const room = rng.pick(otherRooms);
    if (room) {
      room.type = 'treasure';
      treasureRooms.push(room);
      const idx = otherRooms.indexOf(room);
      if (idx > -1) otherRooms.splice(idx, 1);
    }
  }
  graph.treasureRoomIds = treasureRooms.map(r => r.id);

  const roomTypes: RoomType[] = ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'];
  for (const room of otherRooms) {
    const type = rng.pick(roomTypes);
    if (type) room.type = type;
  }
}

export function generateDungeonFloor(
  worldIndex: number,
  floorIndex: number,
  globalSeed: number
): DungeonFloorGraph {
  const seed = getDungeonFloorSeed(worldIndex, floorIndex, globalSeed);
  const rng = new SeededRandom(seed);

  const maze = createMaze(rng, GRID_WIDTH, GRID_HEIGHT);
  const graph = mazeToGraph(maze, seed);
  
  graph.floorIndex = floorIndex;
  graph.worldIndex = worldIndex;
  
  assignRoomTypes(graph, rng, worldIndex, floorIndex);
  ensureMultipleShortestPaths(graph, rng);

  return graph;
}

export function findShortestPath(
  graph: DungeonFloorGraph,
  startId: string,
  endId: string
): string[] | null {
  const queue: string[][] = [[startId]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];
    if (currentId === undefined) continue;

    if (currentId === endId) return path;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentRoom = graph.rooms.find(r => r.id === currentId);
    if (!currentRoom) continue;

    for (const neighborId of currentRoom.connections) {
      if (!visited.has(neighborId)) {
        queue.push([...path, neighborId]);
      }
    }
  }

  return null;
}

export function findAllShortestPaths(
  graph: DungeonFloorGraph,
  startId: string,
  endId: string
): string[][] {
  const allPaths: string[][] = [];
  const queue: string[][] = [[startId]];
  let shortestLength = Infinity;
  let foundFirst = false;

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];
    if (currentId === undefined) continue;

    if (currentId === endId) {
      if (!foundFirst) {
        shortestLength = path.length;
        foundFirst = true;
      }
      if (path.length === shortestLength) {
        allPaths.push(path);
      }
      continue;
    }

    const currentRoom = graph.rooms.find(r => r.id === currentId);
    if (!currentRoom) continue;

    for (const neighborId of currentRoom.connections) {
      if (!path.includes(neighborId)) {
        queue.push([...path, neighborId]);
      }
    }
  }

  return allPaths;
}

export function calculateRoomDistanceMap(
  graph: DungeonFloorGraph,
  startId: string
): Map<string, number> {
  const distances = new Map<string, number>();
  const queue: string[] = [startId];
  distances.set(startId, 0);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDist = distances.get(currentId)!;

    const currentRoom = graph.rooms.find(r => r.id === currentId);
    if (!currentRoom) continue;

    for (const neighborId of currentRoom.connections) {
      if (!distances.has(neighborId)) {
        distances.set(neighborId, currentDist + 1);
        queue.push(neighborId);
      }
    }
  }

  return distances;
}

export function ensureMultipleShortestPaths(graph: DungeonFloorGraph, rng: SeededRandom = new SeededRandom(graph.seed)): void {
  const entranceRoom = graph.rooms.find(r => r.type === 'entrance') || graph.rooms[0];
  const bossRoom = graph.rooms.find(r => r.type === 'boss') || graph.rooms[graph.rooms.length - 1];

  if (!entranceRoom || !bossRoom) return;

  const startId = entranceRoom.id;
  const endId = bossRoom.id;

  let paths = findAllShortestPaths(graph, startId, endId);

  if (paths.length >= 3) return;

  const bossDist = calculateRoomDistanceMap(graph, endId);

  const pathRooms = new Set<string>();
  for (const path of paths) {
    for (const roomId of path) {
      pathRooms.add(roomId);
    }
  }

  for (const room of graph.rooms) {
    if (paths.length >= 3) break;

    if (room.id === startId || room.id === endId || pathRooms.has(room.id)) continue;

    const roomDist = bossDist.get(room.id) ?? 999;

    const roomsAtDistPlus1 = graph.rooms.filter(r => 
      r.id !== room.id && bossDist.get(r.id) === roomDist + 1 && r.connections.length < 4
    );

    const roomsAtDistMinus1 = graph.rooms.filter(r => 
      r.id !== room.id && bossDist.get(r.id) === roomDist - 1 && r.connections.length < 4
    );

    const connectToPlus1 = rng.pick(roomsAtDistPlus1);
    const connectToMinus1 = rng.pick(roomsAtDistMinus1);

    if (connectToMinus1 && !room.connections.includes(connectToMinus1.id)) {
      room.connections.push(connectToMinus1.id);
      connectToMinus1.connections.push(room.id);
    }

    if (connectToPlus1 && !room.connections.includes(connectToPlus1.id)) {
      room.connections.push(connectToPlus1.id);
      connectToPlus1.connections.push(room.id);
    }

    paths = findAllShortestPaths(graph, startId, endId);
  }
}

function isOnShortestPath(
  graph: DungeonFloorGraph,
  startId: string,
  endId: string,
  roomId: string
): boolean {
  const bossDist = calculateRoomDistanceMap(graph, endId);
  const roomDist = bossDist.get(roomId) ?? Infinity;

  const room = graph.rooms.find(r => r.id === roomId);
  if (!room) return false;

  for (const neighborId of room.connections) {
    const neighborDist = bossDist.get(neighborId) ?? Infinity;
    if (neighborDist === roomDist - 1) {
      return true;
    }
  }

  return false;
}