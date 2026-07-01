# Tight Coupling

## Risk

Systems know too much about each other's internals.

## Signs

- Dungeon directly mutates quest, economy, achievement, and memory state.
- UI imports deep domain helpers from many systems.
- A small change requires edits across unrelated modules.

## Preferred Direction

Use:

- `EventPattern.md`
- typed interfaces
- module APIs
- clear ownership boundaries

## Rule

Prefer explicit boundaries over direct internal access.
