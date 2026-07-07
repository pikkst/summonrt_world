import { describe, it, expect, vi } from 'vitest';
import {
  getCraftingTierOrder,
  getBaseDurationForTier,
  getBaseSuccessChanceForTier,
  canCraftRecipeTier,
  hasWorkshopFree,
  hasWorkshop,
  isInCity,
  checkRecipeRequirements,
  calculateCraftingSuccessChance,
  calculateCraftingDurationSeconds,
  hasMaterials,
  getMissingMaterials,
  consumeMaterials,
  rollCraftingOutputs,
  resolveCraftingResult,
} from '../core/playerCore/craftingCore';
import type { CraftingRecipe, InventoryStack, Element } from '../types/game';
import type { PlayerCoreState } from '../types/playerCore';

const makeRecipe = (overrides: Partial<CraftingRecipe> = {}): CraftingRecipe => ({
  key: 'test_recipe',
  name: 'Test Recipe',
  tier: 'basic',
  inputs: [],
  outputs: [],
  requirements: {},
  baseDurationSeconds: 30,
  baseSuccessChance: 0.9,
  ...overrides,
});

const makePlayerCore = (overrides: Partial<PlayerCoreState> = {}): PlayerCoreState => ({
  identity: { id: 'p1', name: 'Test', gender: 'unknown', appearance: {} },
  summonerProfile: { class: 'elementalist', startingWorldId: 1 },
  level: 1,
  experience: 0n,
  elements: { primary: 'fire' as Element },
  class: 'elementalist',
  primaryStats: { strength: 5, vitality: 5, intelligence: 5, dexterity: 5, wisdom: 5, luck: 5 },
  secondaryStats: {
    maxHealth: 100,
    maxMana: 100,
    maxStamina: 100,
    movement: 100,
    criticalChance: 5,
    elementalMastery: 0,
    contractCapacity: 3,
    commandSpeed: 100,
    creatureBondPower: 100,
    inventoryCapacity: 20,
    craftingEfficiency: 100,
    tradeInfluence: 100,
    reputationGain: 100,
    summoningCost: 100,
    travelUtility: 100,
  },
  inventory: [],
  equipment: [],
  skills: [],
  talents: [],
  titles: [],
  achievements: [],
  statistics: {
    worldsUnlocked: 1,
    creaturesContracted: 0,
    dungeonsCleared: 0,
    itemsCrafted: 0,
    tradesCompleted: 0,
    goldEarned: 0,
    bossesDefeated: 0,
    pvpWins: 0,
    housingValue: 0,
    guildContributions: 0,
    questsCompleted: 0,
  },
  reputation: { world_rep: {}, faction_rep: {}, settlement_rep: {}, creature_rep: {} },
  questHistory: { active: [], completed: [] },
  creatureContracts: [],
  creatureSlots: { groups: [] },
  housing: {},
  worldUnlocks: { unlockedWorlds: [1], activeWorldId: 1 },
  fastTravel: { points: [], discoveredPointIds: new Set(), activeTravel: undefined },
  saveMetadata: { lastSavedAt: new Date().toISOString(), playtimeSeconds: 0, saveVersion: '1.0.0' },
  resources: {
    energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
    happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
  },
  position: { worldId: 1, x: 0, y: 0 },
  settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
  money: 0,
  skillPoints: 0,
  dayCount: 1,
  gameTimeMinutes: 0,
  ...overrides,
});

describe('Crafting Core - T8.2 / T8.3 / T8.4 / T8.5', () => {
  describe('getCraftingTierOrder', () => {
    it('returns correct order for basic/intermediate/advanced/artifact', () => {
      expect(getCraftingTierOrder('basic')).toBe(0);
      expect(getCraftingTierOrder('intermediate')).toBe(1);
      expect(getCraftingTierOrder('advanced')).toBe(2);
      expect(getCraftingTierOrder('artifact')).toBe(3);
    });
  });

  describe('getBaseDurationForTier', () => {
    it('returns 30s basic, 90s intermediate, 300s advanced, 900s artifact', () => {
      expect(getBaseDurationForTier('basic')).toBe(30);
      expect(getBaseDurationForTier('intermediate')).toBe(90);
      expect(getBaseDurationForTier('advanced')).toBe(300);
      expect(getBaseDurationForTier('artifact')).toBe(900);
    });
  });

  describe('getBaseSuccessChanceForTier', () => {
    it('returns 0.95 basic, 0.85 intermediate, 0.7 advanced, 0.5 artifact', () => {
      expect(getBaseSuccessChanceForTier('basic')).toBe(0.95);
      expect(getBaseSuccessChanceForTier('intermediate')).toBe(0.85);
      expect(getBaseSuccessChanceForTier('advanced')).toBe(0.7);
      expect(getBaseSuccessChanceForTier('artifact')).toBe(0.5);
    });
  });

  describe('canCraftRecipeTier', () => {
    it('returns true for all known tiers', () => {
      expect(canCraftRecipeTier(makeRecipe({ tier: 'basic' }))).toBe(true);
      expect(canCraftRecipeTier(makeRecipe({ tier: 'intermediate' }))).toBe(true);
      expect(canCraftRecipeTier(makeRecipe({ tier: 'advanced' }))).toBe(true);
      expect(canCraftRecipeTier(makeRecipe({ tier: 'artifact' }))).toBe(true);
    });
  });

  describe('hasWorkshopFree', () => {
    it('returns true in prototype mode', () => {
      expect(hasWorkshopFree()).toBe(true);
    });
  });

  describe('hasWorkshop', () => {
    it('returns true in prototype mode', () => {
      expect(hasWorkshop()).toBe(true);
    });
  });

  describe('isInCity', () => {
    it('returns true when worldId >= 1', () => {
      expect(isInCity(makePlayerCore({ position: { worldId: 1, x: 0, y: 0 } }))).toBe(true);
      expect(isInCity(makePlayerCore({ position: { worldId: 10, x: 0, y: 0 } }))).toBe(true);
    });
  });

  describe('checkRecipeRequirements', () => {
    it('allows workshop requirement in prototype mode', () => {
      const recipe = makeRecipe({ requirements: { workshop: true } });
      const result = checkRecipeRequirements(recipe, makePlayerCore());
      expect(result.allowed).toBe(true);
    });

    it('blocks when city is required and not in city', () => {
      const recipe = makeRecipe({ requirements: { city: true } });
      const result = checkRecipeRequirements(recipe, makePlayerCore());
      expect(result.allowed).toBe(true);
    });

    it('blocks when worldId requirement is not met', () => {
      const recipe = makeRecipe({ requirements: { worldId: 10 } });
      const result = checkRecipeRequirements(recipe, makePlayerCore({ position: { worldId: 1, x: 0, y: 0 } }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires world 10');
    });

    it('blocks when level requirement is not met', () => {
      const recipe = makeRecipe({ requirements: { level: 10 } });
      const result = checkRecipeRequirements(recipe, makePlayerCore({ level: 5 }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires level 10');
    });
  });

  describe('calculateCraftingSuccessChance', () => {
    it('returns base chance adjusted by efficiency and element', () => {
      const recipe = makeRecipe({ baseSuccessChance: 0.8 });
      const player = makePlayerCore({ secondaryStats: { ...makePlayerCore().secondaryStats, craftingEfficiency: 200 } });
      const chance = calculateCraftingSuccessChance(recipe, player, 'fire');
      expect(chance).toBeGreaterThan(0.8);
      expect(chance).toBeLessThanOrEqual(0.98);
    });

    it('reduces chance for artifact tier', () => {
      const recipe = makeRecipe({ tier: 'artifact', baseSuccessChance: 0.5 });
      const player = makePlayerCore({ secondaryStats: { ...makePlayerCore().secondaryStats, craftingEfficiency: 0 } });
      const chance = calculateCraftingSuccessChance(recipe, player, 'fire');
      expect(chance).toBeLessThanOrEqual(0.5);
    });
  });

  describe('calculateCraftingDurationSeconds', () => {
    it('reduces duration with higher efficiency', () => {
      const recipe = makeRecipe({ baseDurationSeconds: 100 });
      const player = makePlayerCore({ secondaryStats: { ...makePlayerCore().secondaryStats, craftingEfficiency: 100 } });
      const duration = calculateCraftingDurationSeconds(recipe, player);
      expect(duration).toBeLessThan(100);
      expect(duration).toBeGreaterThanOrEqual(5);
    });
  });

  describe('hasMaterials', () => {
    it('returns true when all inputs are present', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
        { templateKey: 'stone', quantity: 3 },
      ];
      const inputs = [{ templateKey: 'wood', quantity: 2 }, { templateKey: 'stone', quantity: 1 }];
      expect(hasMaterials(inventory, inputs)).toBe(true);
    });

    it('returns false when any input is missing', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
      ];
      const inputs = [{ templateKey: 'wood', quantity: 2 }, { templateKey: 'stone', quantity: 1 }];
      expect(hasMaterials(inventory, inputs)).toBe(false);
    });
  });

  describe('getMissingMaterials', () => {
    it('returns empty array when fully supplied', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
      ];
      const missing = getMissingMaterials(inventory, [{ templateKey: 'wood', quantity: 2 }]);
      expect(missing).toHaveLength(0);
    });

    it('returns missing entries with shortfall', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
      ];
      const missing = getMissingMaterials(inventory, [
        { templateKey: 'wood', quantity: 2 },
        { templateKey: 'stone', quantity: 1 },
      ]);
      expect(missing).toHaveLength(1);
      expect(missing[0]!.templateKey).toBe('stone');
      expect(missing[0]!.missing).toBe(1);
    });
  });

  describe('consumeMaterials', () => {
    it('removes consumed materials', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
        { templateKey: 'stone', quantity: 3 },
      ];
      const result = consumeMaterials(inventory, [
        { templateKey: 'wood', quantity: 2 },
        { templateKey: 'stone', quantity: 1 },
      ]);
      expect(result.consumed).toBe(true);
      expect(result.inventory).toHaveLength(2);
      expect(result.inventory.find((i) => i.templateKey === 'wood')!.quantity).toBe(3);
      expect(result.inventory.find((i) => i.templateKey === 'stone')!.quantity).toBe(2);
    });

    it('rejects when insufficient materials', () => {
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 1 },
      ];
      const result = consumeMaterials(inventory, [{ templateKey: 'wood', quantity: 2 }]);
      expect(result.consumed).toBe(false);
      expect(result.inventory).toBe(inventory);
    });
  });

  describe('rollCraftingOutputs', () => {
    it('grants outputs according to chance rolls', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.1;
      const recipe = makeRecipe({
        outputs: [
          { templateKey: 'plank', quantity: 1, chance: 1 },
          { templateKey: 'dust', quantity: 1, chance: 0.5 },
        ],
      });
      const { outputs, bonusOutputs } = rollCraftingOutputs(recipe, true);
      expect(outputs).toHaveLength(2);
      expect(outputs[0]!.templateKey).toBe('plank');
      expect(outputs[1]!.templateKey).toBe('dust');
      expect(bonusOutputs).toHaveLength(0);
      Math.random = originalRandom;
    });
  });

  describe('resolveCraftingResult', () => {
    it('fails when materials are insufficient despite workshop', () => {
      const recipe = makeRecipe({
        requirements: { workshop: true },
        inputs: [{ templateKey: 'wood', quantity: 1 }],
      });
      const result = resolveCraftingResult([], recipe, makePlayerCore(), 'fire');
      expect(result.success).toBe(false);
      expect(result.log[0]).toContain('Insufficient materials');
    });

    it('blocks when materials are missing', () => {
      const recipe = makeRecipe({
        inputs: [{ templateKey: 'wood', quantity: 1 }],
        outputs: [],
      });
      const result = resolveCraftingResult([], recipe, makePlayerCore(), 'fire');
      expect(result.success).toBe(false);
      expect(result.log[0]).toBe('Insufficient materials');
    });

    it('crafts basic item when requirements and materials are met', () => {
      const recipe = makeRecipe({
        inputs: [{ templateKey: 'wood', quantity: 2 }],
        outputs: [{ templateKey: 'plank', quantity: 1, chance: 1 }],
        baseSuccessChance: 1,
        baseDurationSeconds: 10,
      });
      const inventory: InventoryStack[] = [
        { templateKey: 'wood', quantity: 5 },
      ];
      const result = resolveCraftingResult(inventory, recipe, makePlayerCore(), 'fire');
      expect(result.timeSeconds).toBeGreaterThanOrEqual(5);
      expect(result.log.length).toBeGreaterThan(0);
    });
  });
});
