# Combat Flow

## Core Flow

```text
Encounter
  -> Initiative
  -> Command / Skill Selection
  -> Creature Actions
  -> Damage and Status Resolution
  -> Boss Phase Checks
  -> Rewards or Consequences
```

## Combat Responsibilities

Combat systems should own:

- damage formula
- elemental modifiers
- status effects
- boss phases
- scan ability
- battle logs
- automated combat results

## Design Direction

Combat should be:

- readable
- testable
- deterministic where needed
- compatible with future server validation
- meaningful for player strategy

## Rule

Do not place combat formulas in UI components.

Keep formulas in core/module logic with tests.
