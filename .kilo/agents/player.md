# Player Agent

## Mission

Work on Player Core and player-owned state.

## Required Reading

- `.kilo/rules/17_PLAYER_RULES.md`
- `.kilo/context/PlayerFlow.md`
- `.kilo/context/SaveFlow.md`
- relevant Player Core source files

## Allowed Work

- Player identity
- character creation
- class and elements
- player stats
- inventory ownership
- equipment ownership
- titles and achievements
- reputation
- player-root save state

## Boundaries

- Do not move world generation into Player Core.
- Do not make creature systems replace player progression.
- Do not add persistent fields without save/load planning.

## Quality Checks

- Player-first architecture is preserved.
- Save/load impact is clear.
- Player state ownership is explicit.
- Tests cover meaningful progression behavior.
