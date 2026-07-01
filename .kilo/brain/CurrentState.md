# Current State

## Source of Truth

The active implementation checklist is:

```text
SummonerWorld_Tasks.md
```

Always read the task file before starting work.

## Current Project Direction

The project is being shifted toward a player-first Summoner RPG architecture.

The correct long-term architecture is:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

## Completed Foundation

According to the active task list, Sprint 0 through Sprint 5 are complete.

Major completed areas include:

- Technical foundation
- Career tree data layer
- Mission queue
- Core gameplay loop
- XP rules
- Element system
- Creature system
- Fusion logic
- Skill inheritance
- Early combat and dungeon foundation

## Current Main Area

Sprint 6: Combat and Dungeon System.

Important dungeon systems already exist:

- Dungeon floor generation
- Deterministic floor seeds
- Room graph generation
- Treasure placement
- Room type assignment
- Boss floor generation
- Tower generation
- Safe floors
- Pathfinding utilities

## Next High-Value Task

The recommended next implementation task is:

```text
T6.12 - Test full clear World 10 dungeon simulation
```

This should be implemented as a dedicated branch and Pull Request.

Suggested branch:

```text
feature/T6-12-world-10-dungeon-simulation
```

## Important Upcoming Work

After Sprint 6 is stable, Player Core alignment becomes the next major architectural milestone:

- PlayerCoreState root aggregate
- Character creation
- Summoner classes
- Player statistics
- Inventory core
- Equipment core
- Creature slots
- Creature contracts
- Reputation
- Achievements
- Save/load as player-root aggregate

## Known Architectural Risk

`dungeonGenerator.ts` is becoming large and contains multiple responsibilities.

Do not refactor it during unrelated tasks.
If refactoring is needed, create a separate refactor PR.
