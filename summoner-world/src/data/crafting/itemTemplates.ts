import type { ItemTemplate } from '../../types/game.ts';

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  wood: { key: 'wood', name: 'Wood', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Basic crafting material.' },
  stone: { key: 'stone', name: 'Stone', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Basic crafting material.' },
  ore: { key: 'ore', name: 'Ore', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Basic crafting material.' },
  herbs: { key: 'herbs', name: 'Herbs', type: 'material', subtype: 'herb', rarity: 0, stackable: true, maxStack: 99, description: 'Basic crafting material.' },
  crystal: { key: 'crystal', name: 'Crystal', type: 'material', subtype: 'crystal', rarity: 1, stackable: true, maxStack: 99, description: 'Intermediate crafting material.' },
  essence: { key: 'essence', name: 'Essence', type: 'material', subtype: 'essence', rarity: 1, stackable: true, maxStack: 99, description: 'Intermediate crafting material.' },
  wooden_plank: { key: 'wooden_plank', name: 'Wooden Plank', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Crafted from wood.' },
  stone_brick: { key: 'stone_brick', name: 'Stone Brick', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Crafted from stone.' },
  coin: { key: 'coin', name: 'Simple Coin', type: 'material', rarity: 0, stackable: true, maxStack: 99, description: 'Basic currency.' },
  iron_ingot: { key: 'iron_ingot', name: 'Iron Ingot', type: 'material', rarity: 1, stackable: true, maxStack: 99, description: 'Intermediate crafting material.' },
  healing_salve: { key: 'healing_salve', name: 'Healing Salve', type: 'consumable', rarity: 1, stackable: true, maxStack: 99, description: 'Restores health.' },
  mana_vial: { key: 'mana_vial', name: 'Mana Vial', type: 'consumable', rarity: 1, stackable: true, maxStack: 99, description: 'Restores mana.' },
  elemental_catalyst: { key: 'elemental_catalyst', name: 'Elemental Catalyst', type: 'material', subtype: 'crystal', rarity: 2, stackable: true, maxStack: 99, description: 'Advanced crafting material.' },
  legendary_ingot: { key: 'legendary_ingot', name: 'Legendary Ingot', type: 'material', rarity: 4, stackable: true, maxStack: 99, description: 'Advanced crafting material.' },
  forgemasters_crown: { key: 'forgemasters_crown', name: 'Forge Master\'s Crown', type: 'equipment', rarity: 5, stackable: false, maxStack: 1, description: 'A legendary artifact crafted by master smiths.' },
};

export function getItemTemplate(templateKey: string): ItemTemplate | undefined {
  return ITEM_TEMPLATES[templateKey];
}
