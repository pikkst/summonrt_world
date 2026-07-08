import { describe, expect, it } from 'vitest';
import {
  BASE_LISTING_FEE,
  BASE_TRADE_TAX_PCT,
  MAX_TRADE_TAX_PCT,
  MIN_LISTING_PRICE,
  MAX_LISTING_PRICE_FACTOR,
  FRAUD_MIN_LISTING_QUANTITY,
  FRAUD_MAX_DUPLICATE_LISTINGS,
  RARITY_LISTING_FEE_MULTIPLIER,
  RARITY_LEVEL_REQUIREMENT,
  canListItemOnMarketplace,
  canListItemByRarity,
  getRarityListingRestrictions,
  calculateListingFee,
  calculateTradeTax,
  getTradeTaxRatePct,
  validateListingPrice,
  runFraudPreventionChecks,
  canListContractOnMarketplace,
} from './marketplaceRules';
import type { InventoryItem, CreatureContract } from '../../types/playerCore.ts';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    templateKey: 'test_item',
    quantity: 1,
    category: 'material',
    rarity: 'common',
    binding: 'tradeable',
    addedAt: Date.now(),
    ...overrides,
  };
}

function makeContract(overrides: Partial<CreatureContract> = {}): CreatureContract {
  return {
    id: 'contract-1',
    templateKey: 'companion',
    bondLevel: 20,
    trust: 50,
    loyalty: 50,
    contractStability: 80,
    elementCompatibility: 100,
    commandPermissions: ['follow', 'attack'],
    tradeStatus: 'tradeable',
    breedingRights: false,
    pvpEligibility: false,
    contractedAt: Date.now(),
    instance: {
      id: 'creature-1',
      templateKey: 'companion',
      level: 10,
      experience: 0n,
      currentHealth: 100,
      currentMana: 50,
      maxHealth: 100,
      maxMana: 50,
      attack: 20,
      defense: 10,
      speed: 15,
      skills: [],
      traits: [],
      mutations: [],
      affection: 30,
    },
    ...overrides,
  };
}

describe('T8.18 - Marketplace rules from Player Core Bible', () => {
  describe('T8.18.1 - Binding restrictions', () => {
    it('rejects bound items from marketplace listing', () => {
      const item = makeItem({ binding: 'bound' });
      expect(canListItemOnMarketplace(item, 50).valid).toBe(false);
    });

    it('allows tradeable items on marketplace', () => {
      const item = makeItem({ binding: 'tradeable' });
      expect(canListItemOnMarketplace(item, 50).valid).toBe(true);
    });

    it('allows marketable items on marketplace', () => {
      const item = makeItem({ binding: 'marketable' });
      expect(canListItemOnMarketplace(item, 50).valid).toBe(true);
    });
  });

  describe('T8.18.2 - Rarity restrictions', () => {
    it('allows common items at level 1', () => {
      expect(canListItemByRarity('common', 1).valid).toBe(true);
    });

    it('requires level 5 for rare items', () => {
      expect(canListItemByRarity('rare', 4).valid).toBe(false);
      expect(canListItemByRarity('rare', 5).valid).toBe(true);
    });

    it('requires level 15 for epic items', () => {
      expect(canListItemByRarity('epic', 14).valid).toBe(false);
      expect(canListItemByRarity('epic', 15).valid).toBe(true);
    });

    it('requires level 30 for legendary items', () => {
      expect(canListItemByRarity('legendary', 29).valid).toBe(false);
      expect(canListItemByRarity('legendary', 30).valid).toBe(true);
    });

    it('requires level 50 for mythical items', () => {
      expect(canListItemByRarity('mythical', 49).valid).toBe(false);
      expect(canListItemByRarity('mythical', 50).valid).toBe(true);
    });

    it('returns correct restriction metadata for each rarity', () => {
      expect(getRarityListingRestrictions('common')).toEqual({
        rarity: 'common',
        levelRequirement: 1,
        listingFeeMultiplier: 1,
      });
      expect(getRarityListingRestrictions('mythical').listingFeeMultiplier).toBe(10);
    });
  });

  describe('T8.18.3 - Listing fees', () => {
    it('charges base fee for common items', () => {
      expect(calculateListingFee('common')).toBe(BASE_LISTING_FEE);
    });

    it('scales fee by rarity multiplier', () => {
      expect(calculateListingFee('rare')).toBe(Math.floor(BASE_LISTING_FEE * 1.5));
      expect(calculateListingFee('legendary')).toBe(Math.floor(BASE_LISTING_FEE * 5));
      expect(calculateListingFee('mythical')).toBe(Math.floor(BASE_LISTING_FEE * 10));
    });

    it('never returns less than 1', () => {
      expect(calculateListingFee('common')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('T8.18.4 - Trade taxes', () => {
    it('charges base tax percentage', () => {
      expect(calculateTradeTax(100)).toBe(Math.floor(100 * BASE_TRADE_TAX_PCT / 100));
    });

    it('returns 0 for non-positive prices', () => {
      expect(calculateTradeTax(0)).toBe(0);
      expect(calculateTradeTax(-10)).toBe(0);
    });

    it('caps tax at maximum percentage', () => {
      const hugePrice = 1_000_000;
      const tax = calculateTradeTax(hugePrice);
      const maxTax = Math.floor(hugePrice * MAX_TRADE_TAX_PCT / 100);
      expect(tax).toBeLessThanOrEqual(maxTax);
    });

    it('returns the configured base tax rate', () => {
      expect(getTradeTaxRatePct()).toBe(BASE_TRADE_TAX_PCT);
    });
  });

  describe('T8.18.5 - Fraud prevention checks', () => {
    it('rejects prices below minimum', () => {
      expect(validateListingPrice(10, 0).valid).toBe(false);
      expect(validateListingPrice(10, -5).valid).toBe(false);
    });

    it('rejects prices above maximum factor of base price', () => {
      expect(validateListingPrice(10, 10 * MAX_LISTING_PRICE_FACTOR + 1).valid).toBe(false);
      expect(validateListingPrice(10, 10 * MAX_LISTING_PRICE_FACTOR).valid).toBe(true);
    });

    it('still caps price when basePrice is 0 to prevent manipulation', () => {
      expect(validateListingPrice(0, MIN_LISTING_PRICE * MAX_LISTING_PRICE_FACTOR).valid).toBe(true);
      expect(validateListingPrice(0, MIN_LISTING_PRICE * MAX_LISTING_PRICE_FACTOR + 1).valid).toBe(false);
    });

    it('allows valid prices within bounds', () => {
      expect(validateListingPrice(10, 50).valid).toBe(true);
      expect(validateListingPrice(0, 10).valid).toBe(true);
      expect(validateListingPrice(0, 11).valid).toBe(false);
    });

    it('flags suspicious quantities and duplicate listings in fraud checks', () => {
      const item = makeItem({ templateKey: 'wood', quantity: 1 });
      const result = runFraudPreventionChecks({
        item,
        basePrice: 10,
        listingPrice: 1000,
        quantity: 0,
        existingListingsFromSameItem: 5,
      });
      expect(result.passed).toBe(false);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          'price_too_high',
          'fraud_quantity_too_low',
          'fraud_too_many_duplicate_listings',
        ])
      );
    });

    it('passes clean fraud checks', () => {
      const item = makeItem({ templateKey: 'wood', quantity: 5 });
      const result = runFraudPreventionChecks({
        item,
        basePrice: 10,
        listingPrice: 50,
        quantity: 1,
        existingListingsFromSameItem: 1,
      });
      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('T8.18.6 - Contract listing rules for eligible creatures', () => {
    it('rejects bound contracts', () => {
      const contract = makeContract({ tradeStatus: 'bound' });
      expect(canListContractOnMarketplace(contract, 50).valid).toBe(false);
    });

    it('rejects contracts with low stability', () => {
      const contract = makeContract({ contractStability: 20 });
      expect(canListContractOnMarketplace(contract, 50).valid).toBe(false);
    });

    it('rejects contracts with low bond level', () => {
      const contract = makeContract({ bondLevel: 5 });
      expect(canListContractOnMarketplace(contract, 50).valid).toBe(false);
    });

    it('allows eligible contracts', () => {
      const contract = makeContract({ tradeStatus: 'marketable', contractStability: 80, bondLevel: 20 });
      expect(canListContractOnMarketplace(contract, 50).valid).toBe(true);
    });
  });
});
