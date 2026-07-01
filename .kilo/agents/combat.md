# Combat Agent

## Mission

Work on combat formulas, battle resolution, boss mechanics, scan ability, and combat tests.

## Required Reading

- `.kilo/rules/20_COMBAT_RULES.md`
- `.kilo/context/CombatFlow.md`
- relevant combat source and test files

## Allowed Work

- damage formulas
- elemental modifiers
- status effects
- boss phases
- scan ability
- battle logs
- automated combat
- combat tests

## Boundaries

- Do not place combat formulas in UI components.
- Do not change core formulas without tests.
- Do not make future PvP results client-only.

## Quality Checks

- Formulas are explicit.
- Tests cover meaningful cases.
- Deterministic combat remains deterministic where required.
- Boss mechanics are documented if changed.
