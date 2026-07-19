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

According to the active task list, Sprint 0 through Sprint 8 are complete.

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
- Combat and dungeon system
- World generation and navigation
- Economy, housing and crafting
- NPC AI, quests and ecosystem simulation

## Current Main Area

Sprint 9: NPCs, Quests and Ecosystem.

Important ecosystem systems now exist:

- Ecosystem simulation per world tick
- Resource regeneration (plants 30 days, ore 90 days)
- Population dynamics (birth, death, migration)
- Player impact tracking (overhunting, deforestation, pollution)

## Next High-Value Task

The recommended next implementation task is:

```text
T9.11 - Add ecological balance compensator
```

This should be implemented as a dedicated branch and Pull Request.

Suggested branch:

```text
feature/T9.11-ecological-balance-compensator
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
