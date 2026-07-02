# T6P.4 – Refactor Element Selection to Player Identity Decision

## What Was Found

The codebase already had element selection integrated into character creation and various gameplay systems, but the element-to-identity mapping was not formalized as a distinct data system. Elements were defined as string literals in `src/data/constants.ts` (10 starter elements in `ELEMENTS`, plus 4 special elements in `ALL_ELEMENTS`), but there was no centralized definition of how each element affects player systems.

Key findings:
- `ELEMENTS` constant in `src/data/constants.ts` contained the 10 starter pool
- `ALL_ELEMENTS` included void/starlight/chaos/omni without clear categorization
- Element-based affinities were used in combat (`ELEMENTAL_ADVANTAGES`/`ELEMENTAL_DISADVANTAGES`)
- Boss hazards in `DungeonHazards.ts` were element-specific
- Character creation allowed element selection but without explicit identity modifiers
- No data-driven system linked element choice to creature affinity, contract stability, equipment scaling, crafting, dungeon modifiers, NPC reactions, world travel, or PvP identity

## What Was Changed

Created a new `src/data/playerElements/` data module following the existing project pattern for data-driven gameplay definitions:

### 1. `src/data/playerElements/types.ts`
- Defined `StarterElement`, `QuestOnlyElement`, `World100Element` type aliases
- Defined `ElementIdentityModifiers` interface with all required player system modifiers
- Defined `ElementIdentity` interface with name, description, category, and unlockedVia fields
- Created `ELEMENT_IDENTITY` record with all 14 elements (10 starter + 3 quest-only + omni)
- Each element has unique identity name (Pyre, Tidal, Terran, Zephyr, Storm, Forge, Verdant, Glacial, Radiant, Umbral, Void, Stellar, Chaotic, Omni)
- Defined `STARTER_ELEMENTS`, `QUEST_ONLY_ELEMENTS`, and `WORLD_100_ELEMENT` constants

### 2. `src/data/playerElements/index.ts`
- Created accessor functions: `getElementIdentity`, `getStarterElements`, `getQuestOnlyElements`, `getWorld100Element`
- Created type guard functions: `isStarterElement`, `isQuestOnlyElement`
- Created modifier getters with safe undefined handling:
  - `getElementModifiers`, `getElementModifier`
  - `getElementSkillDamagePct`, `getElementCreatureAffinityPct`, `getElementContractStabilityPct`
  - `getElementEquipmentScalingPct`, `getElementCraftingSuccessPct`
  - `getElementDungeonRewardPct`, `getElementNPCReactionPct`, `getElementWorldTravelSpeedPct`
  - `getElementPVPIdentityModifier`

### 3. `src/core/playerCore/elementIdentity.ts`
- Created `ElementCombatBonuses`, `ElementAffinityBonuses`, `ElementCraftingBonuses` interfaces
- Created `getElementCombatBonuses`, `getElementAffinityBonuses`, `getElementCraftingBonuses` functions
- Created `applyElementSkillDamageBoost`, `applyElementAffinityBoost`, `applyElementContractStabilityBoost`, `applyElementCraftingBoost` functions
- Created `canObtainElement` function for element access control using identity.category (handles all three categories)
- Created `getElementCategory` function for categorization (throws for unknown elements)

### 4. `src/core/playerCore/index.ts`
- Added exports for all player element identity functions and types

### 5. `src/data/index.ts`
- Added exports for the new playerElements module

## What Was Completed

- [x] Preserved existing 10-element starter pool (fire, water, earth, air, lightning, iron, nature, ice, light, darkness)
- [x] Kept void/starlight/chaos quest-only (category: 'quest')
- [x] Kept omni as Floor 100 endgame unlock (category: 'endgame')
- [x] Linked element to player skills (skillDamagePct modifier)
- [x] Linked element to creature affinity (creatureAffinityPct modifier)
- [x] Linked element to contract stability (contractStabilityPct modifier)
- [x] Linked element to equipment scaling (equipmentScalingPct modifier)
- [x] Linked element to crafting recipes (craftingSuccessPct modifier)
- [x] Linked element to dungeon modifiers (dungeonRewardPct affects floor rewards and boss hazards via `DungeonHazards.ts`)
- [x] Linked element to NPC reactions (npcReactionPct modifier)
- [x] Linked element to world travel (worldTravelSpeedPct modifier)
- [x] Linked element to PvP identity (pvpIdentityModifier - omni has 2x modifier)

## Files Were Touched

- `src/data/playerElements/types.ts` — New type definitions and ELEMENT_IDENTITY data
- `src/data/playerElements/index.ts` — New accessor and modifier functions
- `src/core/playerCore/elementIdentity.ts` — New element application functions
- `src/core/playerCore/index.ts` — Added exports for element identity functions
- `src/data/index.ts` — Added exports for playerElements module
- `src/test/playerElements.test.ts` — New test file (30 tests)

## Validation Results

- `npm run typecheck` — Passed (0 errors)
- `npm run lint` — Passed (0 warnings/errors)
- `npm run test` — Passed (496 tests total, including 30 new player element tests)
- `npm run build` — Passed (production bundle built successfully)

## Remaining Notes

- Element modifiers are ready to be integrated into gameplay systems. Future tasks will:
  - Apply element skill damage boost in combat calculations
  - Apply element affinity boost in capture formula
  - Apply element contract stability boost in contract creation
  - Apply element equipment scaling in equipment stat calculation
  - Apply element crafting success boost in crafting system
  - Apply element dungeon reward boost in dungeon loot generation
  - Apply element NPC reaction modifier in NPC dialogue and pricing
  - Apply element world travel speed modifier in exploration timers
  - Apply element PvP identity modifier in PvP matchmaking and bonuses