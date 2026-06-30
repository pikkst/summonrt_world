export const DUNGEON_ASCEND_SCROLL = 'dungeon_ascend_scroll';

export const ELEMENTS = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'] as const;

export const AFFINITY_WEIGHT = {
  same: 1.0,
  neutral: 0.3,
  opposing: 0.1,
} as const;

export type AffinityWeightType = 'same' | 'neutral' | 'opposing';

export const RARITY_PENALTY = {
  common: 1.0,
  uncommon: 0.8,
  rare: 0.5,
  epic: 0.25,
  legendary: 0.2,
  mythical: 0.15,
};

export type RarityPenaltyType = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';

export const ALL_ELEMENTS = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness','void','starlight','chaos','omni'] as const;
export type AllElement = typeof ALL_ELEMENTS[number];
export const BIOME_TYPES = ['forest','plains','mountains','swamp','desert','tundra','coast','volcanic','crystal_caves','sky_islands'] as const;

// Global Seeds for each Floor (1-100)
// This ensures that coordinates (X,Y) are identical for all players globally.
export const FLOOR_SEEDS: Record<number, number> = {
  1: 1337,
  2: 8888,
  3: 4242,
  // ... can be expanded or generated deterministically
};

export function getFloorSeed(floor: number): number {
  return FLOOR_SEEDS[floor] || (floor * 999 + 123456);
}

export const BIOME_NAMES = { forest:'Enchanted Forest', plains:'Verdant Plains', mountains:'Stone Peaks', swamp:'Murky Swamp', desert:'Scorched Desert', tundra:'Frozen Tundra', coast:'Azure Coast', volcanic:'Volcanic Wastes', crystal_caves:'Crystal Caverns', sky_islands:'Sky Islands' };
export const WEATHER_TYPES = ['Clear','Cloudy','Rainy','Stormy','Foggy','Hail','Blizzard'] as const;
export const RESOURCES: Record<string, {name: string, icon: string}> = { 
  wood: { name: 'Wood', icon: '🌲' }, 
  stone: { name: 'Stone', icon: '🪨' }, 
  ore: { name: 'Ore', icon: '📦' }, 
  herbs: { name: 'Herbs', icon: '🌿' }, 
  crystal: { name: 'Crystal', icon: '💎' }, 
  essence: { name: 'Essence', icon: '✨' } 
};
export const CREATURE_CLASSES = ['common','uncommon','rare','epic','legendary','mythical'] as const;
export const CLASS_WEIGHTS = [60, 25, 10, 4, 0.9, 0.1];

export function getSoulCrystalTierForClass(creatureClass: string): string {
  const tierMap: Record<string, string> = {
    common: 'common',
    uncommon: 'uncommon',
    rare: 'rare',
    epic: 'epic',
    legendary: 'legendary',
    mythical: 'mythical',
  };
  return tierMap[creatureClass] || 'common';
}
export const DIRECTIONS = [{dx:0,dy:-1,name:'north',nameEn:'north'},{dx:0,dy:1,name:'south',nameEn:'south'},{dx:-1,dy:0,name:'west',nameEn:'west'},{dx:1,dy:0,name:'east',nameEn:'east'}];

export interface EvolutionStage {
  minLevel: number;
  newClass: string;
  statMultiplier: number;
}

export const EVOLUTION_CHAINS: Record<string, EvolutionStage[]> = {
  common: [
    { minLevel: 10, newClass: 'uncommon', statMultiplier: 1.3 },
    { minLevel: 30, newClass: 'rare', statMultiplier: 1.6 },
    { minLevel: 60, newClass: 'epic', statMultiplier: 2.0 },
  ],
  uncommon: [
    { minLevel: 20, newClass: 'rare', statMultiplier: 1.4 },
    { minLevel: 50, newClass: 'epic', statMultiplier: 1.8 },
    { minLevel: 80, newClass: 'legendary', statMultiplier: 2.2 },
  ],
  rare: [
    { minLevel: 40, newClass: 'epic', statMultiplier: 1.4 },
    { minLevel: 75, newClass: 'legendary', statMultiplier: 1.8 },
  ],
  epic: [
    { minLevel: 60, newClass: 'legendary', statMultiplier: 1.5 },
  ],
  legendary: [
    { minLevel: 90, newClass: 'mythical', statMultiplier: 1.6 },
  ],
};

export const MUTATION_TYPES = ['stat_shift', 'new_skill', 'passive_trait', 'elemental_drift'] as const;
export type MutationType = typeof MUTATION_TYPES[number];

export const MUTATION_SKILL_POOL = [
  'scratch', 'fire_blast', 'water_spray', 'stone_throw', 'wind_slash',
  'spark', 'iron_fist', 'vine_whip', 'ice_shard', 'holy_light', 'shadow_bolt',
] as const;

export const MUTATION_TRAIT_POOL = [
  'regeneration', 'strong', 'tough', 'swift', 'magic_affinity',
] as const;

export const MAX_MUTATIONS_PER_CLASS: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythical: 4,
};

export function getClassTier(creatureClass: string): number {
  const tiers: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythical: 5,
  };
  return tiers[creatureClass] || 0;
}

export function getMutationChance(tier: number): number {
  return 0.02 + tier * 0.01;
}

export function getMaxMutationsForClass(creatureClass: string): number {
  return MAX_MUTATIONS_PER_CLASS[creatureClass] || 0;
}

export function getBiomeForCoords(x: number, y: number, seed: number): string {
  // Natural gradient: Edge (0,0 or 2000,2000) is Water/Coast, moving towards center (1000,1000)
  const centerX = 1000;
  const centerY = 1000;
  const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  const maxDist = 1414; // sqrt(1000^2 + 1000^2)

  const noise = Math.abs(Math.sin(x * 0.01 + y * 0.01 + seed) * 0.5);
  const normalizedDist = (dist / maxDist) + (noise * 0.1);

  if (normalizedDist > 0.8) return 'coast';
  if (normalizedDist > 0.6) return 'plains';
  if (normalizedDist > 0.4) return 'forest';
  if (normalizedDist > 0.2) return 'mountains';
  if (normalizedDist > 0.05) return 'volcanic';
  return 'crystal_caves';
}

export function getWorldName(worldId: number): string {
  const prefixes = ['Shadow','Flame','Aqua','Stone','Storm','Frost','Ember','Wind','Terra','Crystal'];
  const suffixes = ['Realm','World','Domain','Field','Expanse'];
  return `${prefixes[(worldId-1)%prefixes.length]} ${suffixes[Math.floor((worldId-1)/prefixes.length)%suffixes.length]}`;
}

export function getTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
 return [
  { x: x - 1, y },
  { x: x + 1, y },
  { x, y: y - 1 },
  { x, y: y + 1 },
 ];
}

export const ELEMENT_OPPOSITIONS: Record<string, string[]> = {
  fire: ['water', 'earth', 'ice'],
  water: ['fire', 'nature', 'lightning'],
  earth: ['air', 'water', 'iron', 'lightning'],
  air: ['earth', 'iron', 'nature'],
  lightning: ['earth', 'fire', 'water'],
  iron: ['lightning', 'air'],
  nature: ['fire', 'ice'],
  ice: ['fire', 'water', 'nature'],
  light: ['darkness', 'void'],
  darkness: ['light', 'starlight'],
};

export function getAffinityWeight(
  playerElements: string[],
  creatureElements: string[]
): number {
  if (!playerElements || playerElements.length === 0) return AFFINITY_WEIGHT.neutral;
  if (!creatureElements || creatureElements.length === 0) return AFFINITY_WEIGHT.neutral;

  for (const playerEl of playerElements) {
    for (const creatureEl of creatureElements) {
      if (playerEl === creatureEl) return AFFINITY_WEIGHT.same;
      const opposites = ELEMENT_OPPOSITIONS[playerEl];
      if (opposites && opposites.includes(creatureEl)) return AFFINITY_WEIGHT.opposing;
    }
  }
  return AFFINITY_WEIGHT.neutral;
}

export interface CaptureFactors {
  hpFactor: number;
  affinityWeight: number;
  rarityPenalty: number;
  levelFactor: number;
}

export function calculateCaptureFactors(
  currentHp: number,
  maxHp: number,
  playerElements: string[],
  creatureElements: string[],
  creatureClass: string,
  playerLevel: number,
  creatureWorldLevel: number
): CaptureFactors {
  const hpFactor = 1 - (currentHp / maxHp);
  const affinityWeight = getAffinityWeight(playerElements, creatureElements);
  const rarityPenalty = (RARITY_PENALTY as Record<string, number>)[creatureClass] ?? 1.0;
  const levelDiff = Math.max(0, creatureWorldLevel - playerLevel);
  const levelFactor = Math.max(0.1, 1 - (levelDiff * 0.02));

  return { hpFactor, affinityWeight, rarityPenalty, levelFactor };
}

export function calculateBaseCaptureProbability(
  currentHp: number,
  maxHp: number,
  playerElements: string[],
  creatureElements: string[],
  creatureClass: string,
  playerLevel: number,
  creatureWorldLevel: number
): number {
  const { hpFactor, affinityWeight, rarityPenalty, levelFactor } = calculateCaptureFactors(
    currentHp, maxHp, playerElements, creatureElements, creatureClass, playerLevel, creatureWorldLevel
  );
  return hpFactor * affinityWeight * rarityPenalty * levelFactor;
}

export interface SpeciesLineDefinition {
  speciesKey: string;
  creatureType: string;
  elements: string[];
  prefixes: string[];
  suffixes: string[];
  stages: Array<{ class: string; minEvolutionLevel: number }>;
}

export const SPECIES_LINES: Record<string, SpeciesLineDefinition> = {
  fang_line: {
    speciesKey: 'fang_line',
    creatureType: 'beast',
    elements: ['fire', 'earth'],
    prefixes: ['Brave', 'Mighty', 'Ancient', 'Eternal'],
    suffixes: ['Fang', 'Lion', 'Bear', 'Behemoth'],
    stages: [
      { class: 'common', minEvolutionLevel: 10 },
      { class: 'uncommon', minEvolutionLevel: 25 },
      { class: 'rare', minEvolutionLevel: 45 },
      { class: 'epic', minEvolutionLevel: 70 },
    ],
  },
  wyrm_line: {
    speciesKey: 'wyrm_line',
    creatureType: 'dragon',
    elements: ['lightning', 'air'],
    prefixes: ['Young', 'Storm', 'Ancient', 'Elder'],
    suffixes: ['Wyrm', 'Drake', 'Serpent', 'Titan'],
    stages: [
      { class: 'common', minEvolutionLevel: 10 },
      { class: 'uncommon', minEvolutionLevel: 25 },
      { class: 'rare', minEvolutionLevel: 45 },
      { class: 'epic', minEvolutionLevel: 70 },
    ],
  },
  wraith_line: {
    speciesKey: 'wraith_line',
    creatureType: 'undead',
    elements: ['darkness', 'ice'],
    prefixes: ['Shade', 'Wraith', 'Specter', 'Phantom'],
    suffixes: ['Walker', 'Lord', 'Reaper', 'Harbinger'],
    stages: [
      { class: 'common', minEvolutionLevel: 10 },
      { class: 'uncommon', minEvolutionLevel: 25 },
      { class: 'rare', minEvolutionLevel: 45 },
      { class: 'epic', minEvolutionLevel: 70 },
    ],
  },
  golem_line: {
    speciesKey: 'golem_line',
    creatureType: 'construct',
    elements: ['earth', 'iron'],
    prefixes: ['Rusty', 'Iron', 'Fortified', 'Colossal'],
    suffixes: ['Golem', 'Guardian', 'Bastion', 'Monolith'],
    stages: [
      { class: 'common', minEvolutionLevel: 10 },
      { class: 'uncommon', minEvolutionLevel: 25 },
      { class: 'rare', minEvolutionLevel: 45 },
      { class: 'epic', minEvolutionLevel: 70 },
    ],
  },
  spirit_line: {
    speciesKey: 'spirit_line',
    creatureType: 'spirit',
    elements: ['light', 'nature'],
    prefixes: ['Wisp', 'Ethereal', 'Celestial', 'Divine'],
    suffixes: ['Spirit', 'Wyrd', 'Entity', 'Presence'],
    stages: [
      { class: 'common', minEvolutionLevel: 10 },
      { class: 'uncommon', minEvolutionLevel: 25 },
      { class: 'rare', minEvolutionLevel: 45 },
      { class: 'epic', minEvolutionLevel: 70 },
    ],
  },
};