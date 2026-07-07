import type { PlayerCoreState } from '../../types/playerCore.ts';
import type { Structure, StructureType } from '../../types/structure.ts';
import { STRUCTURE_DEFINITIONS, getActiveTownHallPolicies, getTownHallPassiveIncomeBonus, getTownHallPolicyMultiplier } from '../../types/structure.ts';
import { addItemToInventory } from './inventoryCore.ts';
import type { InventoryStack, ItemTemplate } from '../../types/game.ts';
import type { TownHallPolicy } from '../../types/structure.ts';

export function calculateHousingPassiveIncome(structures: Structure[]): number {
  return structures.reduce((total, structure) => {
    const definition = STRUCTURE_DEFINITIONS[structure.type];
    return total + definition.passiveIncomeRate;
  }, 0);
}

export function calculateTownHallIncomeBonus(playerCore: PlayerCoreState): number {
  const townHallLevel = playerCore.housing.structures
    .filter((s) => s.type === 'town')
    .reduce((max, s) => Math.max(max, s.level), 0);
  return getTownHallPassiveIncomeBonus(townHallLevel);
}

export function calculateActivePolicyMultipliers(policies: TownHallPolicy[] | undefined): number {
  const activePolicies = getActiveTownHallPolicies(policies);
  let incomeMultiplier = 1;

  for (const policy of activePolicies) {
    if (policy.type === 'festival_bonus') {
      incomeMultiplier += getTownHallPolicyMultiplier('festival_bonus') / 100;
    }
  }

  return incomeMultiplier;
}

export function calculateResourceRefinement(
  structures: Structure[],
  rng: () => number = Math.random
): Array<{ templateKey: string; quantity: number }> {
  const results: Array<{ templateKey: string; quantity: number }> = [];

  for (const structure of structures) {
    const definition = STRUCTURE_DEFINITIONS[structure.type];
    for (const refinement of definition.refinementTable) {
      if (rng() < refinement.chance) {
        results.push({
          templateKey: refinement.templateKey,
          quantity: refinement.quantity,
        });
      }
    }
  }

  return results;
}

export function processHousingEconomyTick(
  playerCore: PlayerCoreState,
  rng: () => number = Math.random
): PlayerCoreState {
  const structures = playerCore.housing.structures;
  if (structures.length === 0) return playerCore;

  const basePassiveIncome = calculateHousingPassiveIncome(structures);
  const townHallBonus = calculateTownHallIncomeBonus(playerCore);
  const policyMultiplier = calculateActivePolicyMultipliers(playerCore.housing.townHallPolicies);

  const totalPassiveIncome = Math.floor((basePassiveIncome + townHallBonus) * policyMultiplier);
  const refinedResources = calculateResourceRefinement(structures, rng);

  let updatedInventory = playerCore.inventory;
  for (const resource of refinedResources) {
    const template: ItemTemplate = {
      key: resource.templateKey,
      name: resource.templateKey,
      type: 'material',
      rarity: 0,
      stackable: true,
      maxStack: 99,
      description: '',
    };
    const result = addItemToInventory(
      updatedInventory as any,
      { templateKey: resource.templateKey, quantity: resource.quantity } as InventoryStack,
      template,
      'tradeable',
      playerCore.identity.id
    );
    updatedInventory = result.inventory;
  }

  return {
    ...playerCore,
    money: playerCore.money + totalPassiveIncome,
    inventory: updatedInventory,
  };
}
