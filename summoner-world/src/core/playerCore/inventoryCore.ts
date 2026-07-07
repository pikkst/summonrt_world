import type {
  PlayerCoreState,
  PlayerSecondaryStats,
  ItemCategory,
  ItemBinding,
  ItemRarity,
  InventoryItem,
  InventoryFilter,
  InventorySortKey,
  InventorySortOrder,
} from '../../types/playerCore.ts';
import type { InventoryStack, ItemTemplate, PlayerState } from '../../types/game.ts';

export const ITEM_CATEGORY_TEMPLATES: Record<string, ItemCategory> = {
  weapon: 'equipment',
  armor: 'equipment',
  accessory: 'equipment',
  herb: 'material',
  crystal: 'material',
  essence: 'material',
  fragment: 'material',
  food: 'consumable',
  potion: 'consumable',
  scroll: 'consumable',
  egg: 'creature',
  soul_crystal: 'contract',
  dungeon_key: 'dungeon_key',
  house: 'housing',
  tool: 'crafting_tool',
  trade_good: 'marketplace',
  quest_item: 'quest',
};

export const RARITY_ORDER: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
};

export const CRAFTING_TIER_ORDER: Record<string, number> = {
  basic: 0,
  intermediate: 1,
  advanced: 2,
  artifact: 3,
};

export function getCraftingTierOrder(tier: string): number {
  return CRAFTING_TIER_ORDER[tier] ?? -1;
}

export function getItemCategory(template: ItemTemplate): ItemCategory {
  if (template.subtype && ITEM_CATEGORY_TEMPLATES[template.subtype]) {
    return ITEM_CATEGORY_TEMPLATES[template.subtype]!;
  }
  if (ITEM_CATEGORY_TEMPLATES[template.type]) {
    return ITEM_CATEGORY_TEMPLATES[template.type]!;
  }
  return 'material';
}

export function getItemRarity(rarityValue: number): ItemRarity {
  if (rarityValue >= 5) return 'mythical';
  if (rarityValue >= 4) return 'legendary';
  if (rarityValue >= 3) return 'epic';
  if (rarityValue >= 2) return 'rare';
  if (rarityValue >= 1) return 'uncommon';
  return 'common';
}

export function canStackItems(a: InventoryStack, b: InventoryStack): boolean {
  if (a.templateKey !== b.templateKey) return false;
  const aMods = a.modifiers || {};
  const bMods = b.modifiers || {};
  const aKeys = Object.keys(aMods);
  const bKeys = Object.keys(bMods);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => aMods[key as keyof typeof aMods] === bMods[key as keyof typeof bMods]);
}

function matchesFilter(item: InventoryItem, templateKey?: string, filter?: Partial<InventoryFilter>): boolean {
  if (templateKey && item.templateKey !== templateKey) return false;
  if (filter?.categories && !filter.categories.includes(item.category)) return false;
  if (filter?.rarities && !filter.rarities.includes(item.rarity)) return false;
  if (filter?.binding && !filter.binding.includes(item.binding)) return false;
  if (filter?.nameContains && !item.templateKey.toLowerCase().includes(filter.nameContains.toLowerCase())) return false;
  return true;
}

export function stackItem(inventory: InventoryItem[], newItem: InventoryStack, category: ItemCategory, rarity: ItemRarity, binding: ItemBinding): InventoryItem[] {
  const existing = inventory.find(
    (item) => item.templateKey === newItem.templateKey && item.binding === binding && item.category === category
  );

  if (existing && existing.quantity < (existing.modifiers?.maxStack ?? 99)) {
    const remaining = newItem.quantity;
    const space = (existing.modifiers?.maxStack ?? 99) - existing.quantity;
    const toAdd = Math.min(remaining, space);

    existing.quantity += toAdd;
    existing.addedAt = Date.now();

    if (toAdd < remaining) {
      const leftover: InventoryItem = {
        ...newItem,
        quantity: remaining - toAdd,
        category,
        rarity,
        binding,
        ownerId: existing.ownerId,
        addedAt: Date.now(),
      };
      inventory.push(leftover);
    }

    return inventory;
  }

  const item: InventoryItem = {
    ...newItem,
    category,
    rarity,
    binding,
    addedAt: Date.now(),
  };

  return [...inventory, item];
}

export function addItemToInventory(
  inventory: InventoryItem[],
  item: InventoryStack,
  template: ItemTemplate,
  binding: ItemBinding = 'tradeable',
  ownerId?: string
): { inventory: InventoryItem[]; added: boolean; reason?: string } {
  const category = getItemCategory(template);
  const rarity = getItemRarity(template.rarity);

  if (template.stackable === false) {
    const newItem: InventoryItem = {
      ...item,
      category,
      rarity,
      binding,
      ownerId,
      addedAt: Date.now(),
    };
    return { inventory: [...inventory, newItem], added: true };
  }

  const existing = inventory.find(
    (i) => i.templateKey === item.templateKey && i.binding === binding && i.category === category
  );

  if (existing && existing.quantity < (template.maxStack || 99)) {
    const remaining = item.quantity;
    const space = (template.maxStack || 99) - existing.quantity;
    const toAdd = Math.min(remaining, space);

    existing.quantity += toAdd;
    existing.addedAt = Date.now();

    if (toAdd < remaining) {
      const leftover: InventoryItem = {
        ...item,
        quantity: remaining - toAdd,
        category,
        rarity,
        binding,
        ownerId,
        addedAt: Date.now(),
      };
      return { inventory: [...inventory, leftover], added: true };
    }

    return { inventory, added: true };
  }

  const cappedQuantity = Math.min(item.quantity, template.maxStack || 99);
  const newItem: InventoryItem = {
    ...item,
    quantity: cappedQuantity,
    category,
    rarity,
    binding,
    ownerId,
    addedAt: Date.now(),
  };

  return { inventory: [...inventory, newItem], added: true };
}

export function removeItemFromInventory(
  inventory: InventoryItem[],
  templateKey: string,
  quantity: number,
  filter?: Partial<InventoryFilter>
): { inventory: InventoryItem[]; removed: boolean; remaining: number } {
  let remainingToRemove = quantity;
  const result = [...inventory];

  const candidates = filter
    ? result.filter((item) => matchesFilter(item, templateKey, filter))
    : result.filter((item) => item.templateKey === templateKey);

  for (let i = 0; i < candidates.length && remainingToRemove > 0; i++) {
    const candidate = candidates[i];
    const idx = result.findIndex((item) => item === candidate);
    if (idx === -1) continue;

    if (result[idx]!.quantity <= remainingToRemove) {
      remainingToRemove -= result[idx]!.quantity;
      result.splice(idx, 1);
    } else {
      result[idx]!.quantity -= remainingToRemove;
      remainingToRemove = 0;
    }
  }

  return { inventory: result, removed: remainingToRemove === 0, remaining: remainingToRemove };
}

export function hasItem(inventory: InventoryItem[], templateKey: string, quantity: number = 1, filter?: Partial<InventoryFilter>): boolean {
  const count = getItemCount(inventory, templateKey, filter);
  return count >= quantity;
}

export function getItemCount(inventory: InventoryItem[], templateKey: string, filter?: Partial<InventoryFilter>): number {
  return inventory
    .filter((item) => matchesFilter(item, templateKey, filter))
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function sortInventory(inventory: InventoryItem[], sortBy: InventorySortKey = 'category', order: InventorySortOrder = 'asc'): InventoryItem[] {
  const sorted = [...inventory].sort((a, b) => {
    let cmp = 0;

    switch (sortBy) {
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
      case 'rarity':
        cmp = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
        break;
      case 'name':
        cmp = a.templateKey.localeCompare(b.templateKey);
        break;
      case 'quantity':
        cmp = a.quantity - b.quantity;
        break;
      case 'addedAt':
        cmp = a.addedAt - b.addedAt;
        break;
    }

    return order === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

export function filterInventory(inventory: InventoryItem[], filter: InventoryFilter): InventoryItem[] {
  return inventory.filter((item) => matchesFilter(item, undefined, filter));
}

export function getInventoryByCategory(inventory: InventoryItem[]): Record<ItemCategory, InventoryItem[]> {
  return inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category]!.push(item);
    return acc;
  }, {} as Record<ItemCategory, InventoryItem[]>);
}

export function canTradeItem(item: InventoryItem): boolean {
  return item.binding === 'tradeable' || item.binding === 'marketable';
}

export function bindItem(inventory: InventoryItem[], itemId: string): InventoryItem[] {
  return inventory.map((item) => {
    const isMatch = item.templateKey === itemId || item.addedAt.toString() === itemId;
    if (isMatch) {
      return { ...item, binding: 'bound' as ItemBinding };
    }
    return item;
  });
}

export function getInventoryCapacity(stats: PlayerSecondaryStats): number {
  return Math.floor(stats.inventoryCapacity);
}

export function isInventoryFull(inventory: InventoryItem[], stats: PlayerSecondaryStats, newItemTemplate?: ItemTemplate): boolean {
  const currentStacks = inventory.length;
  const capacity = getInventoryCapacity(stats);

  if (newItemTemplate) {
    const existingStack = inventory.find((i) => i.templateKey === newItemTemplate.key && i.quantity < (newItemTemplate.maxStack || 99));
    if (existingStack) {
      return false;
    }
  }

  return currentStacks >= capacity;
}

export function getUniqueItemCount(inventory: InventoryItem[]): number {
  return inventory.length;
}

export function getTotalItemCount(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + item.quantity, 0);
}

export function serializeInventory(inventory: InventoryItem[]): InventoryStack[] {
  return inventory.map((item) => ({
    templateKey: item.templateKey,
    quantity: item.quantity,
    modifiers: item.modifiers,
  }));
}

export function deserializeInventory(
  stacks: InventoryStack[],
  bindNewItems: boolean = false
): InventoryItem[] {
  return stacks.map((stack) => ({
    ...stack,
    category: 'material' as ItemCategory,
    rarity: 'common' as ItemRarity,
    binding: bindNewItems ? 'bound' : 'tradeable',
    addedAt: Date.now(),
  }));
}

export function migrateLegacyInventory(inventory: InventoryStack[]): InventoryItem[] {
  return deserializeInventory(inventory, true);
}

export function getDefaultInventory(): InventoryItem[] {
  return [];
}

export function createStartingInventory(classId: string): InventoryItem[] {
  const items: { templateKey: string; quantity: number }[] = [
    { templateKey: 'healing_herb', quantity: 5 },
    { templateKey: 'mana_crystal', quantity: 2 },
    { templateKey: 'basic_food', quantity: 3 },
  ];

  if (classId === 'trader' || classId === 'alchemist') {
    items.push({ templateKey: 'essence', quantity: 3 });
  }
  if (classId === 'summoner' || classId === 'elementalist' || classId === 'ritualist') {
    items.push({ templateKey: 'soul_crystal_common', quantity: 3 });
  }
  if (classId === 'pvp' || classId === 'duelist') {
    items.push({ templateKey: 'healing_herb', quantity: 5 });
  }
  if (classId === 'pve' || classId === 'warden') {
    items.push({ templateKey: 'mana_crystal', quantity: 3 });
  }

  return items.map((item) => ({
    ...item,
    category: getItemCategory({ key: item.templateKey, name: item.templateKey, type: 'material', rarity: 0, stackable: true, maxStack: 99, description: '' }),
    rarity: 'common' as ItemRarity,
    binding: 'tradeable' as ItemBinding,
    addedAt: Date.now(),
  }));
}

export function mergeInventories(a: InventoryItem[], b: InventoryItem[]): InventoryItem[] {
  const merged = [...a];

  for (const item of b) {
    const existing = merged.find((i) => i.templateKey === item.templateKey && i.binding === item.binding && i.category === item.category);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.push({ ...item });
    }
  }

  return merged;
}

export function splitStack(
  inventory: InventoryItem[],
  templateKey: string,
  quantity: number,
  filter?: Partial<InventoryFilter>
): { inventory: InventoryItem[]; newStack: InventoryItem | null } {
  const candidates = inventory.filter((item) => {
    if (item.templateKey !== templateKey) return false;
    if (item.quantity < quantity) return false;
    if (filter) return matchesFilter(item, templateKey, filter);
    return true;
  });

  if (candidates.length === 0) {
    return { inventory, newStack: null };
  }

  const target = candidates[0]!;
  const idx = inventory.indexOf(target);
  const updatedInventory = [...inventory];

  if (updatedInventory[idx]!.quantity === quantity) {
    return { inventory, newStack: null };
  }

  updatedInventory[idx]!.quantity -= quantity;

  const newStack: InventoryItem = {
    ...target,
    quantity,
    addedAt: Date.now(),
  };

  return { inventory: updatedInventory, newStack };
}

export function clearInventory(inventory: InventoryItem[]): InventoryItem[] {
  return [];
}

export function pruneInvalidItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((item) => item.quantity > 0 && item.templateKey && item.category);
}
