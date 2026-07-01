# State Machine Pattern

## Purpose

Use the State Machine Pattern when an entity has a controlled lifecycle with allowed transitions.

## Fits

Use for:

- Actions
- dungeon runs
- quests
- reports
- creature contracts
- crafting jobs
- research projects
- trades
- marketplace listings

## Shape

A State Machine should define:

- state enum
- allowed transitions
- transition triggers
- validation rules
- side effects
- events emitted on transition

## Example Lifecycle

```text
Created
  -> Queued
    -> Running
      -> Completed
        -> Reported
          -> Archived
```

Alternative end states:

```text
Failed
Cancelled
Expired
```

## Rules

- Invalid transitions must be rejected.
- Side effects should be explicit.
- Persistent state machines need migration-safe defaults.
- Important transitions should emit Events.

## Avoid

- Boolean flag explosions.
- Ambiguous states.
- Silent state changes across unrelated systems.
