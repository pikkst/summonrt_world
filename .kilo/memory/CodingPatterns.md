# Coding Patterns

## Purpose

This file tracks practical coding patterns that AI agents should preserve.

It is a short memory helper, not a replacement for `.kilo/rules` or formal documentation.

## Gameplay Logic Pattern

Prefer this direction:

```text
React UI
  -> Store action
    -> Core/module function
      -> Typed result/event
        -> Store update
```

Avoid placing gameplay formulas directly inside React components.

## Deterministic Generation Pattern

For deterministic systems:

```text
input seed + stable parameters -> seeded random -> generated result
```

Do not use `Math.random()` for deterministic gameplay.

## Task Implementation Pattern

For each task:

```text
Read docs
Search existing code
Create branch
Implement only task
Add tests
Update docs if needed
Run validation
Open PR
```

## Player Core Pattern

Player Core should own or reference player-owned state:

- Identity
- Progression
- Inventory
- Equipment
- Creature contracts
- Quests
- Reputation
- Achievements
- Statistics
- Save metadata

Player Core should not own world generation internals or dungeon generation algorithms.

## Dungeon Testing Pattern

Dungeon tests should protect invariants:

- Graph connected
- Entrance exists
- Boss room exists
- Entrance-to-boss path exists
- Room IDs unique
- Vertical links valid
- Same seed gives same output

## Documentation Update Pattern

When behavior changes:

- Gameplay -> GDD/system bible
- Architecture -> TechnicalSpec
- Task status -> SummonerWorld_Tasks.md
- AI workflow -> `.kilo` files

## PR Pattern

Every PR should include:

- Summary
- Validation
- Documentation notes
- Known limitations
- Follow-up tasks if needed
