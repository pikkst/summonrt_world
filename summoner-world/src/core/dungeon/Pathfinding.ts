import type { DungeonFloorGraph } from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';

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
