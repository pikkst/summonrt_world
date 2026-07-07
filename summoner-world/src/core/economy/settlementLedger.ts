import type { Settlement, SettlementType } from '../../types/game.ts';
import { ITEM_TEMPLATES } from '../../data/crafting/itemTemplates.ts';

export type GoodCategory = 'raw_material' | 'refined_material' | 'consumable' | 'food' | 'reagent' | 'trade_good';

export interface GoodsLedgerEntry {
  goodKey: string;
  category: GoodCategory;
  basePrice: number;
  supply: number;
  demand: number;
  currentPrice: number;
}

export interface SettlementEconomyState {
  settlementId: string;
  ledger: Record<string, GoodsLedgerEntry>;
  lastTickTurn: number;
}

const GOOD_CATEGORY_MAP: Record<string, GoodCategory> = {
  wood: 'raw_material',
  stone: 'raw_material',
  ore: 'raw_material',
  herbs: 'raw_material',
  crystal: 'refined_material',
  essence: 'refined_material',
  wooden_plank: 'refined_material',
  stone_brick: 'refined_material',
  iron_ingot: 'refined_material',
  basic_food: 'food',
  healing_salve: 'consumable',
  mana_vial: 'consumable',
  elemental_catalyst: 'reagent',
  legendary_ingot: 'trade_good',
  forgemasters_crown: 'trade_good',
  coin: 'trade_good',
};

const SETTLEMENT_TYPE_DEMAND: Record<SettlementType, number> = {
  city: 15,
  fort: 8,
  village: 10,
  settlement: 10,
  outpost: 6,
};

const SETTLEMENT_TYPE_SUPPLY: Record<SettlementType, number> = {
  city: 12,
  fort: 10,
  village: 8,
  settlement: 9,
  outpost: 5,
};

const CATEGORY_DEMAND_BONUS: Record<GoodCategory, number> = {
  raw_material: 0,
  refined_material: 1,
  consumable: 2,
  food: 3,
  reagent: 1,
  trade_good: 0,
};

export function getGoodCategory(templateKey: string): GoodCategory {
  return GOOD_CATEGORY_MAP[templateKey] || 'trade_good';
}

export function getBasePrice(templateKey: string): number {
  const template = ITEM_TEMPLATES[templateKey];
  if (!template) return 10;
  const rarityMod = 1 + template.rarity * 0.5;
  return Math.max(1, Math.floor(10 * rarityMod));
}

export function createSettlementLedger(settlementId: string): SettlementEconomyState {
  return {
    settlementId,
    ledger: {},
    lastTickTurn: 0,
  };
}

export function initializeSettlementGoods(
  state: SettlementEconomyState,
  goods: Array<{ key: string; basePrice: number }>
): SettlementEconomyState {
  const ledger: Record<string, GoodsLedgerEntry> = {};
  for (const good of goods) {
    ledger[good.key] = {
      goodKey: good.key,
      category: getGoodCategory(good.key),
      basePrice: good.basePrice,
      supply: 10,
      demand: 10,
      currentPrice: good.basePrice,
    };
  }
  return {
    ...state,
    ledger,
  };
}

export function calculateGoodsPrice(basePrice: number, demand: number, supply: number, elasticity: number = 0.1): number {
  if (basePrice <= 0) return 1;
  const factor = 1 + elasticity * (demand - supply);
  return Math.max(1, Math.floor(basePrice * factor));
}

export function calculateSettlementSupply(
  settlement: Settlement,
  category: GoodCategory,
  turnCount: number
): number {
  const base = SETTLEMENT_TYPE_SUPPLY[settlement.type] || 8;
  const worldBonus = settlement.worldId * 0.5;
  const timeOscillation = Math.sin(turnCount * 0.1) * 2;
  return Math.max(1, Math.floor(base + worldBonus + timeOscillation));
}

export function calculateSettlementDemand(
  settlement: Settlement,
  category: GoodCategory,
  turnCount: number
): number {
  const base = SETTLEMENT_TYPE_DEMAND[settlement.type] || 8;
  const categoryBonus = CATEGORY_DEMAND_BONUS[category] || 0;
  const timeOscillation = Math.cos(turnCount * 0.1) * 2;
  return Math.max(1, Math.floor(base + categoryBonus + timeOscillation));
}

export function tickSettlementEconomy(
  state: SettlementEconomyState,
  settlement: Settlement,
  turnsElapsed: number,
  goods: Array<{ key: string; basePrice: number }>,
  rng?: () => number
): SettlementEconomyState {
  if (turnsElapsed <= 0) return state;

  const ledger = { ...state.ledger };
  const targetTurn = state.lastTickTurn + turnsElapsed;

  for (const good of goods) {
    const existing = ledger[good.key];
    const basePrice = existing ? existing.basePrice : (good.basePrice ?? getBasePrice(good.key));
    const category = existing ? existing.category : getGoodCategory(good.key);

    let supply = calculateSettlementSupply(settlement, category, targetTurn);
    let demand = calculateSettlementDemand(settlement, category, targetTurn);

    if (rng) {
      supply = Math.max(1, supply + Math.round((rng() - 0.5) * 2));
      demand = Math.max(1, demand + Math.round((rng() - 0.5) * 2));
    }

    const currentPrice = calculateGoodsPrice(basePrice, demand, supply);

    ledger[good.key] = {
      goodKey: good.key,
      category,
      basePrice,
      supply,
      demand,
      currentPrice,
    };
  }

  return {
    ...state,
    ledger,
    lastTickTurn: targetTurn,
  };
}
