# Aggregate Pattern

## Purpose

Use the Aggregate Pattern to define clear ownership boundaries for related state and rules.

## Fits

Use for:

- Player Core
- Creature Contract
- Dungeon Run
- Action
- Report
- Settlement
- Guild
- Market Listing

## Shape

An Aggregate should define:

- aggregate id
- owner or root entity
- child entities
- allowed operations
- invariants
- events emitted
- persistence boundary

## Rules

- The aggregate root controls changes inside the aggregate.
- Avoid changing child state from unrelated systems directly.
- Keep invariants close to the aggregate.
- Persist aggregate state consistently.

## Avoid

- Multiple systems owning the same state.
- Direct mutation of nested state from UI.
- God objects that own unrelated systems.
