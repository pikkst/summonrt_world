import { SeededRandom } from '../../utils/SeededRandom';
import { GRID_WIDTH, GRID_HEIGHT, getDungeonFloorSeed } from './DungeonSeeds';
import { assignRoomTypes } from './RoomAssignment';
import { ensureMultipleShortestPaths } from './Pathfinding';
import type { DungeonFloorGraph, DungeonRoom } from '../../types/game';

export interface MazeCell {
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
    treasureRoomIds: [],
    layoutType: 'maze'
  };
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
  graph.layoutType = 'maze';

  assignRoomTypes(graph, rng, worldIndex, floorIndex);
  ensureMultipleShortestPaths(graph, rng);

  return graph;
}
