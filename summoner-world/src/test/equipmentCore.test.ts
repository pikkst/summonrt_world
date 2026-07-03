import { describe, it, expect } from 'vitest';
import {
  createEmptyEquipmentSlots,
  equipItem,
  unequipItem,
  getEquippedItem,
  getEquipmentBonuses,
  getSummoningCostModifier,
  getTravelUtilityModifier,
  isSlotOccupied,
  getFilledSlotCount,
  getEmptySlotCount,
  EQUIPMENT_SLOT_IDS,
} from '../core/playerCore/equipmentCore';
import type { EquipmentSlot, EquipmentSlotId, InventoryItem } from '../types/playerCore';

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  templateKey: 'sword_flaming',
  quantity: 1,
  category: 'equipment',
  rarity: 'rare',
  binding: 'bound',
  addedAt: Date.now(),
  ...overrides,
});

describe('Equipment Core', () => {
  describe('EQUIPMENT_SLOT_IDS', () => {
    it('contains all required slots', () => {
      expect(EQUIPMENT_SLOT_IDS).toContain('weapon');
      expect(EQUIPMENT_SLOT_IDS).toContain('offhand');
      expect(EQUIPMENT_SLOT_IDS).toContain('head');
      expect(EQUIPMENT_SLOT_IDS).toContain('chest');
      expect(EQUIPMENT_SLOT_IDS).toContain('hands');
      expect(EQUIPMENT_SLOT_IDS).toContain('legs');
      expect(EQUIPMENT_SLOT_IDS).toContain('feet');
      expect(EQUIPMENT_SLOT_IDS).toContain('amulet');
      expect(EQUIPMENT_SLOT_IDS).toContain('ring_1');
      expect(EQUIPMENT_SLOT_IDS).toContain('ring_2');
      expect(EQUIPMENT_SLOT_IDS).toContain('summoner_focus');
      expect(EQUIPMENT_SLOT_IDS).toContain('creature_command_artifact');
    });

    it('has exactly 12 slots', () => {
      expect(EQUIPMENT_SLOT_IDS).toHaveLength(12);
    });
  });

  describe('createEmptyEquipmentSlots', () => {
    it('creates empty slots for all equipment types', () => {
      const slots = createEmptyEquipmentSlots();
      expect(slots).toHaveLength(12);
      slots.forEach((slot) => {
        expect(slot.itemKey).toBeUndefined();
        expect(slot.quantity).toBe(0);
      });
    });
  });

  describe('equipItem', () => {
    it('equips an item to an empty slot', () => {
      const equipment = createEmptyEquipmentSlots();
      const item = makeItem({ templateKey: 'sword_flaming', modifiers: { maxHealth: 50, elementalMastery: 20 } });
      
      const result = equipItem(equipment, 'weapon', item);
      
      expect(result.equipment.find(s => s.slot === 'weapon')?.itemKey).toBe('sword_flaming');
      expect(result.equipment.find(s => s.slot === 'weapon')?.modifiers).toEqual({ maxHealth: 50, elementalMastery: 20 });
      expect(result.swapped).toBeNull();
    });

    it('returns the previously equipped item as swapped', () => {
      const equipment = createEmptyEquipmentSlots();
      const oldItem = makeItem({ templateKey: 'sword_old', modifiers: { maxHealth: 30 } });
      const newItem = makeItem({ templateKey: 'sword_new', modifiers: { maxHealth: 50 } });
      
      const equipped = equipItem(equipment, 'weapon', oldItem);
      expect(equipped.equipment.find(s => s.slot === 'weapon')?.itemKey).toBe('sword_old');
      
      const result = equipItem(equipped.equipment, 'weapon', newItem);
      
      expect(result.equipment.find(s => s.slot === 'weapon')?.itemKey).toBe('sword_new');
      expect(result.swapped?.templateKey).toBe('sword_old');
    });

    it('does not swap when slot is empty', () => {
      const equipment = createEmptyEquipmentSlots();
      const item = makeItem({ templateKey: 'sword_flaming' });
      
      const result = equipItem(equipment, 'weapon', item);
      
      expect(result.swapped).toBeNull();
    });

    it('returns unchanged equipment for invalid slot', () => {
      const equipment = createEmptyEquipmentSlots();
      const item = makeItem();
      
      const result = equipItem(equipment, 'invalid_slot' as EquipmentSlotId, item);
      
      expect(result.equipment).toEqual(equipment);
      expect(result.swapped).toBeNull();
    });
  });

  describe('unequipItem', () => {
    it('unequips an item and returns it', () => {
      const equipment = createEmptyEquipmentSlots();
      const item = makeItem({ templateKey: 'sword_flaming', modifiers: { maxHealth: 50 } });
      
      const equipped = equipItem(equipment, 'weapon', item);
      const result = unequipItem(equipped.equipment, 'weapon');
      
      expect(result.equipment.find(s => s.slot === 'weapon')?.itemKey).toBeUndefined();
      expect(result.unequipped?.templateKey).toBe('sword_flaming');
    });

    it('returns null when slot is empty', () => {
      const equipment = createEmptyEquipmentSlots();
      
      const result = unequipItem(equipment, 'weapon');
      
      expect(result.unequipped).toBeNull();
      expect(result.equipment.find(s => s.slot === 'weapon')?.itemKey).toBeUndefined();
    });

    it('returns unchanged equipment for invalid slot', () => {
      const equipment = createEmptyEquipmentSlots();
      
      const result = unequipItem(equipment, 'invalid_slot' as EquipmentSlotId);
      
      expect(result.equipment).toEqual(equipment);
      expect(result.unequipped).toBeNull();
    });
  });

  describe('getEquippedItem', () => {
    it('returns the equipped item for a slot', () => {
      const equipment = createEmptyEquipmentSlots();
      const item = makeItem({ templateKey: 'ring_power', modifiers: { elementalMastery: 15 } });
      
      const equipped = equipItem(equipment, 'ring_1', item);
      const result = getEquippedItem(equipped.equipment, 'ring_1');
      
      expect(result?.templateKey).toBe('ring_power');
      expect(result?.modifiers).toEqual({ elementalMastery: 15 });
    });

    it('returns null for empty slot', () => {
      const equipment = createEmptyEquipmentSlots();
      
      const result = getEquippedItem(equipment, 'weapon');
      
      expect(result).toBeNull();
    });
  });

  describe('getEquipmentBonuses', () => {
    it('returns zero bonuses for empty equipment', () => {
      const bonuses = getEquipmentBonuses(createEmptyEquipmentSlots());
      
      expect(bonuses.maxHealth).toBe(0);
      expect(bonuses.elementalMastery).toBe(0);
      expect(bonuses.movement).toBe(0);
      expect(bonuses.summoningCost).toBe(0);
      expect(bonuses.travelUtility).toBe(0);
    });

    it('sums modifiers from multiple items', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1, modifiers: { maxHealth: 50, elementalMastery: 20 } },
        { slot: 'chest', itemKey: 'armor', quantity: 1, modifiers: { maxHealth: 100, movement: 5 } },
      ];
      
      const bonuses = getEquipmentBonuses(equipment);
      
      expect(bonuses.maxHealth).toBe(150);
      expect(bonuses.elementalMastery).toBe(20);
      expect(bonuses.movement).toBe(5);
    });

    it('includes summoning cost modifier', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'summoner_focus', itemKey: 'focus_crystal', quantity: 1, modifiers: { summoningCost: -20 } },
      ];
      
      const bonuses = getEquipmentBonuses(equipment);
      
      expect(bonuses.summoningCost).toBe(-20);
    });

    it('includes travel utility modifier', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'amulet', itemKey: 'travel_amulet', quantity: 1, modifiers: { travelUtility: 15 } },
      ];
      
      const bonuses = getEquipmentBonuses(equipment);
      
      expect(bonuses.travelUtility).toBe(15);
    });

    it('aggregates all supported stat modifiers', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1, modifiers: { maxHealth: 30, maxMana: 20, movement: 3, criticalChance: 5, elementalMastery: 10, contractCapacity: 2, commandSpeed: 10, creatureBondPower: 15, inventoryCapacity: 5, craftingEfficiency: 8, tradeInfluence: 10, reputationGain: 5, summoningCost: -5, travelUtility: 3 } },
        { slot: 'ring_1', itemKey: 'ring', quantity: 1, modifiers: { maxHealth: 20, elementalMastery: 8 } },
      ];
      
      const bonuses = getEquipmentBonuses(equipment);
      
      expect(bonuses.maxHealth).toBe(50);
      expect(bonuses.maxMana).toBe(20);
      expect(bonuses.movement).toBe(3);
      expect(bonuses.criticalChance).toBe(5);
      expect(bonuses.elementalMastery).toBe(18);
      expect(bonuses.contractCapacity).toBe(2);
      expect(bonuses.commandSpeed).toBe(10);
      expect(bonuses.creatureBondPower).toBe(15);
      expect(bonuses.inventoryCapacity).toBe(5);
      expect(bonuses.craftingEfficiency).toBe(8);
      expect(bonuses.tradeInfluence).toBe(10);
      expect(bonuses.reputationGain).toBe(5);
      expect(bonuses.summoningCost).toBe(-5);
      expect(bonuses.travelUtility).toBe(3);
    });
  });

  describe('getSummoningCostModifier', () => {
    it('returns zero for empty equipment', () => {
      expect(getSummoningCostModifier(createEmptyEquipmentSlots())).toBe(0);
    });

    it('sums summoning cost modifiers', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'summoner_focus', itemKey: 'focus', quantity: 1, modifiers: { summoningCost: -15 } },
        { slot: 'ring_2', itemKey: 'ring', quantity: 1, modifiers: { summoningCost: -5 } },
      ];
      
      expect(getSummoningCostModifier(equipment)).toBe(-20);
    });

    it('ignores slots without summoning cost modifier', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1, modifiers: { maxHealth: 50 } },
        { slot: 'head', itemKey: 'helm', quantity: 1, modifiers: { maxHealth: 30 } },
      ];
      
      expect(getSummoningCostModifier(equipment)).toBe(0);
    });
  });

  describe('getTravelUtilityModifier', () => {
    it('returns zero for empty equipment', () => {
      expect(getTravelUtilityModifier(createEmptyEquipmentSlots())).toBe(0);
    });

    it('sums travel utility modifiers', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'amulet', itemKey: 'travel_amulet', quantity: 1, modifiers: { travelUtility: 25 } },
      ];
      
      expect(getTravelUtilityModifier(equipment)).toBe(25);
    });

    it('ignores slots without travel utility modifier', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1, modifiers: { maxHealth: 50 } },
      ];
      
      expect(getTravelUtilityModifier(equipment)).toBe(0);
    });
  });

  describe('isSlotOccupied', () => {
    it('returns false for empty slot', () => {
      const equipment = createEmptyEquipmentSlots();
      expect(isSlotOccupied(equipment, 'weapon')).toBe(false);
    });

    it('returns true for occupied slot', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1 },
      ];
      expect(isSlotOccupied(equipment, 'weapon')).toBe(true);
    });

    it('returns false for slot with empty itemKey', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: '', quantity: 1 },
      ];
      expect(isSlotOccupied(equipment, 'weapon')).toBe(false);
    });
  });

  describe('getFilledSlotCount and getEmptySlotCount', () => {
    it('counts filled and empty slots correctly', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1 },
        { slot: 'offhand', itemKey: 'shield', quantity: 1 },
        { slot: 'head', itemKey: '', quantity: 0 },
        { slot: 'chest', quantity: 0 },
      ];
      
      expect(getFilledSlotCount(equipment)).toBe(2);
      expect(getEmptySlotCount(equipment)).toBe(2);
    });

    it('returns all empty for empty equipment', () => {
      const equipment = createEmptyEquipmentSlots();
      expect(getFilledSlotCount(equipment)).toBe(0);
      expect(getEmptySlotCount(equipment)).toBe(12);
    });

    it('returns all filled for fully equipped', () => {
      const equipment: EquipmentSlot[] = EQUIPMENT_SLOT_IDS.map((slot) => ({
        slot,
        itemKey: `item_${slot}`,
        quantity: 1,
      }));
      
      expect(getFilledSlotCount(equipment)).toBe(12);
      expect(getEmptySlotCount(equipment)).toBe(0);
    });
  });

  describe('integration with calculateSecondaryStats', () => {
    it('equipment bonuses apply to secondary stat calculation', async () => {
      const { calculateSecondaryStats } = await import('../core/playerCore/playerStatistics');
      const { calculatePrimaryStats } = await import('../core/playerCore/playerStatistics');
      
      const primaryStats = calculatePrimaryStats('elementalist', 1);
      const equipment: EquipmentSlot[] = [
        { slot: 'summoner_focus', itemKey: 'focus', quantity: 1, modifiers: { summoningCost: -15, elementalMastery: 25 } },
        { slot: 'amulet', itemKey: 'amulet', quantity: 1, modifiers: { travelUtility: 20 } },
      ];
      
      const secondary = calculateSecondaryStats(primaryStats, equipment);
      
      expect(secondary.summoningCost).toBe(85);
      expect(secondary.travelUtility).toBe(20);
      expect(secondary.elementalMastery).toBeGreaterThan(18);
    });
  });

  describe('deterministic equipment bonuses', () => {
    it('returns same bonuses for same equipment', () => {
      const equipment: EquipmentSlot[] = [
        { slot: 'weapon', itemKey: 'sword', quantity: 1, modifiers: { maxHealth: 50 } },
      ];
      
      const bonuses1 = getEquipmentBonuses(equipment);
      const bonuses2 = getEquipmentBonuses(equipment);
      
      expect(bonuses1).toEqual(bonuses2);
    });
  });
});