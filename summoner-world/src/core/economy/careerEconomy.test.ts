import { describe, expect, it } from 'vitest';
import {
  applySellingPriceBonus,
  applyCaravanTariffDiscount,
  applySettlementTaxRevenueBonus,
  adjustHousingTaxRate,
  applyMissionSpeedBonuses,
  MAX_SELLING_PRICE_BONUS_PCT,
  MAX_TARIFF_DISCOUNT_PCT,
  MAX_TAX_REVENUE_BONUS_PCT,
  MAX_HOUSING_TAX_RATE_PCT,
} from './careerEconomy';

describe('T8.15 - Career Passives -> Economy Integration', () => {
  describe('applySellingPriceBonus (Shopkeeper selling_price_pct)', () => {
    it('returns base price when no bonuses are present', () => {
      expect(applySellingPriceBonus(100, undefined)).toBe(100);
      expect(applySellingPriceBonus(100, {})).toBe(100);
    });

    it('scales price by selling_price_pct bonus', () => {
      const result = applySellingPriceBonus(100, { selling_price_pct: 10 });
      expect(result).toBe(110);
    });

    it('matches expected floor rounding for fractional bonuses', () => {
      expect(applySellingPriceBonus(100, { selling_price_pct: 15 })).toBe(114);
    });

    it('caps the bonus to the documented maximum', () => {
      const result = applySellingPriceBonus(100, { selling_price_pct: 200 });
      expect(result).toBe(Math.floor(100 * (1 + MAX_SELLING_PRICE_BONUS_PCT / 100)));
    });

    it('returns a floored integer result', () => {
      const result = applySellingPriceBonus(10, { selling_price_pct: 7 });
      expect(Number.isInteger(result)).toBe(true);
    });

    it('returns at least 1 for positive base prices', () => {
      expect(applySellingPriceBonus(1, { selling_price_pct: 200 })).toBeGreaterThanOrEqual(1);
    });

    it('does not raise non-positive base prices above zero', () => {
      expect(applySellingPriceBonus(0, { selling_price_pct: 50 })).toBe(0);
    });
  });

  describe('applyCaravanTariffDiscount (Broker tariff_discount_pct)', () => {
    it('returns the base tax rate when no bonuses are present', () => {
      expect(applyCaravanTariffDiscount(10, undefined)).toBe(10);
    });

    it('reduces the tax rate by tariff_discount_pct', () => {
      const result = applyCaravanTariffDiscount(10, { tariff_discount_pct: 20 });
      expect(result).toBe(8);
    });

    it('never reduces the tax rate below zero (with cap applied)', () => {
      const result = applyCaravanTariffDiscount(10, { tariff_discount_pct: 200 });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBe(applyCaravanTariffDiscount(10, { tariff_discount_pct: MAX_TARIFF_DISCOUNT_PCT }));
    });

    it('returns zero when the base tax rate is already zero', () => {
      expect(applyCaravanTariffDiscount(0, { tariff_discount_pct: 50 })).toBe(0);
    });

    it('caps the discount to the documented maximum', () => {
      const capped = applyCaravanTariffDiscount(10, { tariff_discount_pct: 200 });
      const max = applyCaravanTariffDiscount(10, { tariff_discount_pct: MAX_TARIFF_DISCOUNT_PCT });
      expect(capped).toBe(max);
    });
  });

  describe('applySettlementTaxRevenueBonus (Official tax_revenue_pct)', () => {
    it('returns the base tax when no bonuses are present', () => {
      expect(applySettlementTaxRevenueBonus(100, undefined)).toBe(100);
    });

    it('scales tax by tax_revenue_pct bonus', () => {
      const result = applySettlementTaxRevenueBonus(100, { tax_revenue_pct: 15 });
      expect(result).toBe(114);
    });

    it('caps the bonus to the documented maximum', () => {
      const result = applySettlementTaxRevenueBonus(100, { tax_revenue_pct: 500 });
      expect(result).toBe(Math.floor(100 * (1 + MAX_TAX_REVENUE_BONUS_PCT / 100)));
    });

    it('returns 0 for non-positive base tax', () => {
      expect(applySettlementTaxRevenueBonus(0, { tax_revenue_pct: 50 })).toBe(0);
    });
  });

  describe('adjustHousingTaxRate (Official settlement_tax_revenue_pct)', () => {
    it('uses HOUSING_TAX_RATE_PCT semantics with career bonus layered on top', () => {
      expect(adjustHousingTaxRate(10, { tax_revenue_pct: 20 })).toBe(12);
    });

    it('clamps the resulting tax rate within configured bounds', () => {
      const clamped = adjustHousingTaxRate(MAX_HOUSING_TAX_RATE_PCT, { tax_revenue_pct: 1000 });
      expect(clamped).toBeLessThanOrEqual(MAX_HOUSING_TAX_RATE_PCT);
    });

    it('keeps the rate at zero when bonuses push it to negative', () => {
      expect(adjustHousingTaxRate(10, { tax_revenue_pct: -1000 })).toBe(0);
    });
  });

  describe('applyMissionSpeedBonuses (caravan_speed_pct / store_traffic_pct)', () => {
    it('returns base duration when no bonuses are present', () => {
      expect(applyMissionSpeedBonuses(3600, undefined)).toBe(3600);
      expect(applyMissionSpeedBonuses(3600, {})).toBe(3600);
    });

    it('compresses duration using caravan_speed_pct', () => {
      const result = applyMissionSpeedBonuses(3600, { caravan_speed_pct: 25 });
      expect(result).toBeLessThan(3600);
      expect(result).toBe(Math.max(60, Math.floor(3600 * 0.75)));
    });

    it('compresses duration using store_traffic_pct', () => {
      const result = applyMissionSpeedBonuses(3600, { store_traffic_pct: 50 });
      expect(result).toBe(Math.max(60, Math.floor(3600 * 0.5)));
    });

    it('uses the larger of the two speed bonuses', () => {
      const result = applyMissionSpeedBonuses(3600, {
        caravan_speed_pct: 10,
        store_traffic_pct: 30,
      });
      expect(result).toBe(Math.max(60, Math.floor(3600 * 0.7)));
    });

    it('clamps the reduction to a maximum of 90%', () => {
      const result = applyMissionSpeedBonuses(3600, { caravan_speed_pct: 500 });
      // 3600 * 0.1 in floating point yields 359.9999..., so the floor is 359.
      expect(result).toBeLessThanOrEqual(360);
      expect(result).toBeGreaterThanOrEqual(60);
    });

    it('never returns a duration lower than the 60s floor', () => {
      const result = applyMissionSpeedBonuses(30, { caravan_speed_pct: 500 });
      expect(result).toBe(60);
    });
  });
});
