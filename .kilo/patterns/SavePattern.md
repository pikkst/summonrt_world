# Save Pattern

## Purpose

Use the Save Pattern for persistent state that must survive reload, export/import, offline play, and future online migration.

## Fits

Use for:

- player progression
- inventory
- equipment
- creature contracts
- active actions
- action queues
- reports
- world memory
- dungeon run history

## Shape

Persistent data should define:

- version
- owner
- defaults
- required fields
- optional fields
- migration behavior
- validation behavior

## Rules

- Every save format should be versioned.
- Imported saves are untrusted.
- Missing fields need safe defaults.
- Persistent state should avoid temporary UI-only fields.
- Important procedural systems should store deterministic inputs.

## Avoid

- Silent destructive migrations.
- Unversioned persistent shape changes.
- Duplicated ownership between save modules.
- Trusting imported JSON directly.
