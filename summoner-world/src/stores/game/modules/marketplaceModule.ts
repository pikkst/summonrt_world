import type { GameStore, SetState, InventoryStack } from '../types.ts';
import { canListItemOnMarketplace, calculateListingFee } from '../../../core/economy/marketplaceRules';
import { economyEventBus } from '../../../core/economy/economyEventBus';
import { addItemToInventory } from '../../../core/playerCore/inventoryCore';
import { getItemTemplate } from '../../../data/crafting/itemTemplates';

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

function deductInventoryQuantity(inventory: InventoryStack[], item: InventoryStack): InventoryStack[] {
  let remaining = item.quantity;
  const next = inventory
    .map((stack) => {
      if (remaining <= 0) return stack;
      if (stack.templateKey !== item.templateKey) return stack;
      const take = Math.min(remaining, stack.quantity);
      stack = { ...stack, quantity: stack.quantity - take };
      remaining -= take;
      if (stack.quantity <= 0) return null;
      return stack;
    })
    .filter((stack): stack is InventoryStack => stack !== null);
  return next;
}

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

    const available = playerCore.inventory
      .filter((i) => i.templateKey === item.templateKey)
      .reduce((sum, i) => sum + i.quantity, 0);
    if (available < item.quantity) {
      appendLog('Insufficient item quantity to list.', 'warning');
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
      const inventory = deductInventoryQuantity(state.playerCore.inventory, item);
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

      const template = getItemTemplate(listing.itemKey);
      const newInventory = template
        ? addItemToInventory(
            state.playerCore.inventory,
            { templateKey: listing.itemKey, quantity: listing.quantity },
            template,
            'tradeable',
            playerCore.identity.id
          ).inventory
        : [...state.playerCore.inventory, { templateKey: listing.itemKey, quantity: listing.quantity }];

      return {
        playerCore: {
          ...state.playerCore,
          money: state.playerCore.money - listing.price,
          inventory: newInventory,
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

  claimEscrow: (sellerId?: string) => {
    const { playerCore, player, appendLog } = get();
    if (!playerCore || !player) return;

    const targetSellerId = sellerId || player.id;
    const escrowKey = targetSellerId;
    const escrow = get().marketplace?.escrow || {};
    const amount = escrow[escrowKey];

    if (!amount || amount <= 0) {
      appendLog('No escrow funds to claim.', 'warning');
      return;
    }

    set((state: any) => {
      const newEscrow = { ...(state.marketplace?.escrow || {}) };
      delete newEscrow[escrowKey];

      return {
        playerCore: {
          ...state.playerCore,
          money: state.playerCore.money + amount,
        },
        marketplace: {
          ...(state.marketplace ?? makeDefaultMarketplaceState()),
          listings: state.marketplace?.listings || [],
          escrow: newEscrow,
        },
      };
    });

    appendLog(`Claimed ${amount} stones from escrow.`, 'success');
  },
});
