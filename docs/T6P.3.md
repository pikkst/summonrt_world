# T6P.3 – Summoner Class System Implementation Report

## What Was Found

The Summoner Class system already had 8 classes defined (`beast_binder`, `elementalist`, `warden`, `ritualist`, `tactician`, `alchemist`, `pathfinder`, `duelist`) with stat biases and starting bonuses, but they were embedded inside `src/core/playerCore/characterCreation.ts` as a hard-coded module-level constant (`SUMMONER_CLASSES`). This mixed data with core logic and made it difficult to consume class modifiers from other systems without pulling in the entire character creation module.

Additional gaps identified:
- No dedicated data layer for summoner class definitions.
- No helper functions to query class data (e.g., `getClassById`, `getClassModifiers`).
- Multiple UI and store consumers imported the constant indirectly through `characterCreation.ts`, creating unnecessary coupling.
- Existing tests verified the data shape but did not test data-layer accessors.

## What Was Changed

Class definitions were extracted from `characterCreation.ts` into a new `src/data/summonerClasses/` data module, following the existing project pattern used by `src/data/careerTree/` and other data systems.

## What Was Completed

- Created `src/data/summonerClasses/types.ts` with shared interfaces:
  - `SummonerClassId` (string literal union of all 8 classes)
  - `ClassDefinition` (id, name, description, icon, statBias, startingBonus)
- Created `src/data/summonerClasses/index.ts` containing:
  - `SUMMONER_CLASSES` record with all 8 class definitions
  - `getAllClasses()` — returns array of all class definitions
  - `getClassById(id)` — returns a single class definition or `undefined`
  - `getClassModifiers(classId)` — returns stat bias and starting bonus for a class
- Updated `src/core/playerCore/characterCreation.ts` to import `SUMMONER_CLASSES`, `ClassDefinition`, and `SummonerClassId` from the new data module instead of defining them locally.
- Updated `src/data/index.ts` to re-export the new data module for centralized access.
- Updated `src/core/playerCore/index.ts` to export class data and helpers from the data module.
- Updated `src/stores/game/modules/playerModule.ts`, `src/ui/StartScreen.tsx`, `src/ui/GameShell.tsx`, `src/stores/game/types.ts`, and `src/test/characterCreation.test.ts` to import from the new data module where appropriate.
- Added `src/test/summonerClasses.test.ts` with 9 unit tests covering:
  - All 8 required classes are present
  - Each class has required fields
  - Helper functions return correct values
  - Unknown class lookups return `undefined`
  - No class has an empty starting bonus

## Files Were Touched

- `src/data/summonerClasses/types.ts` — New
- `src/data/summonerClasses/index.ts` — New
- `src/data/index.ts` — Added exports for summoner classes
- `src/core/playerCore/characterCreation.ts` — Removed local class definitions; imports from data module
- `src/core/playerCore/index.ts` — Re-exported data module helpers
- `src/stores/game/modules/playerModule.ts` — Aligned imports to data module
- `src/stores/game/types.ts` — Aligned type imports to data module
- `src/ui/StartScreen.tsx` — Aligned imports to data module
- `src/ui/GameShell.tsx` — Aligned imports to data module
- `src/test/characterCreation.test.ts` — Updated imports to data module
- `src/test/summonerClasses.test.ts` — New test file (9 tests)
- `SummonerWorld_Tasks.md` — Marked T6P.3 as completed
- `docs/T6P.3.md` — New (this document)

## Validation Results

- `npm run typecheck` — Passed (0 errors)
- `npm run lint` — Passed (0 warnings/errors)
- `npm run test` — Passed (468 tests total, including 9 new summoner class data tests)
- `npm run build` — Passed (production bundle built successfully)

## Remaining Notes

- `SummonerClass` type remains in `src/types/playerCore.ts` because it is used by `PlayerCoreState` and other core types. `SummonerClassId` lives in the data module as the string-literal union for data keys.
- Legacy `PlayerState` paths (`initGame`, `factory.ts` archetype mapping) still use their own hard-coded mappings. Those are legacy compatibility paths and will be phased out during T6P.16 save/load integration.
- The 8 class meanings (Beast Binder, Elementalist, Warden, Ritualist, Tactician, Alchemist, Pathfinder, Duelist) are defined but class-specific gameplay mechanics beyond starting bonuses will be expanded in later tasks.
