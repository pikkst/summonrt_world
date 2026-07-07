import type { PlayerCoreState } from '../../types/playerCore.ts';
import type { CraftingRecipe, CraftingResult, InventoryStack, CraftingTier, ItemTemplate, Element } from '../../types/game.ts';
import { getElementCraftingSuccessPct } from '../../data/playerElements/index.ts';

export const CRAFTING_TIER_ORDER: Record<CraftingTier, number> = {
  basic: 0,
  intermediate: 1,
  advanced: 2,
  artifact: 3,
};

export const CRAFTING_BASE_DURATION_BY_TIER: Record<CraftingTier, number> = {
  basic: 30,
  intermediate: 90,
  advanced: 300,
  artifact: 900,
};

export const CRAFTING_BASE_SUCCESS_BY_TIER: Record<CraftingTier, number> = {
  basic: 0.95,
  intermediate: 0.85,
  advanced: 0.7,
  artifact: 0.5,
};

export function getCraftingTierOrder(tier: CraftingTier): number {
  return CRAFTING_TIER_ORDER[tier];
}

export function getBaseDurationForTier(tier: CraftingTier): number {
  return CRAFTING_BASE_DURATION_BY_TIER[tier];
}

export function getBaseSuccessChanceForTier(tier: CraftingTier): number {
  return CRAFTING_BASE_SUCCESS_BY_TIER[tier];
}

export function hasWorkshopFree(): boolean {
  return true;
}

export function hasWorkshop(playerCore: PlayerCoreState): boolean {
  return (playerCore.housing.structureLevel ?? 0) >= 1;
}

export function isInCity(playerCore: PlayerCoreState): boolean {
  return playerCore.position.worldId >= 15;
}

export function checkRecipeRequirements(
  recipe: CraftingRecipe,
  playerCore: PlayerCoreState,
  element?: Element
): { allowed: boolean; reason?: string } {
  if (recipe.requirements?.workshop && !hasWorkshop(playerCore)) {
    return { allowed: false, reason: 'Workshop required' };
  }
  if (recipe.requirements?.city && !isInCity(playerCore)) {
    return { allowed: false, reason: 'City-level infrastructure required' };
  }
  if (typeof recipe.requirements?.worldId === 'number' && playerCore.position.worldId < recipe.requirements.worldId) {
    return { allowed: false, reason: `Requires world ${recipe.requirements.worldId}` };
  }
  if (typeof recipe.requirements?.level === 'number' && playerCore.level < recipe.requirements.level) {
    return { allowed: false, reason: `Requires level ${recipe.requirements.level}` };
  }
  return { allowed: true };
}

export function calculateCraftingSuccessChance(
  recipe: CraftingRecipe,
  playerCore: PlayerCoreState,
  element?: Element
): number {
  let chance = recipe.baseSuccessChance;

  const efficiency = playerCore.secondaryStats.craftingEfficiency;
  chance += efficiency * 0.0005;
  if (chance > 0.98) chance = 0.98;

  if (element) {
    chance += getElementCraftingSuccessPct(element) / 100;
  }

  if (recipe.tier === 'artifact') {
    chance -= 0.05;
  }

  return Math.max(0.01, Math.min(0.99, chance));
}

export function calculateCraftingDurationSeconds(
  recipe: CraftingRecipe,
  playerCore: PlayerCoreState
): number {
  const base = recipe.baseDurationSeconds;
  const efficiency = playerCore.secondaryStats.craftingEfficiency;
  const reduction = Math.max(0, (efficiency - 100) / 100);
  return Math.max(5, Math.floor(base * (1 - reduction)));
}

export function hasMaterials(inventory: InventoryStack[], inputs: Array<{ templateKey: string; quantity: number }>): boolean {
  for (const input of inputs) {
    const available = inventory
      .filter((item) => item.templateKey === input.templateKey)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (available < input.quantity) {
      return false;
    }
  }
  return true;
}

export function getMissingMaterials(
  inventory: InventoryStack[],
  inputs: Array<{ templateKey: string; quantity: number }>
): Array<{ templateKey: string; quantity: number; missing: number }> {
  const missing: Array<{ templateKey: string; quantity: number; missing: number }> = [];
  for (const input of inputs) {
    const available = inventory
      .filter((item) => item.templateKey === input.templateKey)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (available < input.quantity) {
      missing.push({ templateKey: input.templateKey, quantity: input.quantity, missing: input.quantity - available });
    }
  }
  return missing;
}

export function consumeMaterials(
  inventory: InventoryStack[],
  inputs: Array<{ templateKey: string; quantity: number }>
): { inventory: InventoryStack[]; consumed: boolean } {
  if (!hasMaterials(inventory, inputs)) {
    return { inventory, consumed: false };
  }

  const updated = [...inventory];
  for (const input of inputs) {
    let remaining = input.quantity;
    for (let i = 0; i < updated.length && remaining > 0; i++) {
      if (updated[i]!.templateKey === input.templateKey) {
        if (updated[i]!.quantity <= remaining) {
          remaining -= updated[i]!.quantity;
          updated.splice(i, 1);
          i--;
        } else {
          updated[i] = { ...updated[i]!, quantity: updated[i]!.quantity - remaining };
          remaining = 0;
        }
      }
    }
  }
  return { inventory: updated, consumed: true };
}

export function rollCraftingOutputs(
  recipe: CraftingRecipe,
  success: boolean
): InventoryStack[] {
  const outputs: InventoryStack[] = [];

  for (const output of recipe.outputs) {
    const chance = output.chance ?? 1;
    if (success && chance >= 1) {
      outputs.push({ templateKey: output.templateKey, quantity: output.quantity });
    } else if (chance > 0 && chance < 1) {
      if (Math.random() < chance) {
        outputs.push({ templateKey: output.templateKey, quantity: output.quantity });
      }
    }
  }

  return outputs;
}

export function resolveCraftingResult(
  inventory: InventoryStack[],
  recipe: CraftingRecipe,
  playerCore: PlayerCoreState,
  element?: Element
): { success: boolean; inputsConsumed: boolean; outputs: InventoryStack[]; timeSeconds: number; log: string[] } {
  const logs: string[] = [];

  const requirements = checkRecipeRequirements(recipe, playerCore, element);
  if (!requirements.allowed) {
    return { success: false, inputsConsumed: false, outputs: [], timeSeconds: 0, log: [`Crafting blocked: ${requirements.reason}`] };
  }

  if (!hasMaterials(inventory, recipe.inputs)) {
    return { success: false, inputsConsumed: false, outputs: [], timeSeconds: 0, log: ['Insufficient materials'] };
  }

  const consumed = consumeMaterials(inventory, recipe.inputs);
  if (!consumed.consumed) {
    return { success: false, inputsConsumed: false, outputs: [], timeSeconds: 0, log: ['Failed to consume materials'] };
  }

  const chance = calculateCraftingSuccessChance(recipe, playerCore, element);
  const success = Math.random() < chance;
  const timeSeconds = calculateCraftingDurationSeconds(recipe, playerCore);

  if (success) {
    logs.push(`Crafted ${recipe.name} successfully.`);
  } else {
    logs.push(`Failed to craft ${recipe.name}.`);
  }

  const outputs = rollCraftingOutputs(recipe, success);

  return {
    success,
    inputsConsumed: true,
    outputs,
    timeSeconds,
    log: logs,
  };
}

