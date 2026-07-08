import type { GameStore, SetState, InventoryStack } from '../types.ts';
import type { InventoryItem, ItemRarity, ItemBinding } from '../../../types/playerCore.ts';
import { createLog } from '../helpers.ts';
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

const makeDefaultMarketplaceState = (): { listings: MarketListing[] } => ({
  listings: [],
});

export const marketplaceActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  selectRecipe: () => undefined,

  createListing: (item: InventoryStack, price: number) => {
    const { playerCore, player, appendLog } = get();
    if (!playerCore || !player) return;

    const inventoryItem: InventoryItem = {
      ...item,
      rarity: 'common' as ItemRarity,
      binding: 'tradeable' as ItemBinding,
      category: 'material',
      addedAt: Date.now(),
    };

    const validation = canListItemOnMarketplace(inventoryItem, playerCore.level);
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

    set((state: any) => ({
      playerCore: {
        ...state.playerCore,
        money: state.playerCore.money - fee,
      },
      marketplace: {
        ...(state.marketplace ?? makeDefaultMarketplaceState()),
        listings: [...(state.marketplace?.listings || []), listing],
      },
    }));

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

    set((state: any) => {
      const listings = (state.marketplace?.listings || []) as MarketListing[];
      const listingIndex = listings.findIndex((l) => l.listingId === listingId && !l.purchased);
      if (listingIndex === -1) {
        appendLog('Listing not found.', 'warning');
        return {};
      }

      const listing = listings[listingIndex]!;
      if (listing.playerId === player.id) {
        appendLog('You cannot purchase your own listing.', 'warning');
        return {};
      }

      if (playerCore.money < listing.price) {
        appendLog('Insufficient stones.', 'warning');
        return {};
      }

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

      const updatedListings = [...listings];
      updatedListings[listingIndex] = { ...listing, purchased: true };

      return {
        playerCore: {
          ...state.playerCore,
          money: state.playerCore.money - listing.price,
          inventory: [...state.playerCore.inventory, { templateKey: listing.itemKey, quantity: listing.quantity }],
        },
        marketplace: {
          ...(state.marketplace ?? makeDefaultMarketplaceState()),
          listings: updatedListings,
        },
      };
    });

    const purchased = get().marketplace?.listings?.find((l: MarketListing) => l.listingId === listingId);
    if (purchased) {
      appendLog(`Purchased ${purchased.itemKey} for ${purchased.price} stones.`, 'success');
    }
  },
});
