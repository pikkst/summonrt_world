# Duplicate Logic

## Risk

The same gameplay rule is implemented in multiple places.

## Signs

- Same formula appears in UI and core logic.
- Save/load validation exists in several versions.
- Reward rules are copied between systems.
- Similar event payloads are created differently.

## Why It Hurts

- Bugs are fixed in one place but remain elsewhere.
- Systems drift over time.
- AI agents may update the wrong copy.

## Preferred Direction

Use:

- `FactoryPattern.md`
- `ValidationPattern.md`
- `ActionPattern.md`
- shared domain functions

## Rule

Search before creating new logic. Prefer one source of truth.
