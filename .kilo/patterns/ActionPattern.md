# Action Pattern

## Purpose

Use the Action Pattern for gameplay processes that take time, require participants or resources, and produce results.

## Fits

Use for:

- quest
- dungeon expedition
- travel
- crafting
- research
- training
- fusion
- building
- settlement upgrade
- guild mission

## Shape

An Action should define:

- id
- type
- owner
- participants
- location
- requirements
- duration
- risk
- state
- progress
- rewards
- failure outcome
- generated events
- report

## Lifecycle

```text
Created
  -> Validated
    -> Queued
      -> Running
        -> Completed | Failed | Cancelled
          -> Reported
            -> Archived
```

## Rules

- Actions must be validateable before execution.
- Actions should produce Events when important state changes.
- Actions should usually produce Reports.
- Actions should be save/load compatible.
- Actions should be deterministic when used for offline catch-up or future online replay.

## Avoid

- One-off systems that duplicate Action lifecycle.
- Instant results where time, risk, or planning should matter.
- UI-only action state that cannot be saved.
