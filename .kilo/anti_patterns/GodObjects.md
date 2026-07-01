# God Objects

## Risk

One file, class, store, or service starts owning many unrelated responsibilities.

## Signs

- Handles player, creature, world, economy, UI, and save logic together.
- Has many unrelated methods.
- Is hard to test without setting up the whole game.
- Other systems depend on it for everything.

## Why It Hurts

- Ownership becomes unclear.
- Tests become heavy.
- Refactors become risky.
- Future MMO authority boundaries become harder.

## Preferred Direction

Use:

- `AggregatePattern.md`
- `RepositoryPattern.md`
- `EventPattern.md`
- clear module ownership

## Rule

Keep Player Core as root, but do not turn it into a container for every system detail.
