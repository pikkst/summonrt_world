# 13 - State Management Rules

## State Philosophy

State must have clear ownership.

Do not place the same source of truth in multiple systems.

## Zustand Usage

SummonerWorld uses Zustand for client state.

Store modules should compose game state and actions, not become a dumping ground for unrelated logic.

## Store Responsibility

Stores may:

- Hold current UI/game state.
- Dispatch actions.
- Coordinate core module calls.
- Persist selected state where appropriate.

Stores should not:

- Contain large procedural generation algorithms.
- Contain complex combat formulas.
- Contain economy simulation internals.
- Contain save migration logic when that belongs in a save module.

## Root Aggregate Direction

Player Core should become the root aggregate for player-owned state.

Future save/load should attach persistent player-owned systems under Player Core, including:

- Identity
- Progression
- Inventory
- Equipment
- Creature contracts
- Titles
- Achievements
- Statistics
- Reputation
- World unlocks
- Save metadata

## Derived State

Do not store values that can be safely derived unless there is a performance or persistence reason.

Examples of derived state:

- Aggregate passive bonuses
- Equipment-modified stats
- Mission remaining time
- UI filter results

## Persistence Rule

Only persist intentional state.

Before adding persisted fields, determine:

- Owner
- Default value
- Migration needs
- Save/load compatibility
- Future server authority impact

## Action Rules

Store actions should be named clearly and do one thing.

Avoid actions that mutate many unrelated systems without publishing or documenting the cross-system effect.

## Event Integration

As EventBus is introduced, cross-system reactions should move toward events.

Example:

```text
store action: completeDungeonFloor()
  -> emits DungeonFloorCleared
  -> achievements/reputation/world memory react
```

## Testing State

State changes should be testable without requiring full UI rendering.

Prefer pure helpers for calculations and store-level tests for state transitions.

## Forbidden

- Duplicate source of truth.
- Hidden mutation across unrelated modules.
- Large gameplay algorithms inside React components.
- Large gameplay algorithms inside store actions when they belong in core modules.
- Persisting temporary UI-only state unless intentionally needed.
