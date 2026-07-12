import { SeededRandom } from '../utils/SeededRandom.ts';
import type { TileData, WorldData, ElementalAffinity, NPC, WeatherState, Settlement } from '../types/game.ts';
import { RESOURCES, getWorldName, getFloorSeed, getTileKey, getNeighbors, WORLD_SIZE } from '../data/constants.ts';
import { getBiomeForCoords } from './dungeon/Biome';
import { createInitialWeatherState } from './Weather';
import { generateSettlements } from './settlementGenerator';
import { buildDefaultSchedule } from './npc/schedule';
import { createDefaultRelationship } from './npc/relationship';
import { worldEventBus } from './worldEventBus.ts';
import { FACTIONS, FACTION_IDS } from '../data/factions.ts';
import { generateNPCQuestBundle } from './quest/questGeneration';

const NPC_NAMES = ['Elder Thorne', 'Summoner Kai', 'Merchant Jace', 'Healer Aria', 'Guide Lyra'];

function hash(x: number, y: number, floorSeed: number, salt: string = ''): number {
  const str = `${x},${y},${floorSeed},${salt}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 1000000) / 1000000;
}

function pickFactionAlignment(rng: SeededRandom): NPC['factionAlignment'] {
  const factionId = rng.pick(FACTION_IDS) ?? 'merchant_guild';
  const loyaltyRaw = rng.int(-30, 60);
  const loyalty = Math.round(loyaltyRaw / 5) * 5;
  return { factionId, loyalty };
}

function generateNPC(rng: SeededRandom, role: NPC['role'], baseSeed: number, worldId: number): NPC {
  const schedule = buildDefaultSchedule(role, `${baseSeed}_${role}_${rng.int(0, 9999)}`);
  const factionAlignment = pickFactionAlignment(rng);
  const baseQuests = role === 'quest_giver' ? ['starter_explore', 'starter_capture'] : [];
  const proceduralQuests = generateNPCQuestBundle(
    `npc_${rng.int(0, 99999)}`,
    factionAlignment,
    worldId,
    worldId * 5,
    baseSeed
  );
  const quests = [...baseQuests, ...proceduralQuests.map((q) => q.key)];
  return {
    id: `npc_${rng.int(0, 99999)}`,
    name: rng.pick(NPC_NAMES) || 'Unknown NPC',
    role,
    dialogue: [`Greetings, Traveler. This sector of Floor 1 is vast beyond imagination.`],
    quests,
    schedule,
    currentActivity: schedule[0]?.activity ?? 'work',
    relationships: {},
    factionAlignment,
  };
}

export function generateTile(x: number, y: number, worldId: number): TileData {
  const tile = generateTileFromSeed(x, y, getFloorSeed(worldId), worldId);
  if (tile.resourceType && tile.resourceQty && tile.resourceQty > 0) {
    worldEventBus.publish({
      type: 'ResourceSpawned',
      worldId,
      x,
      y,
      resourceType: tile.resourceType,
      quantity: tile.resourceQty,
      gameTimeMinutes: 0,
      turnCount: 0,
    });
  }
  return tile;
}

export function generateTileFromSeed(x: number, y: number, seed: number, worldId: number): TileData {
  const h = (s: string) => hash(x, y, seed, s);
  const biome = getBiomeForCoords(x, y, seed);

  let resourceType: string | undefined;
  let resourceQty: number | undefined;

  if (h('res') < 0.3) {
    const resources = Object.keys(RESOURCES);
    resourceType = resources[Math.floor(h('res_type') * resources.length)];
    resourceQty = Math.floor(h('res_qty') * 5) + 1;
  }

  const specialRoll = h('special');
  let specialType: TileData['specialType'];
  let npc: NPC | undefined;

  // The Mega Dungeon (Center)
  if (x === 1000 && y === 1000) {
    specialType = 'dungeon';
    npc = {
      id: 'dungeon_gatekeeper',
      name: 'The Warden',
      role: 'elder',
      dialogue: ['Only the worthy may challenge the Floor Boss. The Spire reaches for the stars.'],
      schedule: buildDefaultSchedule('elder', 'dungeon_gatekeeper'),
      currentActivity: 'work',
      relationships: {},
    };
  } else if (x < 50 && y < 50) { // Starting Area
    if (x === 10 && y === 10) {
      specialType = 'city';
      npc = {
        id: 'nexus_elder',
        name: 'Elder Thorne',
        role: 'elder',
        dialogue: ['Welcome to the Edge of the World. The Great Spire lies at the exact center (1000, 1000). Your journey begins here.'],
        quests: ['starter_explore', 'starter_capture', 'dungeon_clear_1', 'capture_rare', 'explore_10'],
        schedule: buildDefaultSchedule('elder', 'nexus_elder'),
        currentActivity: 'work',
        relationships: {},
      };
    }
  } else if (specialRoll < 0.005) { // 0.5% chance for landmark
    const specialTypes = ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'];
    const specialIdx = Math.floor(h('special_type') * specialTypes.length);
    specialType = specialTypes[specialIdx] as TileData['specialType'];
    if (specialType === 'city' || specialType === 'outpost') {
      const rng = new SeededRandom(x * y + seed);
      npc = generateNPC(rng, 'quest_giver', seed, worldId);
    }
  }

  return {
    x,
    y,
    biome: biome as TileData['biome'],
    discovered: false,
    explored: false,
    specialType,
    npc,
    resourceType,
    resourceQty,
    encounterSeed: Math.floor(h('encounter') * 999999),
  };
}

export function generateWorld(worldId: number, _playerAffinity: ElementalAffinity | null): WorldData {
   const floorSeed = getFloorSeed(worldId);
   const tiles = new Map<string, TileData>();
   const startX = 10;
   const startY = 10;

   // Generate only the starting tile and its immediate neighbors
   for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = startX + dx;
        const ty = startY + dy;
         const tile = generateTileFromSeed(tx, ty, floorSeed, worldId);
        tile.discovered = true;
        if (dx === 0 && dy === 0) tile.explored = true;
        tiles.set(getTileKey(tx, ty), tile);
      }
    }

   const weather = createInitialWeatherState(floorSeed, 0);
   const settlements = generateSettlements(worldId, floorSeed);

   return {
      id: worldId,
      seed: floorSeed,
      name: getWorldName(worldId),
      tier: worldId,
      bossDefeated: false,
      dungeonFloors: 3 + worldId,
      tiles,
      startTile: { x: startX, y: startY },
      weather,
      settlements,
    };
  }
