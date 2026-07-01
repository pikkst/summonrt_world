# Dependency Graph

## Intended Direction

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

This is a design direction, not a strict import graph for every file.

## Good Dependency Direction

Good examples:

- Player references creature contracts.
- Creature systems use element definitions.
- Dungeon rewards update player progression through a clear action or event.
- NPC shops interact with economy through defined APIs.
- Achievements react to events instead of being hard-coded everywhere.

## Risky Dependency Direction

Avoid:

- UI importing deep gameplay internals directly for calculations.
- Economy mutating player inventory directly without a transaction/action boundary.
- NPC modules owning player progression state.
- Dungeon generator importing store state.
- Combat formulas depending on React components.

## Event Boundary Direction

For cross-system reactions, prefer events:

```text
DungeonBossDefeated
  -> QuestSystem
  -> AchievementSystem
  -> ReputationSystem
  -> WorldMemorySystem
  -> EconomySystem
```

## Save Boundary Direction

Player-owned persistent state should move toward Player Core as root aggregate.

World/dungeon persistent state can be referenced by player save metadata but should preserve clear ownership.
