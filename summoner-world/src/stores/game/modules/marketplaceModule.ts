import type { GameStore, SetState, InventoryStack } from '../types.ts';
import { canListItemOnMarketplace, calculateListingFee } from '../../../core/economy/marketplaceRules';
import { economyEventBus } from '../../../core/economy/economyEventBus';

interface MarketListing {
  listingId: string;
  playerId: string;
  itemKey: string;
  quantity: number;
  price: number;
  purchased: boolean;
}

const makeDefaultMarketplaceState = (): { listings: MarketListing[]; escrow: Record<string, number> } => ({
  listings: [],
  escrow: {},
});

export const marketplaceActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  selectRecipe: () => undefined,

  createListing: (item: InventoryStack, price: number) => {
    const { playerCore, player, appendLog } = get();
    if (!playerCore || !player) return;

    const validation = canListItemOnMarketplace(
      { ...item, binding: 'tradeable', rarity: 'common', category: 'material', addedAt: Date.now() },
      playerCore.level
    );
    if (!validation.valid) {
      appendLog(`Cannot list item: ${validation.reason}`, 'warning');
      return;
    }

    const fee = calculateListingFee('common');
    if (playerCore.money < fee) {
      appendLog(`Insufficient funds for listing fee (${fee} stones).`, 'warning');
      return;
    }

    const listingId = `listing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const listing: MarketListing = {
      listingId,
      playerId: player.id,
      itemKey: item.templateKey,
      quantity: item.quantity,
      price,
      purchased: false,
    };

    set((state: any) => {
      const inventory = state.playerCore.inventory.filter(
        (i: InventoryStack) => i.templateKey !== item.templateKey
      );
      return {
        playerCore: {
          ...state.playerCore,
          money: state.playerCore.money - fee,
          inventory,
        },
        marketplace: {
          ...(state.marketplace ?? makeDefaultMarketplaceState()),
          listings: [...(state.marketplace?.listings || []), listing],
        },
      };
    });

    economyEventBus.publish({
      type: 'MarketListingCreated',
      listingId,
      playerId: player.id,
      itemKey: item.templateKey,
      quantity: item.quantity,
      price,
      timestamp: Date.now(),
    });

    appendLog(`Listed ${item.templateKey} for ${price} stones.`, 'success');
  },

  purchaseListing: (listingId: string) => {
    const { playerCore, player, appendLog } = get();
    if (!playerCore || !player) return;

    const listings = (get().marketplace?.listings || []) as MarketListing[];
    const listingIndex = listings.findIndex((l) => l.listingId === listingId && !l.purchased);
    if (listingIndex === -1) {
      appendLog('Listing not found.', 'warning');
      return;
    }

    const listing = listings[listingIndex]!;
    if (listing.playerId === player.id) {
      appendLog('You cannot purchase your own listing.', 'warning');
      return;
    }

    if (playerCore.money < listing.price) {
      appendLog('Insufficient stones.', 'warning');
      return;
    }

    set((state: any) => {
      const updatedListings = [...(state.marketplace?.listings || [])];
      updatedListings[listingIndex] = { ...listing, purchased: true };

      const escrow = { ...(state.marketplace?.escrow || {}) };
      escrow[listing.playerId] = (escrow[listing.playerId] || 0) + listing.price;

      return {
        playerCore: {
          ...state.playerCore,
          money: state.playerCore.money - listing.price,
          inventory: [...state.playerCore.inventory, { templateKey: listing.itemKey, quantity: listing.quantity }],
        },
        marketplace: {
          ...(state.marketplace ?? makeDefaultMarketplaceState()),
          listings: updatedListings,
          escrow,
        },
      };
    });

    economyEventBus.publish({
      type: 'MarketListingPurchased',
      listingId,
      sellerId: listing.playerId,
      buyerId: player.id,
      itemKey: listing.itemKey,
      quantity: listing.quantity,
      price: listing.price,
      timestamp: Date.now(),
    });

    appendLog(`Purchased ${listing.itemKey} for ${listing.price} stones.`, 'success');
  },
});
