import type { EquipmentSlot, EquipmentSlotId, PlayerCoreState } from '../../types/playerCore.ts';
import type { InventoryItem } from '../../types/playerCore.ts';
import type { Structure } from '../../types/structure.ts';
import { STRUCTURE_DEFINITIONS } from '../../types/structure.ts';

export const MAX_EQUIPMENT_DURABILITY = 100;
export const EQUIPMENT_WEAR_PER_COMBAT = 4;
export const REPAIR_COST_PER_DURABILITY = 2;

export const HOUSING_TAX_RATE_PCT = 10;

export const FUSION_MATERIAL_DECAY_CHANCE_PER_TICK = 0.003;
export const FUSION_MATERIAL_KEY_PREFIX = 'soul_crystal_';

export function isFusionMaterial(templateKey: string): boolean {
  return templateKey.startsWith(FUSION_MATERIAL_KEY_PREFIX);
}

export function calculateHousingTax(structures: Structure[]): number {
  const baseIncome = structures.reduce((total, structure) => {
    const definition = STRUCTURE_DEFINITIONS[structure.type];
    return total + (definition?.passiveIncomeRate ?? 0);
  }, 0);
  return Math.floor((baseIncome * HOUSING_TAX_RATE_PCT) / 100);
}

export function applyEquipmentWear(equipment: EquipmentSlot[], amount: number = EQUIPMENT_WEAR_PER_COMBAT): EquipmentSlot[] {
  return equipment.map((slot) => {
    if (!slot.itemKey) return slot;
    const current = slot.durability ?? MAX_EQUIPMENT_DURABILITY;
    const next = Math.max(0, current - amount);
    return { ...slot, durability: next };
  });
}

export function getEquipmentSlotDurability(slot: EquipmentSlot): number {
  return slot.durability ?? MAX_EQUIPMENT_DURABILITY;
}

export function getEquipmentRepairCost(equipment: EquipmentSlot[], slotId: EquipmentSlotId): number {
  const slot = equipment.find((s) => s.slot === slotId);
  if (!slot?.itemKey) return 0;
  const missing = MAX_EQUIPMENT_DURABILITY - getEquipmentSlotDurability(slot);
  return missing * REPAIR_COST_PER_DURABILITY;
}

export interface RepairResult {
  playerCore: PlayerCoreState;
  repaired: boolean;
  cost: number;
  restoredDurability: number;
}

export function repairEquipmentSlot(
  playerCore: PlayerCoreState,
  slotId: EquipmentSlotId
): RepairResult {
  const slot = playerCore.equipment.find((s) => s.slot === slotId);
  if (!slot?.itemKey) {
    return { playerCore, repaired: false, cost: 0, restoredDurability: 0 };
  }

  const current = getEquipmentSlotDurability(slot);
  const missing = MAX_EQUIPMENT_DURABILITY - current;
  if (missing <= 0) {
    return { playerCore, repaired: false, cost: 0, restoredDurability: 0 };
  }

  const fullCost = missing * REPAIR_COST_PER_DURABILITY;
  const affordable = Math.min(playerCore.money, fullCost);
  const restored = Math.floor(affordable / REPAIR_COST_PER_DURABILITY);
  const cost = restored * REPAIR_COST_PER_DURABILITY;
  const newDurability = current + restored;

  const equipment = playerCore.equipment.map((s) =>
    s.slot === slotId ? { ...s, durability: newDurability } : s
  );

  return {
    playerCore: { ...playerCore, money: playerCore.money - cost, equipment },
    repaired: restored > 0,
    cost,
    restoredDurability: restored,
  };
}

export function applyFusionMaterialDecay(
  inventory: InventoryItem[],
  rng: () => number = Math.random,
  chance: number = FUSION_MATERIAL_DECAY_CHANCE_PER_TICK
): InventoryItem[] {
  let changed = false;
  const next = inventory.map((item) => {
    if (!isFusionMaterial(item.templateKey) || item.quantity <= 0) return item;
    if (rng() < chance) {
      changed = true;
      return { ...item, quantity: item.quantity - 1 };
    }
    return item;
  });
  if (!changed) return inventory;
  return next.filter((item) => item.quantity > 0);
}
