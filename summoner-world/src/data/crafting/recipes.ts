import type { CraftingRecipe, InventoryStack } from '../../types/game.ts';

export const BASIC_CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    key: 'basic_wooden_planks',
    name: 'Wooden Planks',
    tier: 'basic',
    inputs: [
      { templateKey: 'wood', quantity: 2 },
    ],
    outputs: [
      { templateKey: 'wooden_plank', quantity: 1, chance: 1 },
    ],
    requirements: {},
    baseDurationSeconds: 30,
    baseSuccessChance: 0.95,
  },
  {
    key: 'basic_stone_bricks',
    name: 'Stone Bricks',
    tier: 'basic',
    inputs: [
      { templateKey: 'stone', quantity: 2 },
    ],
    outputs: [
      { templateKey: 'stone_brick', quantity: 1, chance: 1 },
    ],
    requirements: {},
    baseDurationSeconds: 30,
    baseSuccessChance: 0.95,
  },
  {
    key: 'basic_coin',
    name: 'Simple Coin',
    tier: 'basic',
    inputs: [
      { templateKey: 'ore', quantity: 1 },
    ],
    outputs: [
      { templateKey: 'coin', quantity: 2, chance: 1 },
    ],
    requirements: {},
    baseDurationSeconds: 20,
    baseSuccessChance: 0.95,
  },
];

export const INTERMEDIATE_CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    key: 'intermediate_iron_ingot',
    name: 'Iron Ingot',
    tier: 'intermediate',
    inputs: [
      { templateKey: 'ore', quantity: 3 },
    ],
    outputs: [
      { templateKey: 'iron_ingot', quantity: 1, chance: 1 },
    ],
    requirements: { workshop: true },
    baseDurationSeconds: 90,
    baseSuccessChance: 0.85,
  },
  {
    key: 'intermediate_healing_salve',
    name: 'Healing Salve',
    tier: 'intermediate',
    inputs: [
      { templateKey: 'herbs', quantity: 2 },
    ],
    outputs: [
      { templateKey: 'healing_salve', quantity: 1, chance: 1 },
    ],
    requirements: { workshop: true },
    baseDurationSeconds: 60,
    baseSuccessChance: 0.9,
  },
  {
    key: 'intermediate_mana_vial',
    name: 'Mana Vial',
    tier: 'intermediate',
    inputs: [
      { templateKey: 'herbs', quantity: 1 },
      { templateKey: 'crystal', quantity: 1 },
    ],
    outputs: [
      { templateKey: 'mana_vial', quantity: 1, chance: 1 },
    ],
    requirements: { workshop: true },
    baseDurationSeconds: 75,
    baseSuccessChance: 0.85,
  },
];

export const ADVANCED_CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    key: 'advanced_elemental_catalyst',
    name: 'Elemental Catalyst',
    tier: 'advanced',
    inputs: [
      { templateKey: 'crystal', quantity: 2 },
      { templateKey: 'essence', quantity: 1 },
    ],
    outputs: [
      { templateKey: 'elemental_catalyst', quantity: 1, chance: 1 },
    ],
    requirements: { workshop: true, city: true },
    baseDurationSeconds: 300,
    baseSuccessChance: 0.7,
  },
  {
    key: 'advanced_legendary_ingot',
    name: 'Legendary Ingot',
    tier: 'advanced',
    inputs: [
      { templateKey: 'iron_ingot', quantity: 3 },
      { templateKey: 'essence', quantity: 2 },
    ],
    outputs: [
      { templateKey: 'legendary_ingot', quantity: 1, chance: 0.85 },
    ],
    requirements: { workshop: true, city: true, level: 15 },
    baseDurationSeconds: 360,
    baseSuccessChance: 0.7,
  },
];

export const ARTIFACT_CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    key: 'artifact_forgemasters_crown',
    name: 'Forge Master\'s Crown',
    tier: 'artifact',
    inputs: [
      { templateKey: 'legendary_ingot', quantity: 2 },
      { templateKey: 'elemental_catalyst', quantity: 1 },
      { templateKey: 'essence', quantity: 3 },
    ],
    outputs: [
      { templateKey: 'forgemasters_crown', quantity: 1, chance: 1 },
    ],
    requirements: { workshop: true, city: true, level: 30, worldId: 10 },
    baseDurationSeconds: 900,
    baseSuccessChance: 0.5,
  },
];

export const ALL_CRAFTING_RECIPES: CraftingRecipe[] = [
  ...BASIC_CRAFTING_RECIPES,
  ...INTERMEDIATE_CRAFTING_RECIPES,
  ...ADVANCED_CRAFTING_RECIPES,
  ...ARTIFACT_CRAFTING_RECIPES,
];

export const CRAFTING_RECIPE_MAP: Record<string, CraftingRecipe> = ALL_CRAFTING_RECIPES.reduce((acc, recipe) => {
  acc[recipe.key] = recipe;
  return acc;
}, {} as Record<string, CraftingRecipe>);
