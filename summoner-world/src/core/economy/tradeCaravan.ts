import { SeededRandom } from '../../utils/SeededRandom';
import { ITEM_TEMPLATES } from '../../data/crafting/itemTemplates';
import type { CareerSystemBonuses } from '../../data/careerTreeIntegration';
import { applyCaravanTariffDiscount } from './careerEconomy';
import type { InventoryStack } from '../../types/game';

export const CARAVAN_BASE_DURATION_SECONDS = 4 * 60 * 60;
export const CARAVAN_MIN_DURATION_SECONDS = 60;
export const CARAVAN_CAPACITY = 20;
export const CARAVAN_TAX_RATE_PCT = 10;
export const CARAVAN_PROFIT_SHARE_PCT = 70;
export const ARBITRAGE_MIN_DISTANCE = 10;
export const ARBITRAGE_MIN_PROFIT_PCT = 5;

export type TradeCaravanStatus = 'preparing' | 'departed' | 'arrived' | 'completed' | 'failed';

export type GoodCategory = 'raw_material' | 'refined_material' | 'consumable' | 'food' | 'reagent' | 'trade_good';

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

export function getGoodCategory(templateKey: string): GoodCategory {
  return GOOD_CATEGORY_MAP[templateKey] || 'trade_good';
}

export function getBasePrice(templateKey: string): number {
  const template = ITEM_TEMPLATES[templateKey];
  if (!template) return 10;
  const rarityMod = 1 + template.rarity * 0.5;
  return Math.max(1, Math.floor(10 * rarityMod));
}

export interface TradeCaravan {
  caravanId: string;
  originWorldId: number;
  destinationWorldId: number;
  originSettlementId: string;
  destinationSettlementId: string;
  goods: InventoryStack[];
  totalBuyCost: number;
  totalSellRevenue: number;
  status: TradeCaravanStatus;
  createdAt: number;
  departedAt?: number;
  arrivedAt?: number;
  completedAt?: number;
  distance: number;
  profitPct: number;
}

export function getWorldPriceModifier(worldId: number, category: GoodCategory): number {
  const normalizedWorld = Math.max(1, Math.min(100, worldId));
  if (category === 'raw_material') {
    return 0.6 + (normalizedWorld / 100) * 0.8;
  }
  if (category === 'refined_material') {
    return 1.4 - (normalizedWorld / 100) * 0.8;
  }
  if (category === 'food' || category === 'consumable') {
    return 0.9 + (normalizedWorld / 100) * 0.2;
  }
  return 1.0;
}

export function getGoodsPriceForWorld(templateKey: string, worldId: number): number {
  const basePrice = getBasePrice(templateKey);
  const category = getGoodCategory(templateKey);
  const modifier = getWorldPriceModifier(worldId, category);
  return Math.max(1, Math.floor(basePrice * modifier));
}

export function createTradeCaravan(params: {
  seed: number;
  originWorldId: number;
  originSettlementId: string;
  destinationWorldId: number;
  destinationSettlementId: string;
  goods: InventoryStack[];
  totalBuyCost: number;
  totalSellRevenue: number;
}): TradeCaravan {
  const rng = new SeededRandom(params.seed);
  const now = Date.now();

  return {
    caravanId: `caravan_${params.seed}_${rng.int(1000, 9999)}`,
    originWorldId: params.originWorldId,
    destinationWorldId: params.destinationWorldId,
    originSettlementId: params.originSettlementId,
    destinationSettlementId: params.destinationSettlementId,
    goods: params.goods,
    totalBuyCost: params.totalBuyCost,
    totalSellRevenue: params.totalSellRevenue,
    status: 'preparing',
    createdAt: now,
    departedAt: now,
    distance: Math.abs(params.destinationWorldId - params.originWorldId),
    profitPct: params.totalBuyCost > 0 ? ((params.totalSellRevenue - params.totalBuyCost) / params.totalBuyCost) * 100 : 0,
  };
}

export function calculateCaravanProfit(
  originPrice: number,
  destinationPrice: number,
  quantity: number
): { buyCost: number; sellRevenue: number; profit: number; profitPct: number } {
  const buyCost = originPrice * quantity;
  const sellRevenue = destinationPrice * quantity;
  const profit = Math.max(0, sellRevenue - buyCost);
  const profitPct = buyCost > 0 ? (profit / buyCost) * 100 : 0;

  return {
    buyCost,
    sellRevenue,
    profit,
    profitPct,
  };
}

export function isArbitrageProfitable(
  originPrice: number,
  destinationPrice: number,
  quantity: number,
  distance: number
): boolean {
  if (originPrice <= 0 || destinationPrice <= 0) return false;
  if (quantity <= 0) return false;
  if (distance < ARBITRAGE_MIN_DISTANCE) return false;

  const { profitPct } = calculateCaravanProfit(originPrice, destinationPrice, quantity);
  return profitPct >= ARBITRAGE_MIN_PROFIT_PCT;
}

export function resolveCaravanTrade(
  caravan: TradeCaravan,
  applyTax: boolean = true,
  careerBonuses?: CareerSystemBonuses
): {
  profit: number;
  taxPaid: number;
  taxRatePct: number;
  netProfit: number;
  deliveredGoods: InventoryStack[];
  success: boolean;
} {
  if (caravan.goods.length === 0) {
    return { profit: 0, taxPaid: 0, taxRatePct: 0, netProfit: 0, deliveredGoods: [], success: false };
  }

  const profit = Math.max(0, caravan.totalSellRevenue - caravan.totalBuyCost);
  const effectiveTaxRatePct = applyTax
    ? applyCaravanTariffDiscount(CARAVAN_TAX_RATE_PCT, careerBonuses)
    : 0;
  const taxPaid = Math.floor((profit * effectiveTaxRatePct) / 100);
  const grossProfit = profit - taxPaid;
  const netProfit = Math.max(0, Math.floor((grossProfit * CARAVAN_PROFIT_SHARE_PCT) / 100));

  return {
    profit,
    taxPaid,
    taxRatePct: effectiveTaxRatePct,
    netProfit,
    deliveredGoods: caravan.goods,
    success: true,
  };
}

export function validateCaravanGoods(
  goods: InventoryStack[],
  capacity: number = CARAVAN_CAPACITY
): { valid: boolean; reason?: string } {
  if (!Array.isArray(goods)) {
    return { valid: false, reason: 'Goods must be an array' };
  }

  if (goods.length === 0) {
    return { valid: false, reason: 'Caravan must carry at least one good' };
  }

  const totalQuantity = goods.reduce((sum, item) => sum + (item.quantity || 0), 0);
  if (totalQuantity > capacity) {
    return { valid: false, reason: `Caravan capacity exceeded: ${totalQuantity} > ${capacity}` };
  }

  for (const item of goods) {
    if (!item.templateKey || item.templateKey.trim() === '') {
      return { valid: false, reason: 'All goods must have a templateKey' };
    }
    if (item.quantity <= 0) {
      return { valid: false, reason: `Invalid quantity for ${item.templateKey}` };
    }
  }

  return { valid: true };
}
