import { describe, it, expect, vi } from 'vitest';
import { economyEventBus, type EconomyEvent } from './economyEventBus';

describe('economyEventBus', () => {
  it('subscribes and receives published events', () => {
    const handler = vi.fn();
    economyEventBus.subscribe('ItemCrafted', handler);
    economyEventBus.publish({
      type: 'ItemCrafted',
      playerId: 'p1',
      recipeKey: 'iron_sword',
      itemKeys: ['iron_sword'],
      success: true,
      gameTimeMinutes: 100,
      turnCount: 5,
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'ItemCrafted',
      playerId: 'p1',
      recipeKey: 'iron_sword',
      itemKeys: ['iron_sword'],
      success: true,
      gameTimeMinutes: 100,
      turnCount: 5,
    });
    economyEventBus.clear();
  });

  it('unsubscribes correctly', () => {
    const handler = vi.fn();
    const unsub = economyEventBus.subscribe('ItemCrafted', handler);
    unsub();
    economyEventBus.publish({
      type: 'ItemCrafted',
      playerId: 'p1',
      recipeKey: 'iron_sword',
      itemKeys: ['iron_sword'],
      success: true,
      gameTimeMinutes: 100,
      turnCount: 5,
    });
    expect(handler).not.toHaveBeenCalled();
    economyEventBus.clear();
  });

  it('does not call handlers for unsubscribed event types', () => {
    const handler = vi.fn();
    economyEventBus.subscribe('ItemCrafted', handler);
    economyEventBus.publish({
      type: 'CurrencyChanged',
      playerId: 'p1',
      previousAmount: 100,
      newAmount: 150,
      changeDirection: 'gain',
      source: 'quest_reward',
      gameTimeMinutes: 100,
      turnCount: 5,
    });
    expect(handler).not.toHaveBeenCalled();
    economyEventBus.clear();
  });

  it('supports multiple handlers for the same event type', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    economyEventBus.subscribe('ItemTraded', handler1);
    economyEventBus.subscribe('ItemTraded', handler2);
    economyEventBus.publish({
      type: 'ItemTraded',
      tradeId: 't1',
      initiatorId: 'p1',
      targetId: 'p2',
      offeredItems: [{ itemKey: 'potion', quantity: 1 }],
      requestedItems: [],
      timestamp: 1000,
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    economyEventBus.clear();
  });

  it('supports all economy event types', () => {
    const events: EconomyEvent[] = [
      {
        type: 'ItemCrafted',
        playerId: 'p1',
        recipeKey: 'r1',
        itemKeys: ['item1'],
        success: true,
        gameTimeMinutes: 100,
        turnCount: 1,
      },
      {
        type: 'ItemTraded',
        tradeId: 't1',
        initiatorId: 'p1',
        targetId: 'p2',
        offeredItems: [{ itemKey: 'item1', quantity: 1 }],
        requestedItems: [],
        timestamp: 1000,
      },
      {
        type: 'MarketListingCreated',
        listingId: 'l1',
        playerId: 'p1',
        itemKey: 'item1',
        quantity: 1,
        price: 100,
        timestamp: 1000,
      },
      {
        type: 'MarketListingPurchased',
        listingId: 'l1',
        sellerId: 'p1',
        buyerId: 'p2',
        itemKey: 'item1',
        quantity: 1,
        price: 100,
        timestamp: 1000,
      },
      {
        type: 'CurrencyChanged',
        playerId: 'p1',
        previousAmount: 100,
        newAmount: 150,
        changeDirection: 'gain',
        source: 'quest_reward',
        gameTimeMinutes: 100,
        turnCount: 1,
      },
      {
        type: 'SettlementDemandChanged',
        settlementId: 's1',
        goodKey: 'wood',
        previousDemand: 10,
        newDemand: 12,
        turnCount: 1,
      },
    ];

    events.forEach((event) => {
      const handler = vi.fn();
      economyEventBus.subscribe(event.type, handler);
      economyEventBus.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
    economyEventBus.clear();
  });
});
