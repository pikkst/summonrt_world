export type EconomyEvent =
  | {
      type: 'ItemCrafted';
      playerId: string;
      recipeKey: string;
      itemKeys: string[];
      success: boolean;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'ItemTraded';
      tradeId: string;
      initiatorId: string;
      targetId: string;
      offeredItems: { itemKey: string; quantity: number }[];
      requestedItems: { itemKey: string; quantity: number }[];
      timestamp: number;
    }
  | {
      type: 'MarketListingCreated';
      listingId: string;
      playerId: string;
      itemKey: string;
      quantity: number;
      price: number;
      timestamp: number;
    }
  | {
      type: 'MarketListingPurchased';
      listingId: string;
      sellerId: string;
      buyerId: string;
      itemKey: string;
      quantity: number;
      price: number;
      timestamp: number;
    }
  | {
      type: 'CurrencyChanged';
      playerId: string;
      previousAmount: number;
      newAmount: number;
      changeDirection: 'gain' | 'loss';
      source: string;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'SettlementDemandChanged';
      settlementId: string;
      goodKey: string;
      previousDemand: number;
      newDemand: number;
      turnCount: number;
    };

export type EconomyEventHandler = (event: EconomyEvent) => void;

export class EconomyEventBus {
  private handlers: Map<EconomyEvent['type'], Set<EconomyEventHandler>> = new Map();

  subscribe(type: EconomyEvent['type'], handler: EconomyEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  publish(event: EconomyEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const economyEventBus = new EconomyEventBus();
