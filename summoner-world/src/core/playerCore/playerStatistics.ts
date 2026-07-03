import type { PlayerPrimaryStats, PlayerSecondaryStats, SummonerClass } from '../../types/playerCore.ts';
import type { EquipmentSlot } from '../../types/playerCore.ts';

const BASE_PRIMARY_STATS: PlayerPrimaryStats = {
  strength: 10,
  vitality: 10,
  intelligence: 10,
  dexterity: 10,
  wisdom: 10,
  luck: 10,
};

export const CLASS_PRIMARY_MODIFIERS: Record<SummonerClass, Partial<PlayerPrimaryStats>> = {
  beast_binder: { strength: 2, dexterity: 1, luck: 1 },
  elementalist: { intelligence: 2, wisdom: 1, dexterity: 1 },
  warden: { vitality: 2, strength: 1 },
  ritualist: { intelligence: 2, wisdom: 2 },
  tactician: { dexterity: 2, intelligence: 1 },
  alchemist: { intelligence: 2, dexterity: 1, wisdom: 1 },
  pathfinder: { dexterity: 2, vitality: 1 },
  duelist: { strength: 2, dexterity: 1 },
};

function addStat(
  base: number,
  classMod: number | undefined,
  levelBonus: number
): number {
  return Math.floor(base + (classMod || 0) + levelBonus);
}

export function calculatePrimaryStats(
  classId: SummonerClass,
  level: number
): PlayerPrimaryStats {
  const classMods = CLASS_PRIMARY_MODIFIERS[classId] || {};
  const levelBonus = (level - 1) * 0.05;

  return {
    strength: addStat(BASE_PRIMARY_STATS.strength, classMods.strength, levelBonus),
    vitality: addStat(BASE_PRIMARY_STATS.vitality, classMods.vitality, levelBonus),
    intelligence: addStat(BASE_PRIMARY_STATS.intelligence, classMods.intelligence, levelBonus),
    dexterity: addStat(BASE_PRIMARY_STATS.dexterity, classMods.dexterity, levelBonus),
    wisdom: addStat(BASE_PRIMARY_STATS.wisdom, classMods.wisdom, levelBonus),
    luck: addStat(BASE_PRIMARY_STATS.luck, classMods.luck, levelBonus),
  };
}

export function calculateSecondaryStats(
  primaryStats: PlayerPrimaryStats,
  equipment: EquipmentSlot[]
): PlayerSecondaryStats {
  const equipmentMods = equipment.reduce(
    (acc, slot) => {
      if (slot.modifiers) {
        acc.healthBonus += slot.modifiers.maxHealth || 0;
        acc.manaBonus += slot.modifiers.maxMana || 0;
        acc.movementBonus += slot.modifiers.movement || 0;
        acc.critChanceBonus += slot.modifiers.criticalChance || 0;
        acc.elementalMasteryBonus += slot.modifiers.elementalMastery || 0;
        acc.contractCapacityBonus += slot.modifiers.contractCapacity || 0;
        acc.commandSpeedBonus += slot.modifiers.commandSpeed || 0;
        acc.creatureBondBonus += slot.modifiers.creatureBondPower || 0;
        acc.inventoryBonus += slot.modifiers.inventoryCapacity || 0;
        acc.craftingBonus += slot.modifiers.craftingEfficiency || 0;
        acc.tradeBonus += slot.modifiers.tradeInfluence || 0;
        acc.reputationBonus += slot.modifiers.reputationGain || 0;
        acc.summoningCostBonus += slot.modifiers.summoningCost || 0;
        acc.travelUtilityBonus += slot.modifiers.travelUtility || 0;
      }
      return acc;
    },
    {
      healthBonus: 0,
      manaBonus: 0,
      movementBonus: 0,
      critChanceBonus: 0,
      elementalMasteryBonus: 0,
      contractCapacityBonus: 0,
      commandSpeedBonus: 0,
      creatureBondBonus: 0,
      inventoryBonus: 0,
      craftingBonus: 0,
      tradeBonus: 0,
      reputationBonus: 0,
      summoningCostBonus: 0,
      travelUtilityBonus: 0,
    }
  );

  return {
    maxHealth: 100 + (primaryStats.vitality * 5) + equipmentMods.healthBonus,
    maxMana: 50 + (primaryStats.intelligence * 3) + equipmentMods.manaBonus,
    maxStamina: 100 + (primaryStats.strength * 2) + (primaryStats.vitality * 2),
    movement: 5 + (primaryStats.dexterity * 0.1) + equipmentMods.movementBonus,
    criticalChance: 5 + (primaryStats.luck * 0.2) + equipmentMods.critChanceBonus,
    elementalMastery: 10 + (primaryStats.intelligence * 0.5) + (primaryStats.wisdom * 0.3) + equipmentMods.elementalMasteryBonus,
    contractCapacity: 5 + Math.floor(primaryStats.wisdom * 0.2) + equipmentMods.contractCapacityBonus,
    commandSpeed: 100 + (primaryStats.dexterity * 2) + equipmentMods.commandSpeedBonus,
    creatureBondPower: 100 + (primaryStats.intelligence * 1.5) + (primaryStats.luck * 0.5) + equipmentMods.creatureBondBonus,
    inventoryCapacity: 20 + (primaryStats.strength * 0.5) + equipmentMods.inventoryBonus,
    craftingEfficiency: 100 + (primaryStats.intelligence * 1) + equipmentMods.craftingBonus,
    tradeInfluence: 100 + (primaryStats.luck * 1.5) + equipmentMods.tradeBonus,
    reputationGain: 100 + (primaryStats.wisdom * 1) + equipmentMods.reputationBonus,
    summoningCost: 100 + equipmentMods.summoningCostBonus,
    travelUtility: 0 + equipmentMods.travelUtilityBonus,
  };
}

export interface StatRecalculationContext {
  level: number;
  classId: SummonerClass;
  equipment: EquipmentSlot[];
}

export function recalculateAllStats(context: StatRecalculationContext): {
  primaryStats: PlayerPrimaryStats;
  secondaryStats: PlayerSecondaryStats;
} {
  const primaryStats = calculatePrimaryStats(context.classId, context.level);
  const secondaryStats = calculateSecondaryStats(primaryStats, context.equipment);
  return { primaryStats, secondaryStats };
}

export function getPrimaryStatsOrDefault(partial: Partial<PlayerPrimaryStats>): PlayerPrimaryStats {
  return {
    strength: BASE_PRIMARY_STATS.strength + (partial.strength ?? 0),
    vitality: BASE_PRIMARY_STATS.vitality + (partial.vitality ?? 0),
    intelligence: BASE_PRIMARY_STATS.intelligence + (partial.intelligence ?? 0),
    dexterity: BASE_PRIMARY_STATS.dexterity + (partial.dexterity ?? 0),
    wisdom: BASE_PRIMARY_STATS.wisdom + (partial.wisdom ?? 0),
    luck: BASE_PRIMARY_STATS.luck + (partial.luck ?? 0),
  };
}

export function useFinalStats(values: Partial<PlayerPrimaryStats>): PlayerPrimaryStats {
  return {
    strength: values.strength ?? BASE_PRIMARY_STATS.strength,
    vitality: values.vitality ?? BASE_PRIMARY_STATS.vitality,
    intelligence: values.intelligence ?? BASE_PRIMARY_STATS.intelligence,
    dexterity: values.dexterity ?? BASE_PRIMARY_STATS.dexterity,
    wisdom: values.wisdom ?? BASE_PRIMARY_STATS.wisdom,
    luck: values.luck ?? BASE_PRIMARY_STATS.luck,
  };
}