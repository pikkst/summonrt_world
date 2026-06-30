import { SeededRandom } from '../../utils/SeededRandom';
import { calculateRoomDistanceMap } from './Pathfinding';
import { getBiomeForCoords } from './Biome';
import type { DungeonFloorGraph, RoomType, DungeonRoom } from '../../types/game';

export interface RoomTypeTheme {
  roomTypes: RoomType[];
  weights: number[];
}

export const BIOME_ROOM_THEMES: Record<string, RoomTypeTheme> = {
  forest: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.35, 0.15, 0.15, 0.15, 0.15, 0.05]
  },
  volcanic: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.4, 0.2, 0.1, 0.1, 0.15, 0.05]
  },
  crystal_caves: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.25, 0.1, 0.25, 0.15, 0.2, 0.05]
  },
  coast: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.3, 0.1, 0.1, 0.2, 0.15, 0.15]
  },
  plains: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.35, 0.1, 0.1, 0.2, 0.1, 0.15]
  },
  swamp: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.3, 0.2, 0.15, 0.15, 0.1, 0.1]
  },
  desert: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.4, 0.15, 0.1, 0.15, 0.15, 0.05]
  },
  tundra: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.35, 0.1, 0.15, 0.2, 0.1, 0.1]
  },
  mountains: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.4, 0.1, 0.1, 0.15, 0.2, 0.05]
  },
  sky_islands: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.3, 0.05, 0.2, 0.2, 0.2, 0.05]
  },
  default: {
    roomTypes: ['combat', 'trap', 'puzzle', 'rest', 'elite', 'vendor'],
    weights: [0.3, 0.15, 0.15, 0.15, 0.15, 0.1]
  }
};

const TIER_MODIFIERS = {
  trap: (tier: number) => tier > 2 ? 0.2 : 0.15,
  puzzle: (tier: number) => tier > 1 ? 0.2 : 0.15,
  elite: (tier: number) => tier > 3 ? 0.2 : 0.1,
  vendor: (tier: number) => tier > 4 ? 0.15 : 0.05,
  rest: () => 0.15
};

export function assignTreasureRooms(
  graph: DungeonFloorGraph,
  rng: SeededRandom,
  worldIndex: number,
  floorIndex: number
): void {
  const { rooms, entranceRoomId, bossRoomId } = graph;

  const roomDistances = calculateRoomDistanceMap(graph, entranceRoomId);
  const maxDistance = Math.max(...Array.from(roomDistances.values()));

  const farRooms = rooms.filter(r =>
    r.id !== entranceRoomId &&
    r.id !== bossRoomId &&
    (r.type === 'combat' || r.type === undefined) &&
    (roomDistances.get(r.id) ?? 0) >= Math.ceil(maxDistance * 0.6)
  );

  const minTreasureRooms = 1;
  const maxTreasureRooms = Math.max(3, Math.floor(rooms.length / 10));
  const treasureCount = rng.int(minTreasureRooms, maxTreasureRooms);

  const treasureRooms: DungeonRoom[] = [];
  const shuffled = rng.shuffle([...farRooms]);

  for (let i = 0; i < Math.min(treasureCount, shuffled.length); i++) {
    const room = shuffled[i];
    if (room) {
      room.type = 'treasure';
      treasureRooms.push(room);
    }
  }

  graph.treasureRoomIds = treasureRooms.map(r => r.id);
}

export function assignOtherRoomTypes(
  graph: DungeonFloorGraph,
  rng: SeededRandom,
  _worldIndex: number
): void {
  const worldTier = Math.max(1, Math.floor(_worldIndex / 10) + 1);

  const weightedTypes: RoomType[] = [];

  const biomes = new Map<string, RoomType[]>();
  for (const room of graph.rooms) {
    const biome = getBiomeForCoords(room.x, room.y, _worldIndex);
    const theme = (BIOME_ROOM_THEMES[biome] || BIOME_ROOM_THEMES.default) as RoomTypeTheme;
    const types: RoomType[] = [];
    for (let i = 0; i < theme.roomTypes.length; i++) {
      const type = theme.roomTypes[i];
      const baseWeight = theme.weights[i] ?? 0.1;
      const modifier = type && TIER_MODIFIERS[type as keyof typeof TIER_MODIFIERS];
      const finalWeight = typeof modifier === 'function' ? modifier(worldTier) : baseWeight;
      const count = Math.max(1, Math.floor(finalWeight * graph.rooms.length));
      for (let j = 0; j < count; j++) {
        if (type) types.push(type);
      }
    }
    biomes.set(room.id, types);
  }

  const assignableRooms = graph.rooms.filter(r =>
    r.type === 'combat' || r.type === undefined
  );

  const restRoomCandidates = assignableRooms
    .filter(r => r.type !== 'treasure' && r.type !== 'entrance' && r.type !== 'boss');
  const shuffled = rng.shuffle(restRoomCandidates);

  if (shuffled.length > 0) {
    const restRoom = shuffled[0];
    if (restRoom) restRoom.type = 'rest';
  }

  for (const room of assignableRooms) {
    if (room.type === 'rest') continue;
    const roomTypes = biomes.get(room.id) || [];
    const type = rng.pick(roomTypes);
    if (type) room.type = type;
  }
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

  assignTreasureRooms(graph, rng, worldIndex, floorIndex);
  assignOtherRoomTypes(graph, rng, worldIndex);
}
