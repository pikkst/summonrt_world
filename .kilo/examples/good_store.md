# Good Store Example

## Purpose

Stores should coordinate state and actions.

Stores should not contain large gameplay systems.

## Recommended Shape

A good store should:

- Keep state ownership clear.
- Use small named actions.
- Delegate calculations to core logic.
- Persist only intentional gameplay state.
- Avoid duplicate sources of truth.

## Example

Store: DungeonRunStore

State:

- active run id
- current floor id
- cleared room ids
- run status

Actions:

- start run
- enter room
- clear room
- complete floor

Core logic outside the store:

- floor generation
- pathfinding
- boss scaling
- reward calculation

## Why This Is Good

- Store actions stay readable.
- Gameplay rules remain testable.
- Save/load ownership is easier to understand.
