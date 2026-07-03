import { describe, it, expect } from 'vitest';
import {
  getItemCategory,
  getItemRarity,
  canStackItems,
  stackItem,
  addItemToInventory,
  removeItemFromInventory,
  hasItem,
  getItemCount,
  sortInventory,
  filterInventory,
  getInventoryByCategory,
  canTradeItem,
  bindItem,
  getInventoryCapacity,
  isInventoryFull,
  getUniqueItemCount,
  getTotalItemCount,
  serializeInventory,
  deserializeInventory,
  migrateLegacyInventory,
  createStartingInventory,
  mergeInventories,
  splitStack,
  pruneInvalidItems,
  RARITY_ORDER,
} from '../core/playerCore/inventoryCore';
import type { InventoryItem, PlayerSecondaryStats } from '../types/playerCore';
import type { InventoryStack, ItemTemplate } from '../types/game';

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  templateKey: 'test_item',
  quantity: 1,
  category: 'material',
  rarity: 'common',
  binding: 'tradeable',
  addedAt: Date.now(),
  ...overrides,
});

const makeTemplate = (overrides: Partial<ItemTemplate> = {}): ItemTemplate => ({
  key: 'test_item',
  name: 'Test Item',
  type: 'material',
  rarity: 0,
  stackable: true,
  maxStack: 99,
  description: 'A test item',
  ...overrides,
});

describe('Inventory Core', () => {
  describe('getItemCategory', () => {
    it('maps weapon subtype to equipment', () => {
      expect(getItemCategory(makeTemplate({ subtype: 'weapon' }))).toBe('equipment');
    });

    it('maps armor subtype to equipment', () => {
      expect(getItemCategory(makeTemplate({ subtype: 'armor' }))).toBe('equipment');
    });

    it('maps herb type to material', () => {
      expect(getItemCategory(makeTemplate({ type: 'material', subtype: 'herb' }))).toBe('material');
    });

    it('maps egg type to creature', () => {
      expect(getItemCategory(makeTemplate({ type: 'egg' }))).toBe('creature');
    });

    it('falls back to material for unknown types', () => {
      expect(getItemCategory(makeTemplate({ type: 'unknown' as any }))).toBe('material');
    });
  });

  describe('getItemRarity', () => {
    it('returns common for rarity 0', () => {
      expect(getItemRarity(0)).toBe('common');
    });

    it('returns uncommon for rarity 1', () => {
      expect(getItemRarity(1)).toBe('uncommon');
    });

    it('returns mythical for rarity 5', () => {
      expect(getItemRarity(5)).toBe('mythical');
    });

    it('caps mythical at 5', () => {
      expect(getItemRarity(10)).toBe('mythical');
    });
  });

  describe('canStackItems', () => {
    it('returns true for same template and modifiers', () => {
      const a: InventoryStack = { templateKey: 'herb', quantity: 5, modifiers: { a: 1 } };
      const b: InventoryStack = { templateKey: 'herb', quantity: 3, modifiers: { a: 1 } };
      expect(canStackItems(a, b)).toBe(true);
    });

    it('returns false for different template keys', () => {
      const a: InventoryStack = { templateKey: 'herb', quantity: 5 };
      const b: InventoryStack = { templateKey: 'crystal', quantity: 3 };
      expect(canStackItems(a, b)).toBe(false);
    });

    it('returns false for different modifiers', () => {
      const a: InventoryStack = { templateKey: 'herb', quantity: 5, modifiers: { a: 1 } };
      const b: InventoryStack = { templateKey: 'herb', quantity: 3, modifiers: { a: 2 } };
      expect(canStackItems(a, b)).toBe(false);
    });
  });

  describe('stackItem', () => {
    it('merges into existing stack when space available', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 5 })];
      const result = stackItem(inventory, { templateKey: 'herb', quantity: 3 }, 'material', 'common', 'tradeable');
      expect(result).toHaveLength(1);
      expect(result[0]!.quantity).toBe(8);
    });

    it('creates new stack when no existing match', () => {
      const inventory: InventoryItem[] = [];
      const result = stackItem(inventory, { templateKey: 'herb', quantity: 3 }, 'material', 'common', 'tradeable');
      expect(result).toHaveLength(1);
      expect(result[0]!.quantity).toBe(3);
    });

    it('splits when stack is full', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 99 })];
      const result = stackItem(inventory, { templateKey: 'herb', quantity: 5 }, 'material', 'common', 'tradeable');
      expect(result).toHaveLength(2);
      expect(result[0]!.quantity).toBe(99);
      expect(result[1]!.quantity).toBe(5);
    });
  });

  describe('addItemToInventory', () => {
    it('adds new item to empty inventory', () => {
      const result = addItemToInventory([], { templateKey: 'herb', quantity: 5 }, makeTemplate({ key: 'herb' }));
      expect(result.added).toBe(true);
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0]!.quantity).toBe(5);
    });

    it('stacks onto existing matching item', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 3 })];
      const result = addItemToInventory(inventory, { templateKey: 'herb', quantity: 2 }, makeTemplate({ key: 'herb' }));
      expect(result.added).toBe(true);
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0]!.quantity).toBe(5);
    });

    it('adds non-stackable item as new stack', () => {
      const inventory = [makeItem({ templateKey: 'sword', quantity: 1 })];
      const result = addItemToInventory(inventory, { templateKey: 'sword', quantity: 1 }, makeTemplate({ key: 'sword', stackable: false }));
      expect(result.added).toBe(true);
      expect(result.inventory).toHaveLength(2);
    });

    it('handles max stack overflow', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 97 })];
      const result = addItemToInventory(inventory, { templateKey: 'herb', quantity: 5 }, makeTemplate({ key: 'herb', maxStack: 99 }));
      expect(result.added).toBe(true);
      expect(result.inventory).toHaveLength(2);
      expect(result.inventory[0]!.quantity).toBe(99);
      expect(result.inventory[1]!.quantity).toBe(3);
    });
  });

  describe('removeItemFromInventory', () => {
    it('removes correct quantity', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 10 })];
      const result = removeItemFromInventory(inventory, 'herb', 3);
      expect(result.removed).toBe(true);
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0]!.quantity).toBe(7);
    });

    it('removes entire stack when quantity matches', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 5 })];
      const result = removeItemFromInventory(inventory, 'herb', 5);
      expect(result.removed).toBe(true);
      expect(result.inventory).toHaveLength(0);
    });

    it('returns remaining when not enough', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 2 })];
      const result = removeItemFromInventory(inventory, 'herb', 5);
      expect(result.removed).toBe(false);
      expect(result.remaining).toBe(3);
    });

    it('respects filters', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', quantity: 5, rarity: 'common' }),
        makeItem({ templateKey: 'herb', quantity: 3, rarity: 'rare' }),
      ];
      const result = removeItemFromInventory(inventory, 'herb', 5, { rarities: ['common'] });
      expect(result.removed).toBe(true);
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0]!.rarity).toBe('rare');
    });
  });

  describe('hasItem and getItemCount', () => {
    it('returns true when item exists', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 5 })];
      expect(hasItem(inventory, 'herb')).toBe(true);
    });

    it('returns false when item does not exist', () => {
      const inventory: InventoryItem[] = [];
      expect(hasItem(inventory, 'herb')).toBe(false);
    });

    it('checks quantity threshold', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 3 })];
      expect(hasItem(inventory, 'herb', 5)).toBe(false);
      expect(hasItem(inventory, 'herb', 2)).toBe(true);
    });

    it('counts total quantity', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 3 }), makeItem({ templateKey: 'herb', quantity: 2 })];
      expect(getItemCount(inventory, 'herb')).toBe(5);
    });

    it('respects filters in count', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', quantity: 3, rarity: 'common' }),
        makeItem({ templateKey: 'herb', quantity: 2, rarity: 'rare' }),
      ];
      expect(getItemCount(inventory, 'herb', { rarities: ['common'] })).toBe(3);
    });
  });

  describe('sortInventory', () => {
    it('sorts by category ascending', () => {
      const inventory = [
        makeItem({ templateKey: 'z_item', category: 'material' }),
        makeItem({ templateKey: 'a_item', category: 'equipment' }),
      ];
      const sorted = sortInventory(inventory, 'category');
      expect(sorted[0]!.category).toBe('equipment');
      expect(sorted[1]!.category).toBe('material');
    });

    it('sorts by rarity descending', () => {
      const inventory = [
        makeItem({ templateKey: 'common', rarity: 'common' }),
        makeItem({ templateKey: 'epic', rarity: 'epic' }),
        makeItem({ templateKey: 'rare', rarity: 'rare' }),
      ];
      const sorted = sortInventory(inventory, 'rarity', 'desc');
      expect(sorted[0]!.rarity).toBe('epic');
      expect(sorted[2]!.rarity).toBe('common');
    });

    it('sorts by name ascending', () => {
      const inventory = [
        makeItem({ templateKey: 'zebra' }),
        makeItem({ templateKey: 'apple' }),
      ];
      const sorted = sortInventory(inventory, 'name');
      expect(sorted[0]!.templateKey).toBe('apple');
      expect(sorted[1]!.templateKey).toBe('zebra');
    });
  });

  describe('filterInventory', () => {
    it('filters by single category', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', category: 'material' }),
        makeItem({ templateKey: 'sword', category: 'equipment' }),
      ];
      const filtered = filterInventory(inventory, { categories: ['material'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.templateKey).toBe('herb');
    });

    it('filters by multiple categories', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', category: 'material' }),
        makeItem({ templateKey: 'sword', category: 'equipment' }),
        makeItem({ templateKey: 'potion', category: 'consumable' }),
      ];
      const filtered = filterInventory(inventory, { categories: ['material', 'consumable'] });
      expect(filtered).toHaveLength(2);
    });

    it('filters by rarity', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', rarity: 'common' }),
        makeItem({ templateKey: 'sword', rarity: 'epic' }),
      ];
      const filtered = filterInventory(inventory, { rarities: ['epic'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.rarity).toBe('epic');
    });

    it('filters by name contains', () => {
      const inventory = [
        makeItem({ templateKey: 'healing_herb' }),
        makeItem({ templateKey: 'mana_crystal' }),
      ];
      const filtered = filterInventory(inventory, { nameContains: 'herb' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.templateKey).toBe('healing_herb');
    });
  });

  describe('getInventoryByCategory', () => {
    it('groups items by category', () => {
      const inventory = [
        makeItem({ templateKey: 'herb', category: 'material' }),
        makeItem({ templateKey: 'sword', category: 'equipment' }),
        makeItem({ templateKey: 'potion', category: 'consumable' }),
      ];
      const grouped = getInventoryByCategory(inventory);
      expect(grouped.material).toHaveLength(1);
      expect(grouped.equipment).toHaveLength(1);
      expect(grouped.consumable).toHaveLength(1);
    });

    it('returns empty groups for missing categories', () => {
      const inventory = [makeItem({ templateKey: 'herb', category: 'material' })];
      const grouped = getInventoryByCategory(inventory);
      expect(grouped.equipment).toBeUndefined();
    });
  });

  describe('canTradeItem', () => {
    it('allows tradeable items', () => {
      expect(canTradeItem(makeItem({ binding: 'tradeable' }))).toBe(true);
    });

    it('allows marketable items', () => {
      expect(canTradeItem(makeItem({ binding: 'marketable' }))).toBe(true);
    });

    it('blocks bound items', () => {
      expect(canTradeItem(makeItem({ binding: 'bound' }))).toBe(false);
    });
  });

  describe('bindItem', () => {
    it('binds matching item by template key', () => {
      const inventory = [makeItem({ templateKey: 'sword', binding: 'tradeable' })];
      const result = bindItem(inventory, 'sword');
      expect(result[0]!.binding).toBe('bound');
    });

    it('does not affect other items', () => {
      const inventory = [
        makeItem({ templateKey: 'sword', binding: 'tradeable' }),
        makeItem({ templateKey: 'shield', binding: 'tradeable' }),
      ];
      const result = bindItem(inventory, 'sword');
      expect(result[0]!.binding).toBe('bound');
      expect(result[1]!.binding).toBe('tradeable');
    });
  });

  describe('inventory capacity', () => {
    it('returns floor of inventoryCapacity', () => {
      const stats: PlayerSecondaryStats = {
        maxHealth: 100, maxMana: 50, maxStamina: 100, movement: 5,
        criticalChance: 5, elementalMastery: 10, contractCapacity: 5,
        commandSpeed: 100, creatureBondPower: 100, inventoryCapacity: 20.7,
        craftingEfficiency: 100, tradeInfluence: 100, reputationGain: 100,
      };
      expect(getInventoryCapacity(stats)).toBe(20);
    });

    it('reports full when at capacity', () => {
      const stats: PlayerSecondaryStats = {
        maxHealth: 100, maxMana: 50, maxStamina: 100, movement: 5,
        criticalChance: 5, elementalMastery: 10, contractCapacity: 5,
        commandSpeed: 100, creatureBondPower: 100, inventoryCapacity: 2,
        craftingEfficiency: 100, tradeInfluence: 100, reputationGain: 100,
      };
      const inventory = [makeItem({}), makeItem({ templateKey: 'other' })];
      expect(isInventoryFull(inventory, stats)).toBe(true);
    });

    it('allows adding when stack has space', () => {
      const stats: PlayerSecondaryStats = {
        maxHealth: 100, maxMana: 50, maxStamina: 100, movement: 5,
        criticalChance: 5, elementalMastery: 10, contractCapacity: 5,
        commandSpeed: 100, creatureBondPower: 100, inventoryCapacity: 2,
        craftingEfficiency: 100, tradeInfluence: 100, reputationGain: 100,
      };
      const inventory = [makeItem({ templateKey: 'herb', quantity: 50 })];
      const template = makeTemplate({ key: 'herb', maxStack: 99 });
      expect(isInventoryFull(inventory, stats, template)).toBe(false);
    });
  });

  describe('getUniqueItemCount and getTotalItemCount', () => {
    it('counts unique stacks', () => {
      const inventory = [makeItem({}), makeItem({ templateKey: 'other' })];
      expect(getUniqueItemCount(inventory)).toBe(2);
    });

    it('sums quantities', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 5 }), makeItem({ templateKey: 'herb', quantity: 3 })];
      expect(getTotalItemCount(inventory)).toBe(8);
    });
  });

  describe('serializeInventory and deserializeInventory', () => {
    it('round-trips through serialization', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 5, rarity: 'uncommon' })];
      const serialized = serializeInventory(inventory);
      const deserialized = deserializeInventory(serialized);
      expect(deserialized).toHaveLength(1);
      expect(deserialized[0]!.templateKey).toBe('herb');
      expect(deserialized[0]!.quantity).toBe(5);
      expect(deserialized[0]!.rarity).toBe('common');
    });
  });

  describe('migrateLegacyInventory', () => {
    it('converts legacy stacks to inventory items', () => {
      const legacy: InventoryStack[] = [{ templateKey: 'herb', quantity: 5 }];
      const migrated = migrateLegacyInventory(legacy);
      expect(migrated).toHaveLength(1);
      expect(migrated[0]!.templateKey).toBe('herb');
      expect(migrated[0]!.binding).toBe('bound');
      expect(migrated[0]!.category).toBe('material');
    });
  });

  describe('createStartingInventory', () => {
    it('creates default items', () => {
      const inventory = createStartingInventory('elementalist');
      expect(inventory.length).toBeGreaterThan(0);
      const hasHerb = inventory.some((i) => i.templateKey === 'healing_herb');
      expect(hasHerb).toBe(true);
    });

    it('adds class-specific items', () => {
      const inventory = createStartingInventory('alchemist');
      const hasEssence = inventory.some((i) => i.templateKey === 'essence');
      expect(hasEssence).toBe(true);
    });
  });

  describe('mergeInventories', () => {
    it('combines two inventories', () => {
      const a = [makeItem({ templateKey: 'herb', quantity: 3 })];
      const b = [makeItem({ templateKey: 'herb', quantity: 2 })];
      const merged = mergeInventories(a, b);
      expect(merged).toHaveLength(1);
      expect(merged[0]!.quantity).toBe(5);
    });

    it('preserves unique items', () => {
      const a = [makeItem({ templateKey: 'herb' })];
      const b = [makeItem({ templateKey: 'crystal' })];
      const merged = mergeInventories(a, b);
      expect(merged).toHaveLength(2);
    });
  });

  describe('splitStack', () => {
    it('splits a stack', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 10 })];
      const result = splitStack(inventory, 'herb', 3);
      expect(result.newStack).not.toBeNull();
      expect(result.newStack!.quantity).toBe(3);
      expect(result.inventory[0]!.quantity).toBe(7);
    });

    it('returns null when full split', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 3 })];
      const result = splitStack(inventory, 'herb', 3);
      expect(result.newStack).toBeNull();
      expect(result.inventory[0]!.quantity).toBe(3);
    });
  });

  describe('pruneInvalidItems', () => {
    it('removes items with zero quantity', () => {
      const inventory = [makeItem({ templateKey: 'herb', quantity: 0 })];
      expect(pruneInvalidItems(inventory)).toHaveLength(0);
    });

    it('removes items with empty template key', () => {
      const inventory = [makeItem({ templateKey: '', quantity: 1 })];
      expect(pruneInvalidItems(inventory)).toHaveLength(0);
    });
  });
});
