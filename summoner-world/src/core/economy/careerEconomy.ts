import type { CareerSystemBonuses } from '../../data/careerTreeIntegration';

export const MAX_SELLING_PRICE_BONUS_PCT = 50;
export const MAX_TARIFF_DISCOUNT_PCT = 75;
export const MAX_TAX_REVENUE_BONUS_PCT = 100;
export const MIN_HOUSING_TAX_RATE_PCT = 0;
export const MAX_HOUSING_TAX_RATE_PCT = 50;

export function applySellingPriceBonus(
  basePrice: number,
  bonuses: CareerSystemBonuses | undefined
): number {
  if (basePrice <= 0) return Math.max(0, basePrice);
  const pct = Math.min(MAX_SELLING_PRICE_BONUS_PCT, bonuses?.selling_price_pct ?? 0);
  if (pct === 0) return Math.floor(basePrice);
  return Math.max(1, Math.floor(basePrice * (1 + pct / 100)));
}

export function applyCaravanTariffDiscount(
  baseTaxRatePct: number,
  bonuses: CareerSystemBonuses | undefined
): number {
  const discount = Math.min(MAX_TARIFF_DISCOUNT_PCT, bonuses?.tariff_discount_pct ?? 0);
  if (discount === 0) return baseTaxRatePct;
  const next = baseTaxRatePct * (1 - discount / 100);
  return Math.max(0, Math.floor(next));
}

export function applySettlementTaxRevenueBonus(
  baseTaxAmount: number,
  bonuses: CareerSystemBonuses | undefined
): number {
  if (baseTaxAmount <= 0) return Math.max(0, baseTaxAmount);
  const pct = Math.min(MAX_TAX_REVENUE_BONUS_PCT, bonuses?.tax_revenue_pct ?? 0);
  if (pct === 0) return Math.floor(baseTaxAmount);
  return Math.max(0, Math.floor(baseTaxAmount * (1 + pct / 100)));
}

export function adjustHousingTaxRate(
  baseTaxRatePct: number,
  bonuses: CareerSystemBonuses | undefined
): number {
  const adjusted = applySettlementTaxRevenueBonus(baseTaxRatePct, bonuses);
  return Math.min(MAX_HOUSING_TAX_RATE_PCT, Math.max(MIN_HOUSING_TAX_RATE_PCT, adjusted));
}

export function applyMissionSpeedBonuses(
  baseDurationSeconds: number,
  bonuses: CareerSystemBonuses | undefined
): number {
  if (baseDurationSeconds <= 0) return baseDurationSeconds;
  const caravanPct = Math.max(0, bonuses?.caravan_speed_pct ?? 0);
  const trafficPct = Math.max(0, bonuses?.store_traffic_pct ?? 0);
  const bestPct = Math.max(caravanPct, trafficPct);
  if (bestPct === 0) return baseDurationSeconds;
  const reduction = Math.min(0.9, bestPct / 100);
  return Math.max(60, Math.floor(baseDurationSeconds * (1 - reduction)));
}
