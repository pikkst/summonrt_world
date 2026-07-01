# Circular Dependencies

## Risk

Modules depend on each other in loops.

## Signs

- Player imports Creature and Creature imports Player directly.
- Stores import each other.
- Tests require awkward setup order.
- Build or runtime errors mention circular imports.

## Why It Hurts

- Ownership becomes unclear.
- Initialization becomes fragile.
- Refactors become harder.

## Preferred Direction

Use:

- `EventPattern.md`
- `AggregatePattern.md`
- clear dependency direction
- shared types in neutral folders

## Rule

Break cycles with events, interfaces, or shared types instead of direct two-way imports.
