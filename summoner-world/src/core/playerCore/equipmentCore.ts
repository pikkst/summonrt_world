import type {
  EquipmentSlot,
  EquipmentSlotId,
  InventoryItem,
  PlayerSecondaryStats,
} from '../../types/playerCore.ts';

export const EQUIPMENT_SLOT_IDS: EquipmentSlotId[] = [
  'weapon',
  'offhand',
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
  'amulet',
  'ring_1',
  'ring_2',
  'summoner_focus',
  'creature_command_artifact',
];

export function createEmptyEquipmentSlots(): EquipmentSlot[] {
  return EQUIPMENT_SLOT_IDS.map((slot) => ({
    slot,
    quantity: 0,
  }));
}

export function equipItem(
  equipment: EquipmentSlot[],
  slotId: EquipmentSlotId,
  item: InventoryItem
): { equipment: EquipmentSlot[]; swapped: InventoryItem | null } {
  const slotIndex = equipment.findIndex((s) => s.slot === slotId);
  if (slotIndex === -1) {
    return { equipment, swapped: null };
  }

  const existingSlot = equipment[slotIndex]!;
  const swapped: InventoryItem | null =
    existingSlot.itemKey && existingSlot.itemKey !== item.templateKey
      ? {
          templateKey: existingSlot.itemKey,
          quantity: existingSlot.quantity,
          category: 'equipment',
          rarity: 'common',
          binding: 'bound',
          modifiers: existingSlot.modifiers,
          addedAt: Date.now(),
        }
      : null;

  const updatedEquipment: EquipmentSlot[] = [...equipment];
  updatedEquipment[slotIndex] = {
    slot: slotId,
    itemKey: item.templateKey,
    quantity: 1,
    modifiers: item.modifiers,
  };

  return { equipment: updatedEquipment, swapped };
}

export function unequipItem(
  equipment: EquipmentSlot[],
  slotId: EquipmentSlotId
): { equipment: EquipmentSlot[]; unequipped: InventoryItem | null } {
  const slotIndex = equipment.findIndex((s) => s.slot === slotId);
  if (slotIndex === -1) {
    return { equipment, unequipped: null };
  }

  const existingSlot = equipment[slotIndex]!;
  const unequipped: InventoryItem | null =
    existingSlot.itemKey
      ? {
          templateKey: existingSlot.itemKey,
          quantity: existingSlot.quantity,
          category: 'equipment',
          rarity: 'common',
          binding: 'bound',
          modifiers: existingSlot.modifiers,
          addedAt: Date.now(),
        }
      : null;

  const updatedEquipment: EquipmentSlot[] = [...equipment];
  updatedEquipment[slotIndex] = {
    slot: slotId,
    quantity: 0,
  };

  return { equipment: updatedEquipment, unequipped };
}

export function getEquippedItem(
  equipment: EquipmentSlot[],
  slotId: EquipmentSlotId
): InventoryItem | null {
  const slot = equipment.find((s) => s.slot === slotId);
  if (!slot?.itemKey) return null;

  return {
    templateKey: slot.itemKey,
    quantity: slot.quantity,
    category: 'equipment',
    rarity: 'common',
    binding: 'bound',
    modifiers: slot.modifiers,
    addedAt: Date.now(),
  };
}

export function getEquipmentBonuses(
  equipment: EquipmentSlot[]
): PlayerSecondaryStats {
  return equipment.reduce(
    (acc, slot) => {
      if (slot.modifiers) {
        acc.maxHealth += slot.modifiers.maxHealth || 0;
        acc.maxMana += slot.modifiers.maxMana || 0;
        acc.movement += slot.modifiers.movement || 0;
        acc.criticalChance += slot.modifiers.criticalChance || 0;
        acc.elementalMastery += slot.modifiers.elementalMastery || 0;
        acc.contractCapacity += slot.modifiers.contractCapacity || 0;
        acc.commandSpeed += slot.modifiers.commandSpeed || 0;
        acc.creatureBondPower += slot.modifiers.creatureBondPower || 0;
        acc.inventoryCapacity += slot.modifiers.inventoryCapacity || 0;
        acc.craftingEfficiency += slot.modifiers.craftingEfficiency || 0;
        acc.tradeInfluence += slot.modifiers.tradeInfluence || 0;
        acc.reputationGain += slot.modifiers.reputationGain || 0;
        acc.summoningCost += slot.modifiers.summoningCost || 0;
        acc.travelUtility += slot.modifiers.travelUtility || 0;
      }
      return acc;
    },
    {
      maxHealth: 0,
      maxMana: 0,
      maxStamina: 0,
      movement: 0,
      criticalChance: 0,
      elementalMastery: 0,
      contractCapacity: 0,
      commandSpeed: 0,
      creatureBondPower: 0,
      inventoryCapacity: 0,
      craftingEfficiency: 0,
      tradeInfluence: 0,
      reputationGain: 0,
      summoningCost: 0,
      travelUtility: 0,
    }
  );
}

export function getSummoningCostModifier(
  equipment: EquipmentSlot[]
): number {
  return equipment.reduce((acc, slot) => {
    if (slot.modifiers?.summoningCost) {
      return acc + slot.modifiers.summoningCost;
    }
    return acc;
  }, 0);
}

export function getTravelUtilityModifier(
  equipment: EquipmentSlot[]
): number {
  return equipment.reduce((acc, slot) => {
    if (slot.modifiers?.travelUtility) {
      return acc + slot.modifiers.travelUtility;
    }
    return acc;
  }, 0);
}

export function isSlotOccupied(
  equipment: EquipmentSlot[],
  slotId: EquipmentSlotId
): boolean {
  const slot = equipment.find((s) => s.slot === slotId);
  return slot?.itemKey !== undefined && slot.itemKey !== '';
}

export function getFilledSlotCount(equipment: EquipmentSlot[]): number {
  return equipment.filter((slot) => slot.itemKey).length;
}

export function getEmptySlotCount(equipment: EquipmentSlot[]): number {
  return equipment.filter((slot) => !slot.itemKey).length;
}