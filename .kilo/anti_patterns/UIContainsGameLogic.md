# UI Contains Game Logic

## Risk

React components contain gameplay rules, formulas, generation logic, or save decisions.

## Signs

- Damage formulas inside components.
- Dungeon generation triggered in render.
- UI directly mutates deep gameplay state.
- Component tests require full gameplay setup.

## Why It Hurts

- Gameplay becomes hard to test.
- UI refactors can break rules.
- Future server validation becomes harder.

## Preferred Direction

Use:

- core/module functions
- store actions
- `CommandPattern.md`
- `SimulationPattern.md`

## Rule

UI collects player intent and displays results. Gameplay rules belong in core or module logic.
