# Simulation Pattern

## Purpose

Use the Simulation Pattern for deterministic execution between player decision and final report.

Simulation turns Commands and Actions into results.

## Fits

Use for:

- automated combat
- dungeon expedition resolution
- offline catch-up
- world tick processing
- NPC work
- resource production
- market update
- training progress

## Shape

A Simulation should define:

- input state
- deterministic inputs
- seed when randomness is required
- ruleset version
- processing steps
- generated events
- result summary
- report data

## Flow

```text
Decision
  -> Command
    -> Action
      -> Simulation
        -> Events
          -> Report
```

## Rules

- Use seeded randomness when determinism matters.
- Keep simulation logic out of React components.
- Make simulations testable with fixed inputs.
- Store enough inputs for replay when needed.
- Report both success and failure clearly.

## Avoid

- Hidden Math.random use in deterministic systems.
- UI-driven simulation logic.
- Results that cannot be tested or replayed.
