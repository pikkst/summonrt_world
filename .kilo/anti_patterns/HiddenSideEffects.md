# Hidden Side Effects

## Risk

A function appears to return a value but also changes unrelated state.

## Signs

- Helper functions mutate stores.
- Validation changes gameplay state.
- Report creation secretly updates inventory.
- Tests need unexpected setup.

## Why It Hurts

- Behavior is hard to reason about.
- Bugs appear far from the changed code.
- Future replay and audit become harder.

## Preferred Direction

Use:

- explicit Commands
- explicit Actions
- `EventPattern.md`
- clear state transitions

## Rule

Important state changes must be explicit and testable.
