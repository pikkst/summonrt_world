import { SeededRandom } from '../utils/SeededRandom.ts';
import type { TileData, WorldData, ElementalAffinity, NPC, WeatherState, Settlement } from '../types/game.ts';
import { RESOURCES, getWorldName, getFloorSeed, getTileKey, getNeighbors, WORLD_SIZE } from '../data/constants.ts';
import { getBiomeForCoords } from './dungeon/Biome';
import { createInitialWeatherState } from './Weather';
import { generateSettlements } from './settlementGenerator';

const NPC_NAMES = ['Elder Thorne', 'Summoner Kai', 'Merchant Jace', 'Healer Aria', 'Guide Lyra'];

function hash(x: number, y: number, floorSeed: number, salt: string = ''): number {
  const str = `${x},${y},${floorSeed},${salt}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 1000000) / 1000000;
}

function generateNPC(rng: SeededRandom, role: NPC['role']): NPC {
  return {
    id: `npc_${rng.int(0, 99999)}`,
    name: rng.pick(NPC_NAMES) || 'Unknown NPC',
    role,
    dialogue: [`Greetings, Traveler. This sector of Floor 1 is vast beyond imagination.`],
    quests: role === 'quest_giver' ? ['starter_explore', 'starter_capture'] : [],
  };
}

export function generateTile(x: number, y: number, worldId: number): TileData {
   const floorSeed = getFloorSeed(worldId);
   const h = (s: string) => hash(x, y, floorSeed, s);
   const biome = getBiomeForCoords(x, y, floorSeed);

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
     };
   } else if (x < 50 && y < 50) { // Starting Area
     if (x === 10 && y === 10) {
       specialType = 'city';
       npc = {
         id: 'nexus_elder',
         name: 'Elder Thorne',
         role: 'elder',
         dialogue: ['Welcome to the Edge of the World. The Great Spire lies at the exact center (1000, 1000). Your journey begins here.'],
         quests: ['starter_explore', 'starter_capture', 'dungeon_clear_1', 'capture_rare', 'explore_10']
       };
     }
    } else if (specialRoll < 0.005) { // 0.5% chance for landmark
      const specialTypes = ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'];
      const specialIdx = Math.floor(h('special_type') * specialTypes.length);
      specialType = specialTypes[specialIdx] as TileData['specialType'];
     if (specialType === 'city' || specialType === 'outpost') {
       const rng = new SeededRandom(x * y + floorSeed);
       npc = generateNPC(rng, 'quest_giver');
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
        const tile = generateTile(tx, ty, worldId);
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
