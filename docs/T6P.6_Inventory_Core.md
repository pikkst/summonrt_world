# T6P.6 – Inventory Core Implementation

## Summary

This document describes the implementation of the Inventory Core system for Sprint 6.5 task T6P.6.

## What Was Found

The Player Core Bible (docs/Sumoner_World_dec/27_Player_Core_Bible.md) and SummonerWorld_Tasks.md required a dedicated Inventory Core with:

- 10 item categories: Equipment, Consumables, Materials, Quest items, Creature items, Contract items, Crafting tools, Housing items, Marketplace goods, Dungeon keys
- Sorting, filtering, stacking, rarity, ownership, binding, trading rules
- Save/load stability through serialization and legacy migration

Existing code already had:
- `PlayerCoreState.inventory: InventoryStack[]` in `src/types/playerCore.ts`
- `ItemTemplate` type with `type`, `subtype`, `rarity`, `stackable`, `maxStack`
- `InventoryStack` type in `src/types/game.ts`
- But no dedicated inventory management module in `src/core/playerCore/`

## What Was Changed

### 1. `src/types/playerCore.ts`
- Added `ItemCategory` type with 10 categories
- Added `ItemBinding` type: `bound`, `tradeable`, `marketable`
- Added `ItemRarity` type: `common`, `uncommon`, `rare`, `epic`, `legendary`, `mythical`
- Added `InventorySortKey` and `InventorySortOrder` types
- Added `InventoryFilter` interface for filtering logic
- Added `InventoryItem` interface extending `InventoryStack` with category, rarity, binding, ownerId, addedAt, and optional dungeonKeyData/contractItemData

### 2. `src/core/playerCore/inventoryCore.ts` (new file)
- Created `ITEM_CATEGORY_TEMPLATES` mapping subtypes and types to categories
- Created `RARITY_ORDER` for deterministic sorting
- Implemented `getItemCategory()` - maps template to category using subtype then type
- Implemented `getItemRarity()` - maps numeric rarity to named rarity
- Implemented `canStackItems()` - deep-equal check on templateKey and modifiers
- Implemented `stackItem()` - merges items into existing stacks with overflow handling
- Implemented `addItemToInventory()` - adds items with stacking, capacity awareness, and non-stackable support
- Implemented `removeItemFromInventory()` - removes items with optional filter support
- Implemented `hasItem()` and `getItemCount()` - query helpers
- Implemented `sortInventory()` - sort by category, rarity, name, quantity, or addedAt
- Implemented `filterInventory()` - filter by categories, rarities, binding, name
- Implemented `getInventoryByCategory()` - group items by category
- Implemented `canTradeItem()` - check trade/market binding status
- Implemented `bindItem()` - mark items as bound
- Implemented `getInventoryCapacity()` - derive capacity from secondary stats
- Implemented `isInventoryFull()` - check if inventory is at capacity
- Implemented `getUniqueItemCount()` and `getTotalItemCount()` - inventory metrics
- Implemented `serializeInventory()` / `deserializeInventory()` - save/load round-trip
- Implemented `migrateLegacyInventory()` - migrate legacy InventoryStack[] to InventoryItem[]
- Implemented `createStartingInventory()` - class-aware starting items
- Implemented `mergeInventories()` - combine two inventories
- Implemented `splitStack()` - split a stack with optional filter
- Implemented `clearInventory()` and `pruneInvalidItems()` - cleanup utilities

### 3. `src/core/playerCore/index.ts`
- Exported all new inventory types and functions from `inventoryCore.ts`

### 4. `src/test/inventoryCore.test.ts` (new file)
- 57 tests covering:
  - Category mapping
  - Rarity mapping
  - Stacking logic
  - Add/remove operations
  - Item queries
  - Sorting and filtering
  - Category grouping
  - Trade/bind rules
  - Capacity checks
  - Serialization/deserialization
  - Legacy migration
  - Starting inventory
  - Merging and splitting
  - Pruning invalid items

## What Was Completed

- [x] Equipment category mapping
- [x] Consumables category mapping
- [x] Materials category mapping
- [x] Quest items category mapping
- [x] Creature items category mapping
- [x] Contract items category mapping
- [x] Crafting tools category mapping
- [x] Housing items category mapping
- [x] Marketplace goods category mapping
- [x] Dungeon keys category mapping
- [x] Sorting (category, rarity, name, quantity, addedAt)
- [x] Filtering (categories, rarities, binding, name contains)
- [x] Stacking with overflow handling
- [x] Rarity system (6 tiers)
- [x] Ownership support via ownerId field
- [x] Binding rules (bound, tradeable, marketable)
- [x] Trading rules (canTradeItem validation)
- [x] Save/load stability (serialize/deserialize round-trip)
- [x] Legacy inventory migration
- [x] Full test coverage (57 tests)

## Files Touched

```
src/types/playerCore.ts
src/core/playerCore/inventoryCore.ts (new)
src/core/playerCore/index.ts
src/test/inventoryCore.test.ts (new)
SummonerWorld_Tasks.md
docs/T6P.6_Inventory_Core.md (new)
```

## Validation Results

```
npm run typecheck: PASSED (no TypeScript errors)
npm run lint: PASSED (no ESLint errors)
npm run test: PASSED (568/568 tests, 27 test files)
npm run build: PASSED
```

## Remaining Notes

- T6P.7 (Equipment Core) will build upon the slot system already defined in `PlayerCoreState`
- Future save/load migration (T6P.16) will integrate `serializeInventory()` / `deserializeInventory()`
- `ItemTemplate` data needs to be populated for all game items to enable proper category/rarity assignment
- Dungeon key metadata (`dungeonKeyData`) and contract item metadata (`contractItemData`) are typed but require gameplay integration in later tasks
