# T6P.1 – PlayerCoreState Root Aggregate Implementation Report

## What Was Found

The codebase used a legacy `PlayerState` type in `src/types/game.ts` that served as the single source of truth for all player-owned data. While functional, it mixed identity, progression, inventory, creatures, world position, settings, and transient state into one flat interface. The project architecture rules (Player Core -> Creature Core -> World Core) required a proper root aggregate that groups these concerns into explicit, named sub-systems.

The following gaps were identified in the legacy `PlayerState`:
- No explicit `SummonerClass` type (only an informal `archetype` string).
- No dedicated `Equipment` core; equipment slots were absent.
- No `PlayerStatistics` model for long-term tracking (worlds unlocked, bosses defeated, etc.).
- No `ReputationState` model (world, faction, settlement, creature reputation).
- No `CreatureContract` abstraction; creatures were plain arrays without contract metadata.
- No `WorldUnlocks` or `SaveMetadata` structures.
- No explicit migration path from the existing flat state to a structured aggregate.

## What Was Changed

A new `PlayerCoreState` root aggregate was introduced in `src/types/playerCore.ts` alongside factory and migration utilities in `src/core/playerCore/`.

## What Was Completed

- Defined `PlayerCoreState` with all required systems:
  - `identity` (id, name, gender, appearance)
  - `summonerProfile` (class, archetype, startingWorldId, firstContractPath)
  - `elements` (primary, secondary, tertiary, learned, traits)
  - `inventory` (flat stack list, ready for T6P.6 expansion)
  - `equipment` (equipment slots, ready for T6P.7 expansion)
  - `skills`, `talents`, `titles`, `achievements`
  - `statistics`, `reputation`
  - `questHistory`
  - `creatureContracts`
  - `housing`, `worldUnlocks`, `saveMetadata`
  - Preserved legacy fields: `resources`, `position`, `settings`, `money`, `skillPoints`, `dayCount`, `gameTimeMinutes`, `isOnline`

- Added `createDefaultPlayerCoreState` factory that creates a fresh aggregate with sensible defaults and archetype-to-class mapping.

- Added `migratePlayerStateToCore` that converts legacy `PlayerState` into `PlayerCoreState` without dropping any data:
  - Maps identity, level, XP, and money directly.
  - Derives `summonerProfile.class` from legacy `archetype`.
  - Flattens `skillsUnlocked` into `SkillEntry[]`.
  - Converts `unlocked_node_ids` into `TalentNode[]`.
  - Wraps existing `creatures` into `CreatureContract[]` with default contract metadata.
  - Derives `worldUnlocks.unlockedWorlds` from `currentWorldId`.
  - Preserves resources, position, settings, and quest history.

- Added unit tests (`src/test/playerCore.test.ts`) covering factory defaults, archetype mapping, custom starting world/affinity, full legacy migration, statistics derivation, world unlock progression, and default contract metadata.

## Files Were Touched

- `src/types/playerCore.ts` — New type definitions for Player Core aggregate.
- `src/core/playerCore/factory.ts` — Factory and migration logic.
- `src/core/playerCore/index.ts` — Barrel exports.
- `src/test/playerCore.test.ts` — Unit tests for factory and migration.
- `SummonerWorld_Tasks.md` — Marked T6P.1 as completed.

## Validation Results

- `npm run typecheck` — Passed (0 errors).
- `npm run lint` — Passed (0 warnings/errors).
- `npm run test` — Passed (447 tests total, including 7 new Player Core tests).
- `npm run build` — Passed (production bundle built successfully).

## Remaining Notes

- `PlayerState` remains unchanged for backward compatibility. Subsequent Player Core tasks (T6P.2–T6P.17) will gradually integrate `PlayerCoreState` into stores, save/load, and gameplay modules.
- Equipment slots and inventory categorization are structured but will be expanded in T6P.6 and T6P.7.
- Reputation, achievements, and statistics fields are initialized with defaults and require gameplay-driven updates in later tasks.
