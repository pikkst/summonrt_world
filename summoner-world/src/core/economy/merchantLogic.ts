import { getBasePrice } from './settlementLedger';

export const MERCHANT_BUY_PRICE_FACTOR = 0.6;
export const MERCHANT_SELL_PRICE_FACTOR = 1.2;
export const MERCHANT_UNDERCUT_PENALTY = 0.9;
export const MERCHANT_MIN_PRICE_FACTOR = 0.3;
export const DEFAULT_MERCHANT_RESTOCK_RATE = 2;
export const DEFAULT_MERCHANT_MAX_STOCK = 20;
export const DEFAULT_MERCHANT_CASH_RESERVE = 200;
export const MERCHANT_CASH_REGEN_PER_TURN = 5;

export type MerchantBuyResult =
  | { accepted: true; state: MerchantState; quantity: number; cashSpent: number; undercutApplied: boolean }
  | { accepted: false; state: MerchantState; reason: 'unknown_good' | 'no_supply_room' | 'insufficient_cash' | 'invalid_price' | 'invalid_quantity' };

export type MerchantSellResult =
  | { accepted: true; state: MerchantState; quantity: number; cashGained: number }
  | { accepted: false; state: MerchantState; reason: 'unknown_good' | 'out_of_stock' };

export interface MerchantStockEntry {
  goodKey: string;
  stock: number;
  maxStock: number;
  buyPrice: number;
  sellPrice: number;
  restockRate: number;
  lastRestockTurn: number;
  basePrice: number;
  undercutCount: number;
}

export interface MerchantState {
  id: string;
  cashReserve: number;
  maxCashReserve: number;
  stock: Record<string, MerchantStockEntry>;
  lastRestockTurn: number;
}

export interface MerchantGoodConfig {
  goodKey: string;
  basePrice?: number;
  maxStock?: number;
  restockRate?: number;
}

export interface MerchantConfig {
  id: string;
  cashReserve?: number;
  maxCashReserve?: number;
  goods: MerchantGoodConfig[];
}

function applyUndercutPenalty(entry: MerchantStockEntry): MerchantStockEntry {
  const newBuy = Math.max(1, Math.floor(entry.buyPrice * MERCHANT_UNDERCUT_PENALTY));
  const newSell = Math.max(1, Math.floor(entry.sellPrice * MERCHANT_UNDERCUT_PENALTY));
  const minBuy = Math.max(1, Math.floor(entry.basePrice * MERCHANT_MIN_PRICE_FACTOR));
  const minSell = Math.max(1, Math.floor(entry.basePrice * MERCHANT_MIN_PRICE_FACTOR));
  return {
    ...entry,
    buyPrice: Math.max(minBuy, newBuy),
    sellPrice: Math.max(minSell, newSell),
    undercutCount: entry.undercutCount + 1,
  };
}

export function createMerchant(config: MerchantConfig): MerchantState {
  const maxCashReserve = config.maxCashReserve ?? DEFAULT_MERCHANT_CASH_RESERVE;
  const cashReserve = Math.min(config.cashReserve ?? maxCashReserve, maxCashReserve);
  const stock: Record<string, MerchantStockEntry> = {};

  for (const good of config.goods) {
    const basePrice = good.basePrice ?? getBasePrice(good.goodKey);
    const maxStock = good.maxStock ?? DEFAULT_MERCHANT_MAX_STOCK;
    const restockRate = good.restockRate ?? DEFAULT_MERCHANT_RESTOCK_RATE;
    stock[good.goodKey] = {
      goodKey: good.goodKey,
      stock: 0,
      maxStock,
      buyPrice: Math.max(1, Math.floor(basePrice * MERCHANT_BUY_PRICE_FACTOR)),
      sellPrice: Math.max(1, Math.floor(basePrice * MERCHANT_SELL_PRICE_FACTOR)),
      restockRate,
      lastRestockTurn: 0,
      basePrice,
      undercutCount: 0,
    };
  }

  return {
    id: config.id,
    cashReserve,
    maxCashReserve,
    stock,
    lastRestockTurn: 0,
  };
}

export function restockMerchant(state: MerchantState, turnsElapsed: number): MerchantState {
  if (turnsElapsed <= 0) return state;

  const stock: Record<string, MerchantStockEntry> = {};
  for (const key of Object.keys(state.stock)) {
    const entry = state.stock[key];
    if (!entry) continue;
    const added = entry.restockRate * turnsElapsed;
    stock[key] = {
      ...entry,
      stock: Math.min(entry.maxStock, entry.stock + added),
      lastRestockTurn: state.lastRestockTurn + turnsElapsed,
    };
  }

  const regeneratedCash = MERCHANT_CASH_REGEN_PER_TURN * turnsElapsed;
  const cashReserve = Math.min(state.maxCashReserve, state.cashReserve + regeneratedCash);

  return {
    ...state,
    stock,
    cashReserve,
    lastRestockTurn: state.lastRestockTurn + turnsElapsed,
  };
}

export function merchantBuyFromPlayer(state: MerchantState, goodKey: string, quantity: number, unitPrice: number): MerchantBuyResult {
  const entry = state.stock[goodKey];
  if (!entry) {
    return { accepted: false, state, reason: 'unknown_good' };
  }

  if (quantity <= 0) {
    return { accepted: false, state, reason: 'invalid_quantity' };
  }

  if (unitPrice <= 0 || unitPrice > entry.sellPrice) {
    return { accepted: false, state, reason: 'invalid_price' };
  }

  const supplyRoom = entry.maxStock - entry.stock;
  if (supplyRoom <= 0) {
    return { accepted: false, state, reason: 'no_supply_room' };
  }

  const cashAffordable = Math.floor(state.cashReserve / unitPrice);
  const desired = Math.min(quantity, supplyRoom, cashAffordable);
  if (desired <= 0) {
    return { accepted: false, state, reason: 'insufficient_cash' };
  }

  const isUndercut = unitPrice < entry.buyPrice;
  let updatedEntry: MerchantStockEntry = {
    ...entry,
    stock: entry.stock + desired,
  };
  if (isUndercut) {
    updatedEntry = applyUndercutPenalty(updatedEntry);
  }

  const cashSpent = desired * unitPrice;
  const nextState: MerchantState = {
    ...state,
    cashReserve: state.cashReserve - cashSpent,
    stock: { ...state.stock, [goodKey]: updatedEntry },
  };

  return { accepted: true, state: nextState, quantity: desired, cashSpent, undercutApplied: isUndercut };
}

export function merchantSellToPlayer(state: MerchantState, goodKey: string, quantity: number, unitPrice?: number): MerchantSellResult {
  const entry = state.stock[goodKey];
  if (!entry) {
    return { accepted: false, state, reason: 'unknown_good' };
  }

  const available = Math.min(quantity, entry.stock);
  if (available <= 0) {
    return { accepted: false, state, reason: 'out_of_stock' };
  }

  const price = unitPrice ?? entry.sellPrice;
  const cashGained = available * price;
  const nextState: MerchantState = {
    ...state,
    cashReserve: Math.min(state.maxCashReserve, state.cashReserve + cashGained),
    stock: {
      ...state.stock,
      [goodKey]: { ...entry, stock: entry.stock - available },
    },
  };

  return { accepted: true, state: nextState, quantity: available, cashGained };
}

export function getMerchantStock(state: MerchantState, goodKey: string): MerchantStockEntry | undefined {
  return state.stock[goodKey];
}
