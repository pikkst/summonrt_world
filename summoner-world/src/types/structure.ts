import type { BiomeType } from './game';

export type StructureType = 'house' | 'farm' | 'workshop' | 'manor' | 'castle' | 'town';

export interface Structure {
  id: string;
  type: StructureType;
  worldId: number;
  tileX: number;
  tileY: number;
  level: number;
  builtAt: number;
  ownerId: string;
}

export interface StructureDefinition {
  type: StructureType;
  name: string;
  description: string;
  minWorldId: number;
  minPlayerLevel: number;
  cost: number;
  minDistanceFromOtherStructures: number;
  validBiomes: BiomeType[];
  disallowedSpecialTypes: string[];
}

export interface StructurePlacementResult {
  success: boolean;
  structure?: Structure;
  reason?: string;
}

export const STRUCTURE_DEFINITIONS: Record<StructureType, StructureDefinition> = {
  house: {
    type: 'house',
    name: 'House',
    description: 'A basic dwelling for the summoner.',
    minWorldId: 1,
    minPlayerLevel: 1,
    cost: 100,
    minDistanceFromOtherStructures: 50,
    validBiomes: ['forest', 'plains', 'coast', 'swamp', 'desert', 'tundra'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
  farm: {
    type: 'farm',
    name: 'Farm',
    description: 'Produces food and basic materials.',
    minWorldId: 1,
    minPlayerLevel: 1,
    cost: 150,
    minDistanceFromOtherStructures: 50,
    validBiomes: ['plains', 'forest', 'coast', 'swamp'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
  workshop: {
    type: 'workshop',
    name: 'Workshop',
    description: 'Required for intermediate and advanced crafting.',
    minWorldId: 1,
    minPlayerLevel: 1,
    cost: 200,
    minDistanceFromOtherStructures: 50,
    validBiomes: ['forest', 'plains', 'mountains', 'coast'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
  manor: {
    type: 'manor',
    name: 'Manor',
    description: 'A grand estate with expanded storage.',
    minWorldId: 5,
    minPlayerLevel: 10,
    cost: 1000,
    minDistanceFromOtherStructures: 100,
    validBiomes: ['forest', 'plains', 'coast'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
  castle: {
    type: 'castle',
    name: 'Castle',
    description: 'A fortified stronghold with defensive bonuses.',
    minWorldId: 10,
    minPlayerLevel: 25,
    cost: 5000,
    minDistanceFromOtherStructures: 150,
    validBiomes: ['mountains', 'plains', 'coast', 'volcanic'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
  town: {
    type: 'town',
    name: 'Town',
    description: 'A growing settlement with regional influence.',
    minWorldId: 15,
    minPlayerLevel: 40,
    cost: 20000,
    minDistanceFromOtherStructures: 200,
    validBiomes: ['plains', 'coast', 'forest'],
    disallowedSpecialTypes: ['city', 'dungeon', 'cave', 'monument', 'well', 'ruins', 'outpost', 'grove', 'shrine'],
  },
};

export function getStructureDefinition(type: StructureType): StructureDefinition {
  return STRUCTURE_DEFINITIONS[type];
}

export function isValidStructureType(type: string): type is StructureType {
  return type in STRUCTURE_DEFINITIONS;
}
