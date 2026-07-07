import type { BiomeType } from './game';

export type StructureType = 'house' | 'farm' | 'workshop' | 'manor' | 'castle' | 'town';

export type TownHallPolicyType = 'trade_tariff' | 'creature_protection' | 'festival_bonus';

export interface TownHallPolicy {
  type: TownHallPolicyType;
  active: boolean;
}

export interface TownHallUpgradeLevel {
  level: number;
  cost: number;
  passiveIncomeBonus: number;
  unlockedPolicies: TownHallPolicyType[];
}

export interface TownHallPolicyDefinition {
  name: string;
  description: string;
}

export const TOWN_HALL_POLICY_INFO: Record<TownHallPolicyType, TownHallPolicyDefinition> = {
  trade_tariff: { name: 'Trade Tariff', description: 'Reduces merchant trade costs by 10%' },
  creature_protection: { name: 'Creature Protection', description: 'Reduces territorial hostility duration and increases capture chance' },
  festival_bonus: { name: 'Festival Bonus', description: 'Increases housing income by 15%' },
};

export const TOWN_HALL_UPGRADE_TABLE: TownHallUpgradeLevel[] = [
  { level: 1, cost: 0, passiveIncomeBonus: 0, unlockedPolicies: [] },
  { level: 2, cost: 20000, passiveIncomeBonus: 10, unlockedPolicies: [] },
  { level: 3, cost: 50000, passiveIncomeBonus: 20, unlockedPolicies: ['trade_tariff'] },
  { level: 4, cost: 100000, passiveIncomeBonus: 35, unlockedPolicies: ['creature_protection'] },
  { level: 5, cost: 200000, passiveIncomeBonus: 50, unlockedPolicies: ['festival_bonus'] },
];

export function getTownHallUpgradeLevel(level: number): TownHallUpgradeLevel | undefined {
  return TOWN_HALL_UPGRADE_TABLE.find((u) => u.level === level);
}

export function getTownHallUpgradeCost(currentLevel: number): number {
  const next = getTownHallUpgradeLevel(currentLevel + 1);
  return next ? next.cost : 0;
}

export function getUnlockedPolicyTypes(level: number): TownHallPolicyType[] {
  const unlocked: TownHallPolicyType[] = [];
  for (const entry of TOWN_HALL_UPGRADE_TABLE) {
    if (entry.level <= level) {
      for (const policy of entry.unlockedPolicies) {
        if (!unlocked.includes(policy)) {
          unlocked.push(policy);
        }
      }
    }
  }
  return unlocked;
}

export function getTownHallPassiveIncomeBonus(level: number): number {
  const entry = getTownHallUpgradeLevel(level);
  return entry ? entry.passiveIncomeBonus : 0;
}

export function getTownHallPolicyMultiplier(policyType: TownHallPolicyType): number {
  switch (policyType) {
    case 'trade_tariff':
      return -10;
    case 'creature_protection':
      return 5;
    case 'festival_bonus':
      return 15;
    default:
      return 0;
  }
}

export function getActiveTownHallPolicies(policies: TownHallPolicy[] | undefined): TownHallPolicy[] {
  if (!policies || policies.length === 0) return [];
  return policies.filter((p) => p.active);
}

export function getTownHallPolicyEffect(policyType: TownHallPolicyType): { bonusPct: number; category: string } {
  switch (policyType) {
    case 'trade_tariff':
      return { bonusPct: -10, category: 'trade_cost' };
    case 'creature_protection':
      return { bonusPct: 5, category: 'creature_capture' };
    case 'festival_bonus':
      return { bonusPct: 15, category: 'passive_income' };
    default:
      return { bonusPct: 0, category: '' };
  }
}

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
  passiveIncomeRate: number;
  refinementTable: Array<{ templateKey: string; chance: number; quantity: number }>;
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
    passiveIncomeRate: 1,
    refinementTable: [],
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
    passiveIncomeRate: 2,
    refinementTable: [
      { templateKey: 'basic_food', chance: 0.1, quantity: 1 },
    ],
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
    passiveIncomeRate: 3,
    refinementTable: [
      { templateKey: 'wooden_plank', chance: 0.08, quantity: 1 },
      { templateKey: 'stone_brick', chance: 0.05, quantity: 1 },
      { templateKey: 'iron_ingot', chance: 0.03, quantity: 1 },
    ],
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
    passiveIncomeRate: 8,
    refinementTable: [
      { templateKey: 'healing_salve', chance: 0.05, quantity: 1 },
    ],
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
    passiveIncomeRate: 15,
    refinementTable: [
      { templateKey: 'mana_vial', chance: 0.04, quantity: 1 },
    ],
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
    passiveIncomeRate: 30,
    refinementTable: [
      { templateKey: 'elemental_catalyst', chance: 0.03, quantity: 1 },
    ],
  },
};

export function getStructureDefinition(type: StructureType): StructureDefinition {
  return STRUCTURE_DEFINITIONS[type];
}

export function isValidStructureType(type: string): type is StructureType {
  return type in STRUCTURE_DEFINITIONS;
}
