import type { GameStore, SetState } from '../types.ts';
import type { CraftingRecipe, Element } from '../../../types/game.ts';
import { addItemToInventory } from '../../../core/playerCore/inventoryCore';
import { ALL_CRAFTING_RECIPES } from '../../../data/crafting/recipes';
import { checkRecipeRequirements, calculateCraftingSuccessChance, calculateCraftingDurationSeconds, resolveCraftingResult, hasMaterials, getMissingMaterials } from '../../../core/playerCore/craftingCore';
import { getItemTemplate } from '../../../data/crafting/itemTemplates';
import { applyPlayerStatisticEvent } from '../../../core/playerCore/playerStatisticsTracking';
import { refreshTitleAchievementState } from '../../../core/playerCore/titleAchievementCore';
import { economyEventBus } from '../../../core/economy/economyEventBus';

export interface CraftingUIState {
  selectedRecipeKey: string | null;
  preview: {
    canCraft: boolean;
    missingMaterials: Array<{ templateKey: string; quantity: number; missing: number }>;
    successChance: number;
    durationSeconds: number;
    reason?: string;
  } | null;
}

const makeDefaultCraftingState = (): CraftingUIState => ({
  selectedRecipeKey: null,
  preview: null,
});

export const craftingActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  selectRecipe: (recipeKey: string | null) => {
    set((state: any) => ({
      crafting: {
        ...(state.crafting ?? makeDefaultCraftingState()),
        selectedRecipeKey: recipeKey,
        preview: null,
      },
    }));
  },

  previewRecipe: (recipeKey: string) => {
    const state = get();
    const playerCore = state.playerCore;
    if (!playerCore) return;

    const recipe = getCraftingRecipe(recipeKey);
    if (!recipe) {
      set((state: any) => ({
        crafting: {
          ...(state.crafting ?? makeDefaultCraftingState()),
          selectedRecipeKey: recipeKey,
          preview: { canCraft: false, missingMaterials: [], successChance: 0, durationSeconds: 0, reason: 'Unknown recipe' },
        },
      }));
      return;
    }

    const requirements = checkRecipeRequirements(recipe, playerCore);
    const element = (playerCore.elements as any)?.primary as Element | undefined;
    const successChance = calculateCraftingSuccessChance(recipe, playerCore, element);
    const duration = calculateCraftingDurationSeconds(recipe, playerCore);

    let canCraft = requirements.allowed && hasMaterials(playerCore.inventory, recipe.inputs);
    const missingMaterials = canCraft ? [] : getMissingMaterials(playerCore.inventory, recipe.inputs);

    if (!requirements.allowed) {
      canCraft = false;
    }

    set((state: any) => ({
      crafting: {
        ...(state.crafting ?? makeDefaultCraftingState()),
        selectedRecipeKey: recipeKey,
        preview: { canCraft, missingMaterials, successChance, durationSeconds: duration, reason: requirements.reason },
      },
    }));
  },

  craftItem: (recipeKey: string) => {
    const { playerCore, appendLog } = get();
    if (!playerCore) return;

    const recipe = getCraftingRecipe(recipeKey);
    if (!recipe) return;

    const requirements = checkRecipeRequirements(recipe, playerCore);
    if (!requirements.allowed) {
      appendLog(requirements.reason ?? 'Cannot craft this item.', 'warning');
      return;
    }

    const element = (playerCore.elements as any)?.primary as Element | undefined;
    const result = resolveCraftingResult(playerCore.inventory, recipe, playerCore, element);

    if (!result.inputsConsumed) {
      for (const line of result.log) {
        appendLog(line, 'warning');
      }
      return;
    }

    let updatedInventory = playerCore.inventory;
    for (const output of result.outputs) {
      const templateKey = output.templateKey;
      const template = getItemTemplate(templateKey);
      const addResult = addItemToInventory(updatedInventory as any, output, template ?? {
        key: templateKey,
        name: templateKey,
        type: 'material',
        rarity: 0,
        stackable: true,
        maxStack: 99,
        description: '',
      }, 'tradeable', playerCore.identity.id);
      if (!addResult.added) {
        appendLog('Inventory full. Could not add crafted item.', 'warning');
        continue;
      }
      updatedInventory = addResult.inventory;
    }

    const updatedStatistics = applyPlayerStatisticEvent(playerCore.statistics, { type: 'ItemCrafted', count: 1 });
    const updatedPlayerCore = refreshTitleAchievementState({
      ...playerCore,
      inventory: updatedInventory,
      statistics: updatedStatistics,
    }, Date.now());

    economyEventBus.publish({
      type: 'ItemCrafted',
      playerId: playerCore.identity.id,
      recipeKey: recipe.key,
      itemKeys: result.outputs.map((o) => o.templateKey),
      success: result.success,
      gameTimeMinutes: playerCore.gameTimeMinutes,
      turnCount: get().turnCount,
    });

    set((state: any) => ({
      playerCore: updatedPlayerCore,
      crafting: {
        ...(state.crafting ?? makeDefaultCraftingState()),
        selectedRecipeKey: null,
        preview: null,
      },
    }));

    for (const line of result.log) {
      appendLog(line, result.success ? 'success' : 'warning');
    }
  },
});

export function getCraftingRecipe(recipeKey: string): CraftingRecipe | undefined {
  return ALL_CRAFTING_RECIPES.find((recipe) => recipe.key === recipeKey);
}

