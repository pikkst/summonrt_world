# T6P.8 - Creature Slot System Implementation

## Summary

Implemented the Creature Slot system for Sprint 6.5 Player Core Architecture Alignment.

## What Was Found

- `PlayerCoreState` already had `creatureContracts: CreatureContract[]` but no formal slot categorization
- `PlayerSecondaryStats` included `contractCapacity` but only as a flat stat, with no per-type slot pools
- No existing code enforced how many creatures could be assigned to active combat, reserve, utility, housing, marketplace, or breeding roles
- The Player Core Bible (`docs/Sumoner_World_dec/27_Player_Core_Bible.md`) explicitly defines 6 slot types that must exist in the player aggregate
- Previous task T6P.7 added `equipmentCore.ts` and established the pattern for slot-based systems

## What Was Changed

### Types Added
- `CreatureSlotType` union (`active_combat | reserve | utility | housing | marketplace | breeding`) in `src/types/playerCore.ts`
- `CreatureSlotGroup` interface representing a single slot pool with `type`, `max`, and `assigned`
- `CreatureSlots` interface containing all slot groups
- `creatureSlots: CreatureSlots` added to `PlayerCoreState`

### Core Implementation Created
- New file `src/core/playerCore/creatureSlotCore.ts` with:
  - `CREATURE_SLOT_TYPES` constant (all 6 category identifiers)
  - `BASE_SLOT_COUNTS` constant (base max per category)
  - `createDefaultCreatureSlots()` - builds a new player's starting pools
  - `createEmptyCreatureSlots()` - creates pools with optional overrides
  - `getSlotGroup()` - retrieves one pool by type
  - `getAvailableSlots()` - remaining capacity for a pool
  - `isSlotFull()` - boolean capacity check
  - `getTotalMaxSlots()` / `getUsedSlotCount()` - aggregate slot metrics
  - `assignCreatureToSlot()` - adds a creature contract ID to a pool
  - `removeCreatureFromSlot()` - removes a creature contract ID from a pool
  - `moveCreatureBetweenSlots()` - transfers a creature between two pools
  - `getAssignedCreatures()` - returns assigned creature IDs for a pool
  - `expandSlots()` - increases max for one pool type
  - `expandAllSlots()` - increases max for all pools
  - `calculateSlotExpansionFromLevel()` - level-based expansion rules (capped per type)
  - `calculateSlotExpansionFromEquipment()` - parses `creature_slot_<type>` modifiers from equipment
  - `calculateSlotExpansionFromHousing()` - housing structure level bonuses
  - `calculateSlotExpansionFromGuild()` - future guild bonus placeholder (returns 0 until guild system exists)
  - `getFullSlotExpansion()` - combines all expansion sources into a unified record

### Factory Integration
- `createDefaultPlayerCoreState()` now initializes `creatureSlots` with `createDefaultCreatureSlots()`
- `migratePlayerStateToCore()` migrated legacy players now receive default creature slots

### Exports
- Added creature slot types and functions to `src/core/playerCore/index.ts`

## Files Touched

- `summoner-world/src/types/playerCore.ts` - Added CreatureSlotType, CreatureSlotGroup, CreatureSlots, and creatureSlots field on PlayerCoreState
- `summoner-world/src/core/playerCore/creatureSlotCore.ts` - New file (Creature Slot Core implementation)
- `summoner-world/src/core/playerCore/factory.ts` - Integrated creature slots into default core state and legacy migration
- `summoner-world/src/core/playerCore/index.ts` - Exported creature slot types and functions
- `summoner-world/src/test/creatureSlotCore.test.ts` - New test file (38 tests)

## Validation Results

```
npm run typecheck - passed
npm run lint - passed
npm run test - 639 tests passed (38 new creature slot tests)
npm run build - succeeded
```

## Notes

- Slot expansion is deterministic and data-driven; base counts and level scaling formulas are explicit
- Equipment modifiers use the prefix `creature_slot_<type>` (e.g., `creature_slot_active_combat`) to add slots without hard-coding item behavior
- Guild bonuses are stubbed as a future-safe return path so the API remains stable when the guild system arrives
- The system preserves backward compatibility: legacy `PlayerState` objects migrated to `PlayerCoreState` receive default slot pools
- No duplicate slot systems were introduced; creature slots are the single source of truth for slot management
