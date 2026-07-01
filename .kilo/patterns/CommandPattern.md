# Command Pattern

## Purpose

Use the Command Pattern for player or system intent before validation and execution.

A Command says what someone wants to do.

An Action is what gets scheduled or executed after validation.

## Fits

Use for:

- start dungeon expedition
- begin crafting
- assign creature training
- start travel
- accept quest
- begin research
- create trade listing

## Shape

A Command should define:

- command id
- actor id
- command type
- target ids
- requested parameters
- context
- timestamp

## Flow

```text
Command
  -> Validation
    -> Action Created
      -> Action Queue
```

## Rules

- Commands are intent, not proof that the action is valid.
- Commands must be validated before state changes.
- Commands should not directly mutate many systems.
- Future online Commands should be treated as requests until validated.

## Avoid

- Letting UI bypass validation.
- Treating client intent as final truth.
- Mixing command parsing with gameplay simulation.
