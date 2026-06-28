import { ELEMENTS } from './constants';

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

  // Light + Darkness (basis for T5.2 special chance)
  'light+darkness': 'aether',
};

export function getFusionResult(elementA: string, elementB: string): string | undefined {
  const key = [elementA.toLowerCase(), elementB.toLowerCase()].sort().join('+');
  return FUSION_MATRIX[key];
}

export function getFusionMatrix(): Record<string, string> {
  return { ...FUSION_MATRIX };
}

export function getAllPairKeys(): string[] {
  return Object.keys(FUSION_MATRIX);
}
