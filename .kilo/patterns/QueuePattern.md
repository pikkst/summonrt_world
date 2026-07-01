# Queue Pattern

## Purpose

Use the Queue Pattern for ordered pending work that should execute over time or in controlled sequence.

## Fits

Use for:

- action queue
- crafting queue
- research queue
- training queue
- building queue
- report inbox processing
- offline catch-up batches

## Shape

A Queue item should define:

- item id
- owner id
- type
- priority
- created time
- start time
- expected end time
- current state
- cancellation rules

## Rules

- Queue ordering must be explicit.
- Queue limits should be clear.
- Queue state must be save/load compatible.
- Offline catch-up should process queues deterministically.
- Future online queues must avoid duplicate processing.

## Avoid

- Hidden timers outside queue state.
- Multiple queues owning the same Action.
- Queue items that cannot be inspected or cancelled when design allows cancellation.
