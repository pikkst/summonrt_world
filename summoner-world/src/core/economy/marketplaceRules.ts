import type { ItemBinding, ItemRarity, InventoryItem, CreatureContract } from '../../types/playerCore.ts';

export type MarketValidationResult =
  | { valid: true }
  | { valid: false; reason: MarketValidationReason };

export type MarketValidationReason =
  | 'bound_items_cannot_be_listed'
  | 'insufficient_level_for_rarity'
  | 'price_too_low'
  | 'price_too_high'
  | 'contract_is_bound'
  | 'insufficient_contract_stability'
  | 'insufficient_bond_level'
  | 'fraud_suspicious_price'
  | 'fraud_too_many_duplicate_listings'
  | 'fraud_quantity_too_low';

export const BASE_LISTING_FEE = 10;
export const BASE_TRADE_TAX_PCT = 5;
export const MAX_TRADE_TAX_PCT = 20;
export const MIN_LISTING_PRICE = 1;
export const MAX_LISTING_PRICE_FACTOR = 10;
export const FRAUD_MIN_LISTING_QUANTITY = 1;
export const FRAUD_MAX_DUPLICATE_LISTINGS = 3;

export const RARITY_LISTING_FEE_MULTIPLIER: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 1,
  rare: 1.5,
  epic: 2,
  legendary: 5,
  mythical: 10,
};

export const RARITY_LEVEL_REQUIREMENT: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 1,
  rare: 5,
  epic: 15,
  legendary: 30,
  mythical: 50,
};

export function canListItemOnMarketplace(item: InventoryItem, playerLevel: number): MarketValidationResult {
  if (item.binding === 'bound') {
    return { valid: false, reason: 'bound_items_cannot_be_listed' };
  }
  return canListItemByRarity(item.rarity, playerLevel);
}

export function canListItemByRarity(rarity: ItemRarity, playerLevel: number): MarketValidationResult {
  const levelReq = RARITY_LEVEL_REQUIREMENT[rarity];
  if (playerLevel < levelReq) {
    return { valid: false, reason: 'insufficient_level_for_rarity' };
  }
  return { valid: true };
}

export interface RarityListingRestrictions {
  rarity: ItemRarity;
  levelRequirement: number;
  listingFeeMultiplier: number;
}

export function getRarityListingRestrictions(rarity: ItemRarity): RarityListingRestrictions {
  return {
    rarity,
    levelRequirement: RARITY_LEVEL_REQUIREMENT[rarity],
    listingFeeMultiplier: RARITY_LISTING_FEE_MULTIPLIER[rarity],
  };
}

export function calculateListingFee(rarity: ItemRarity): number {
  const multiplier = RARITY_LISTING_FEE_MULTIPLIER[rarity] ?? 1;
  return Math.max(1, Math.floor(BASE_LISTING_FEE * multiplier));
}

export function calculateTradeTax(salePrice: number): number {
  if (salePrice <= 0) return 0;
  const tax = Math.floor(salePrice * BASE_TRADE_TAX_PCT / 100);
  return Math.min(tax, Math.floor(salePrice * MAX_TRADE_TAX_PCT / 100));
}

export function getTradeTaxRatePct(): number {
  return BASE_TRADE_TAX_PCT;
}

export function validateListingPrice(basePrice: number, listingPrice: number): MarketValidationResult {
  if (listingPrice < MIN_LISTING_PRICE) {
    return { valid: false, reason: 'price_too_low' };
  }
  const effectiveBasePrice = Math.max(basePrice, MIN_LISTING_PRICE);
  if (listingPrice > effectiveBasePrice * MAX_LISTING_PRICE_FACTOR) {
    return { valid: false, reason: 'price_too_high' };
  }
  return { valid: true };
}

export interface FraudCheckInput {
  item: InventoryItem;
  basePrice: number;
  listingPrice: number;
  quantity: number;
  existingListingsFromSameItem: number;
}

export interface FraudCheckResult {
  passed: boolean;
  warnings: MarketValidationReason[];
}

export function runFraudPreventionChecks(input: FraudCheckInput): FraudCheckResult {
  const warnings: MarketValidationReason[] = [];

  const priceCheck = validateListingPrice(input.basePrice, input.listingPrice);
  if (!priceCheck.valid) {
    warnings.push(priceCheck.reason);
  }

  if (input.quantity < FRAUD_MIN_LISTING_QUANTITY) {
    warnings.push('fraud_quantity_too_low');
  }

  if (input.existingListingsFromSameItem > FRAUD_MAX_DUPLICATE_LISTINGS) {
    warnings.push('fraud_too_many_duplicate_listings');
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
}

export function canListContractOnMarketplace(contract: CreatureContract, playerLevel: number): MarketValidationResult {
  if (contract.tradeStatus === 'bound') {
    return { valid: false, reason: 'contract_is_bound' };
  }
  if (contract.contractStability < 30) {
    return { valid: false, reason: 'insufficient_contract_stability' };
  }
  if (contract.bondLevel < 10) {
    return { valid: false, reason: 'insufficient_bond_level' };
  }
  return { valid: true };
}
