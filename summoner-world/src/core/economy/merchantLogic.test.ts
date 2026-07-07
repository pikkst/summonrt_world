import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MERCHANT_CASH_RESERVE,
  DEFAULT_MERCHANT_MAX_STOCK,
  MERCHANT_BUY_PRICE_FACTOR,
  MERCHANT_MIN_PRICE_FACTOR,
  MERCHANT_SELL_PRICE_FACTOR,
  createMerchant,
  getMerchantStock,
  merchantBuyFromPlayer,
  merchantSellToPlayer,
  restockMerchant,
} from './merchantLogic';
import { getBasePrice } from './settlementLedger';

describe('T8.12 - NPC Merchant Logic', () => {
  describe('createMerchant', () => {
    it('creates a merchant with cash reserves and good stock entries', () => {
      const merchant = createMerchant({
        id: 'merchant-1',
        goods: [{ goodKey: 'wood', basePrice: 10 }],
      });
      expect(merchant.id).toBe('merchant-1');
      expect(merchant.cashReserve).toBe(DEFAULT_MERCHANT_CASH_RESERVE);
      expect(merchant.maxCashReserve).toBe(DEFAULT_MERCHANT_CASH_RESERVE);
      const wood = getMerchantStock(merchant, 'wood');
      expect(wood).toBeDefined();
      expect(wood!.stock).toBe(0);
      expect(wood!.maxStock).toBe(DEFAULT_MERCHANT_MAX_STOCK);
    });

    it('derives buy/sell prices from base price by fixed factors', () => {
      const base = getBasePrice('wood');
      const merchant = createMerchant({
        id: 'merchant-2',
        goods: [{ goodKey: 'wood', basePrice: base }],
      });
      const wood = getMerchantStock(merchant, 'wood')!;
      expect(wood.buyPrice).toBe(Math.max(1, Math.floor(base * MERCHANT_BUY_PRICE_FACTOR)));
      expect(wood.sellPrice).toBe(Math.max(1, Math.floor(base * MERCHANT_SELL_PRICE_FACTOR)));
    });

    it('clamps initial cash reserve to max cash reserve', () => {
      const merchant = createMerchant({
        id: 'merchant-3',
        cashReserve: 9999,
        maxCashReserve: 200,
        goods: [{ goodKey: 'wood' }],
      });
      expect(merchant.cashReserve).toBe(200);
    });
  });

  describe('restockMerchant', () => {
    it('does nothing when turnsElapsed is 0', () => {
      const merchant = createMerchant({ id: 'm', goods: [{ goodKey: 'wood', maxStock: 20, restockRate: 2 }] });
      expect(restockMerchant(merchant, 0)).toBe(merchant);
    });

    it('restocks stock up to the inventory limit', () => {
      const merchant = createMerchant({ id: 'm', goods: [{ goodKey: 'wood', maxStock: 20, restockRate: 3 }] });
      const restocked = restockMerchant(merchant, 2);
      const wood = getMerchantStock(restocked, 'wood')!;
      expect(wood.stock).toBe(6);
      expect(restocked.lastRestockTurn).toBe(2);
    });

    it('never exceeds the inventory limit', () => {
      const merchant = createMerchant({ id: 'm', goods: [{ goodKey: 'wood', maxStock: 10, restockRate: 5 }] });
      const restocked = restockMerchant(merchant, 100);
      expect(getMerchantStock(restocked, 'wood')!.stock).toBe(10);
    });

    it('regenerates cash reserve up to the maximum', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 50, maxCashReserve: 200, goods: [{ goodKey: 'wood' }] });
      const restocked = restockMerchant(merchant, 10);
      expect(restocked.cashReserve).toBe(100);
    });

    it('does not exceed max cash reserve', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 199, maxCashReserve: 200, goods: [{ goodKey: 'wood' }] });
      const restocked = restockMerchant(merchant, 100);
      expect(restocked.cashReserve).toBe(200);
    });
  });

  describe('merchantBuyFromPlayer - cash reserves', () => {
    it('rejects when it cannot afford even a single unit', () => {
      const merchant = createMerchant({
        id: 'm',
        cashReserve: 5,
        maxCashReserve: 100,
        goods: [{ goodKey: 'wood', basePrice: 10 }],
      });
      const result = merchantBuyFromPlayer(merchant, 'wood', 5, 10);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('insufficient_cash');
    });

    it('buys only as many units as cash allows', () => {
      const merchant = createMerchant({
        id: 'm',
        cashReserve: 25,
        maxCashReserve: 100,
        goods: [{ goodKey: 'wood', basePrice: 10 }],
      });
      const result = merchantBuyFromPlayer(merchant, 'wood', 10, 10);
      expect(result.accepted).toBe(true);
      if (result.accepted) {
        expect(result.quantity).toBe(2);
        expect(result.cashSpent).toBe(20);
        expect(result.state.cashReserve).toBe(5);
      }
    });
  });

  describe('merchantBuyFromPlayer - inventory limits', () => {
    it('rejects when inventory is already full', () => {
      const merchant = createMerchant({
        id: 'm',
        cashReserve: 1000,
        goods: [{ goodKey: 'wood', maxStock: 5, restockRate: 5 }],
      });
      const filled = restockMerchant(merchant, 10);
      const result = merchantBuyFromPlayer(filled, 'wood', 1, 1);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('no_supply_room');
    });

    it('buys only up to remaining inventory space', () => {
      const merchant = createMerchant({
        id: 'm',
        cashReserve: 1000,
        goods: [{ goodKey: 'wood', maxStock: 5, restockRate: 3 }],
      });
      const filled = restockMerchant(merchant, 1);
      const result = merchantBuyFromPlayer(filled, 'wood', 10, 1);
      expect(result.accepted).toBe(true);
      if (result.accepted) expect(result.quantity).toBe(2);
    });

    it('rejects unknown goods', () => {
      const merchant = createMerchant({ id: 'm', goods: [{ goodKey: 'wood' }] });
      const result = merchantBuyFromPlayer(merchant, 'ore', 1, 5);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('unknown_good');
    });

    it('rejects a non-positive unit price with invalid_price', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 1000, goods: [{ goodKey: 'wood', basePrice: 10 }] });
      const result = merchantBuyFromPlayer(merchant, 'wood', 1, 0);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('invalid_price');
    });

    it('rejects a unit price above the merchant sell price with invalid_price', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 1000, goods: [{ goodKey: 'wood', basePrice: 10 }] });
      const sellPrice = getMerchantStock(merchant, 'wood')!.sellPrice;
      const result = merchantBuyFromPlayer(merchant, 'wood', 1, sellPrice + 50);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('invalid_price');
    });

    it('rejects a negative quantity with invalid_quantity', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 1000, goods: [{ goodKey: 'wood', basePrice: 10 }] });
      const result = merchantBuyFromPlayer(merchant, 'wood', -3, 5);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('invalid_quantity');
    });
  });

  describe('merchantSellToPlayer', () => {
    it('sells from inventory and gains cash', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 0, maxCashReserve: 100, goods: [{ goodKey: 'wood', basePrice: 10 }] });
      const stocked = restockMerchant(merchant, 5);
      const result = merchantSellToPlayer(stocked, 'wood', 2);
      expect(result.accepted).toBe(true);
      if (result.accepted) {
        expect(result.quantity).toBe(2);
        expect(result.state.cashReserve).toBeGreaterThan(0);
      }
      expect(getMerchantStock(result.accepted ? result.state : stocked, 'wood')!.stock).toBe(8);
    });

    it('does not exceed stock', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 0, maxCashReserve: 100, goods: [{ goodKey: 'wood' }] });
      const stocked = restockMerchant(merchant, 3);
      const result = merchantSellToPlayer(stocked, 'wood', 100);
      expect(result.accepted).toBe(true);
      if (result.accepted) expect(result.quantity).toBe(6);
    });

    it('rejects when out of stock', () => {
      const merchant = createMerchant({ id: 'm', goods: [{ goodKey: 'wood' }] });
      const result = merchantSellToPlayer(merchant, 'wood', 1);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('out_of_stock');
    });
  });

  describe('player undercut reaction', () => {
    it('lowers buy/sell prices when the player sells below the merchant buy price', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 1000, goods: [{ goodKey: 'wood', basePrice: 100 }] });
      const wood = getMerchantStock(merchant, 'wood')!;
      const originalBuy = wood.buyPrice;
      const originalSell = wood.sellPrice;
      const result = merchantBuyFromPlayer(merchant, 'wood', 1, Math.max(1, originalBuy - 10));
      expect(result.accepted).toBe(true);
      if (result.accepted) {
        expect(result.undercutApplied).toBe(true);
        const updated = getMerchantStock(result.state, 'wood')!;
        expect(updated.buyPrice).toBeLessThan(originalBuy);
        expect(updated.sellPrice).toBeLessThan(originalSell);
        expect(updated.undercutCount).toBe(1);
      }
    });

    it('does not apply undercut penalty when sale price meets or exceeds buy price', () => {
      const merchant = createMerchant({ id: 'm', cashReserve: 1000, goods: [{ goodKey: 'wood', basePrice: 100 }] });
      const wood = getMerchantStock(merchant, 'wood')!;
      const result = merchantBuyFromPlayer(merchant, 'wood', 1, wood.buyPrice);
      expect(result.accepted).toBe(true);
      if (result.accepted) {
        expect(result.undercutApplied).toBe(false);
        expect(getMerchantStock(result.state, 'wood')!.undercutCount).toBe(0);
      }
    });

    it('floors undercut prices at the minimum price factor', () => {
      let merchant = createMerchant({ id: 'm', cashReserve: 100000, goods: [{ goodKey: 'wood', basePrice: 10 }] });
      for (let i = 0; i < 50; i++) {
        const wood = getMerchantStock(merchant, 'wood')!;
        const res = merchantBuyFromPlayer(merchant, 'wood', 1, 1);
        if (res.accepted) merchant = res.state;
        else merchant = restockMerchant(merchant, 5);
        void wood;
      }
      const finalEntry = getMerchantStock(merchant, 'wood')!;
      const minBuy = Math.max(1, Math.floor(finalEntry.basePrice * MERCHANT_MIN_PRICE_FACTOR));
      const minSell = Math.max(1, Math.floor(finalEntry.basePrice * MERCHANT_MIN_PRICE_FACTOR));
      expect(finalEntry.buyPrice).toBeGreaterThanOrEqual(minBuy);
      expect(finalEntry.sellPrice).toBeGreaterThanOrEqual(minSell);
    });
  });
});
