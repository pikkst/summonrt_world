import type { Settlement, SettlementType, BiomeType } from '../types/game';
import { sampleBiomeGeneration } from './dungeon/Biome';
import { SeededRandom } from '../utils/SeededRandom';

const WORLD_SIZE = 2000;
const MIN_SETTLEMENT_DISTANCE = 200;
const MAX_SETTLEMENTS_PER_WORLD = 15;

const BIOME_SETTLEMENT_WEIGHTS: Record<BiomeType, SettlementType[]> = {
  forest: ['city', 'village', 'settlement'],
  plains: ['city', 'village', 'settlement'],
  mountains: ['fort', 'village', 'outpost'],
  swamp: ['village', 'settlement', 'outpost'],
  desert: ['village', 'outpost', 'fort'],
  tundra: ['village', 'outpost', 'fort'],
  coast: ['city', 'village', 'settlement'],
  volcanic: ['fort', 'outpost', 'village'],
  crystal_caves: ['outpost', 'village', 'settlement'],
  sky_islands: ['outpost', 'village', 'settlement'],
};

const WATER_BIOME_SETTLEMENTS: BiomeType[] = ['coast', 'swamp'];

function hashCoord(x: number, y: number, seed: number, salt: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041) ^ salt;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function getElevation(x: number, y: number, seed: number): number {
  const normalizedX = x / WORLD_SIZE;
  const normalizedY = y / WORLD_SIZE;
  
  let elevation = 0;
  let amplitude = 0.5;
  let frequency = 1;
  
  for (let octave = 0; octave < 4; octave++) {
    const hashValue = hashCoord(
      Math.floor(normalizedX * frequency * 100),
      Math.floor(normalizedY * frequency * 100),
      seed,
      1000 + octave
    ) / 0xffffffff;
    
    elevation += (hashValue * 2 - 1) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return Math.max(0, Math.min(1, (elevation + 1) / 2));
}

function isNearWaterSimple(x: number, y: number, worldSeed: number): boolean {
  const currentBiome = sampleBiomeGeneration(x, y, worldSeed).biome;
  if (WATER_BIOME_SETTLEMENTS.includes(currentBiome)) {
    return true;
  }
  
  const directions = [
    { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
    { dx: 0, dy: -2 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 },
    { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
  ];
  
  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) continue;
    const neighborBiome = sampleBiomeGeneration(nx, ny, worldSeed).biome;
    if (WATER_BIOME_SETTLEMENTS.includes(neighborBiome)) {
      return true;
    }
  }
  
  return false;
}

function getBiomeAtCoords(x: number, y: number, worldSeed: number): BiomeType {
  return sampleBiomeGeneration(x, y, worldSeed).biome;
}

function generateSettlementName(rng: SeededRandom, biome: BiomeType): string {
  const prefixes: Record<BiomeType, string[]> = {
    forest: ['Elder', 'Green', 'Wood', 'Thorn', 'Oak'],
    plains: ['Sunny', 'Golden', 'Meadow', 'Dawn', 'Hill'],
    mountains: ['Stone', 'Iron', 'Forge', 'Peak', 'Hold'],
    swamp: ['Mire', 'Marsh', 'Bog', 'Moss', 'Willow'],
    desert: ['Sun', 'Sand', 'Oasis', 'Dune', 'Scorpion'],
    tundra: ['Ice', 'Snow', 'Frost', 'Winter', 'Glacier'],
    coast: ['Harbor', 'Port', 'Bay', 'Shore', 'Anchor'],
    volcanic: ['Ash', 'Magma', 'Forge', 'Flame', 'Lava'],
    crystal_caves: ['Crystal', 'Gem', 'Shimmer', 'Echo', 'Deep'],
    sky_islands: ['Cloud', 'High', 'Aerial', 'Wind', 'Sky'],
  };

  const suffixes: Record<BiomeType, string[]> = {
    forest: ['haven', 'grove', 'hold', 'rest', 'fall'],
    plains: ['haven', 'grove', 'hold', 'rest', 'fall'],
    mountains: ['hold', 'fort', 'keep', 'tower', 'city'],
    swamp: ['haven', 'grove', 'hold', 'rest', 'fall'],
    desert: ['haven', 'grove', 'fort', 'rest', 'fall'],
    tundra: ['hold', 'fort', 'haven', 'rest', 'fall'],
    coast: ['haven', 'port', 'bay', 'city', 'hold'],
    volcanic: ['hold', 'fort', 'haven', 'city', 'fall'],
    crystal_caves: ['haven', 'grove', 'hold', 'rest', 'fall'],
    sky_islands: ['haven', 'grove', 'hold', 'rest', 'fall'],
  };

  const biomePrefixes = prefixes[biome] || ['New'];
  const biomeSuffixes = suffixes[biome] || ['Haven'];

  const prefix = biomePrefixes[rng.int(0, biomePrefixes.length - 1)]!;
  const suffix = biomeSuffixes[rng.int(0, biomeSuffixes.length - 1)]!;

  return `${prefix} ${suffix}`;
}

function isValidSettlementLocation(
  x: number,
  y: number,
  existingSettlements: Settlement[],
  minDist: number
): boolean {
  for (const settlement of existingSettlements) {
    const distance = Math.hypot(x - settlement.x, y - settlement.y);
    if (distance < minDist) {
      return false;
    }
  }
  return true;
}

function shouldPlaceSettlementHere(
  x: number,
  y: number,
  biome: BiomeType,
  elevation: number,
  nearWater: boolean,
  rng: SeededRandom
): { shouldPlace: boolean; type: SettlementType } {
  const weights = BIOME_SETTLEMENT_WEIGHTS[biome] || ['village', 'settlement'];
  
  const isRidge = elevation > 0.85;
  
  if (isRidge && weights.includes('fort')) {
    if (rng.chance(0.15)) {
      return { shouldPlace: true, type: 'fort' };
    }
  }
  
  if (nearWater && biome === 'coast' && weights.includes('city')) {
    if (rng.chance(0.25)) {
      return { shouldPlace: true, type: 'city' };
    }
  }
  
  if (nearWater && weights.includes('city')) {
    if (rng.chance(0.15)) {
      return { shouldPlace: true, type: 'city' };
    }
  }
  
  if (biome === 'swamp' && weights.includes('village')) {
    if (rng.chance(0.12)) {
      return { shouldPlace: true, type: 'village' };
    }
  }
  
  if (!isRidge && !nearWater) {
    if (rng.chance(0.08)) {
      const type = weights[rng.int(0, weights.length - 1)]!;
      return { shouldPlace: true, type };
    }
  }
  
  return { shouldPlace: false, type: 'village' };
}

export function generateSettlements(worldId: number, worldSeed: number): Settlement[] {
  const rng = new SeededRandom(`settlement_${worldId}_${worldSeed}`);
  const settlements: Settlement[] = [];
  
  const candidatePositions: [number, number][] = [];
  
  for (let i = 0; i < 200; i++) {
    const x = rng.int(50, WORLD_SIZE - 51);
    const y = rng.int(50, WORLD_SIZE - 51);
    candidatePositions.push([x, y]);
  }
  
  for (const [x, y] of candidatePositions) {
    if (settlements.length >= MAX_SETTLEMENTS_PER_WORLD) break;
    
    if (!isValidSettlementLocation(x, y, settlements, MIN_SETTLEMENT_DISTANCE)) {
      continue;
    }
    
    const biome = getBiomeAtCoords(x, y, worldSeed);
    const elevation = getElevation(x, y, worldSeed);
    const nearWater = isNearWaterSimple(x, y, worldSeed);
    
    const { shouldPlace, type } = shouldPlaceSettlementHere(
      x, y, biome, elevation, nearWater, rng
    );
    
    if (shouldPlace) {
      const settlementId = `settlement_${worldId}_${x}_${y}`;
      const settlement: Settlement = {
        id: settlementId,
        type,
        worldId,
        x,
        y,
        name: generateSettlementName(rng, biome),
        biome,
        elevation,
        nearWater,
        discovered: false,
      };
      settlements.push(settlement);
    }
  }
  
  if (settlements.length === 0) {
    const fallbackX = WORLD_SIZE / 2;
    const fallbackY = WORLD_SIZE / 2;
    const biome = getBiomeAtCoords(fallbackX, fallbackY, worldSeed);
    const elevation = getElevation(fallbackX, fallbackY, worldSeed);
    const nearWater = isNearWaterSimple(fallbackX, fallbackY, worldSeed);
    
    const type = nearWater ? 'city' : elevation > 0.7 ? 'fort' : 'village';
    
    settlements.push({
      id: `settlement_${worldId}_${Math.floor(fallbackX)}_${Math.floor(fallbackY)}`,
      type,
      worldId,
      x: Math.floor(fallbackX),
      y: Math.floor(fallbackY),
      name: generateSettlementName(rng, biome),
      biome,
      elevation,
      nearWater,
      discovered: false,
    });
  }
  
  return settlements;
}

export function getSettlementAt(
  x: number,
  y: number,
  settlements: Settlement[],
  radius: number = 50
): Settlement | undefined {
  for (const settlement of settlements) {
    const distance = Math.hypot(x - settlement.x, y - settlement.y);
    if (distance <= radius) {
      return settlement;
    }
  }
  return undefined;
}

export function getNearestSettlement(
  x: number,
  y: number,
  settlements: Settlement[]
): Settlement | undefined {
  if (settlements.length === 0) return undefined;
  
  let nearest = settlements[0]!;
  let minDistance = Math.hypot(x - nearest.x, y - nearest.y);
  
  for (let i = 1; i < settlements.length; i++) {
    const s = settlements[i]!;
    const distance = Math.hypot(x - s.x, y - s.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = s;
    }
  }
  
  return nearest;
}

export const CITY_BIOME_BIAS: BiomeType[] = ['coast', 'forest', 'plains'];
export const FORT_BIOME_BIAS: BiomeType[] = ['mountains', 'volcanic', 'desert', 'tundra'];
export const VILLAGE_BIOME_BIAS: BiomeType[] = ['swamp', 'desert', 'tundra', 'crystal_caves', 'sky_islands'];