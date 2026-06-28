import { ELEMENTS } from './constants';
import type { Element, CreatureClass, CreatureType, CreatureTemplate } from '../types/game';

export type BaseElement = typeof ELEMENTS[number];

export const FUSION_MATRIX: Record<string, string> = {
  // Same element combinations
  'earth+earth': 'earth',
  'air+air': 'air',
  'fire+fire': 'fire',
  'water+water': 'water',
  'lightning+lightning': 'lightning',
  'iron+iron': 'iron',
  'nature+nature': 'nature',
  'ice+ice': 'ice',
  'light+light': 'light',
  'darkness+darkness': 'darkness',

  // Fire + X
  'air+fire': 'storm',
  'earth+fire': 'magma',
  'lightning+fire': 'plasma',
  'iron+fire': 'scrap',
  'nature+fire': 'wildfire',
  'ice+fire': 'steam',
  'light+fire': 'radiance',
  'water+fire': 'boiling',
  'darkness+fire': 'shadowflame',

  // Water + X
  'air+water': 'mist',
  'earth+water': 'mud',
  'lightning+water': 'storm',
  'iron+water': 'rust',
  'nature+water': 'bloom',
  'ice+water': 'glacier',
  'light+water': 'sanctity',
  'darkness+water': 'abyss',

  // Earth + X
  'air+earth': 'dust',
  'lightning+earth': 'static',
  'iron+earth': 'forge',
  'nature+earth': 'overgrowth',
  'ice+earth': 'frostbite',
  'light+earth': 'crystal',
  'darkness+earth': 'blight',

  // Air + X
  'lightning+air': 'static',
  'iron+air': 'magnet',
  'nature+air': 'spore',
  'ice+air': 'hail',
  'light+air': 'gale',
  'darkness+air': 'voidwind',

  // Lightning + X
  'iron+lightning': 'shock',
  'nature+lightning': 'thunder',
  'ice+lightning': 'frost_storm',
  'light+lightning': 'flash',
  'darkness+lightning': 'void_shock',

  // Iron + X
  'nature+iron': 'golem',
  'ice+iron': 'frost_iron',
  'light+iron': 'holy_alloy',
  'darkness+iron': 'cursed_metal',

  // Nature + X
  'ice+nature': 'tundra',
  'light+nature': 'life',
  'darkness+nature': 'wither',

  // Ice + X
  'darkness+ice': 'frostbite',
  'light+ice': 'aurora',

  // Light + Darkness (special T5.2 rule: 5% Aether, 95% Unstable Void)
  'darkness+light': 'aether',
};

export function getFusionResult(elementA: string, elementB: string, rng?: () => number): string | undefined {
  const key = [elementA.toLowerCase(), elementB.toLowerCase()].sort().join('+');
  const normalizedRng = rng ?? Math.random;

  if (key === 'darkness+light') {
    if (normalizedRng() < 0.05) {
      return 'aether';
    }
    return 'unstable_void';
  }

  return FUSION_MATRIX[key];
}

export function isLightDarknessFusion(elementA: string, elementB: string): boolean {
  const normalizedA = elementA.toLowerCase();
  const normalizedB = elementB.toLowerCase();
  return (normalizedA === 'light' && normalizedB === 'darkness') ||
         (normalizedA === 'darkness' && normalizedB === 'light');
}

export const UNSTABLE_VOID_CREATURE: CreatureTemplate = {
  key: 'unstable_void',
  name: 'Unstable Void Creature',
  class: 'rare' as CreatureClass,
  type: 'demon' as CreatureType,
  elements: ['void' as Element],
  baseHealth: 45,
  baseAttack: 12,
  baseDefense: 8,
  baseSpeed: 7,
  baseMana: 35,
  baseExpValue: 30,
  skills: [{ key: 'void_blast', name: 'Void Blast', element: 'void' as Element, power: 25, cost: 8, description: 'Unleashes unstable void energy' }],
  description: 'An unstable creature born from conflicting celestial forces. Highly volatile and unpredictable.',
  isBoss: false,
};

export function getFusionMatrix(): Record<string, string> {
  return { ...FUSION_MATRIX };
}

export function getAllPairKeys(): string[] {
  return Object.keys(FUSION_MATRIX);
}

export const CREATURE_CLASS_TIERS: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
};

export function calculateFusionRarity(parentAClass: string, parentBClass: string): string {
  const tierA = CREATURE_CLASS_TIERS[parentAClass.toLowerCase()] ?? 0;
  const tierB = CREATURE_CLASS_TIERS[parentBClass.toLowerCase()] ?? 0;

  const weightedAverage = (tierA + tierB) / 2;

  // Cap at legendary tier (4) - mythical not achievable without special conditions
  // Use ceiling to round up fractional averages
  const tier = Math.min(Math.ceil(weightedAverage), 4);

  const resultTiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
  return resultTiers[tier] ?? 'common';
}

export function calculateFusionRarityWithSpecial(
  parentAClass: string,
  parentBClass: string,
  isAncient: boolean,
  isVoid: boolean,
  isStellar: boolean,
  isAether: boolean
): string {
  const baseClass = calculateFusionRarity(parentAClass, parentBClass);
  let tier = CREATURE_CLASS_TIERS[baseClass] ?? 0;

  if (isAncient) tier = Math.max(tier, 3);
  if (isVoid || isStellar) tier = Math.min(5, tier + 1);
  if (isAether) tier = Math.min(5, tier + 1);

  // Without special conditions, cap at legendary (4)
  // With special conditions (isAncient, isVoid, isStellar, isAether), mythical (5) is possible
  const maxTier = (isAncient || isVoid || isStellar || isAether) ? 5 : 4;
  tier = Math.min(tier, maxTier);

  const resultTiers = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'] as const;
  return resultTiers[tier] ?? 'common';
}