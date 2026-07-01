# Dungeon Flow

## Tower Flow

```text
World Unlocked
  -> Dungeon Tower Available
  -> Floor Generated
  -> Rooms Traversed
  -> Guardian / Boss Defeated
  -> Floor Cleared
  -> Next Floor Unlocked
  -> Safe Floor Every 10 Floors
  -> Final Boss Floor
  -> World Progression
```

## Current Important Area

Sprint 6 focuses heavily on combat and dungeon systems.

Known important file:

```text
summoner-world/src/core/dungeonGenerator.ts
```

## Core Invariants

Dungeon systems should preserve:

- deterministic generation
- connected floor graph
- valid entrance room
- valid boss or exit room
- entrance-to-boss path
- valid vertical tower links
- safe floor metadata
- boss floor reachability

## Recommended Next Task

```text
T6.12 - Test full clear World 10 dungeon simulation
```

## Rule

Do not refactor the dungeon generator during unrelated feature work.
