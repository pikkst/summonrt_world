# Context Engine Examples

## Example 1 - Small Documentation Fix

Task:

```text
Fix typo in combat rules.
```

Context level:

```text
Minimal
```

Initial context:

- `.kilo/rules/20_COMBAT_RULES.md`
- target file section

Do not load:

- full GDD
- full source tree
- unrelated rules

## Example 2 - Combat Feature

Task:

```text
Add battle report summary.
```

Context level:

```text
Standard
```

Initial context:

- `DESIGN_CONSTITUTION.md`
- `.kilo/agents/combat.md`
- `.kilo/rules/20_COMBAT_RULES.md`
- `.kilo/patterns/ReportPattern.md`
- `.kilo/patterns/EventPattern.md`
- relevant combat source files
- relevant combat tests

## Example 3 - Dungeon Simulation Test

Task:

```text
Test full clear World 10 dungeon simulation.
```

Context level:

```text
Standard
```

Initial context:

- `DESIGN_CONSTITUTION.md`
- `.kilo/agents/dungeon.md`
- `.kilo/context/DungeonFlow.md`
- `.kilo/patterns/SimulationPattern.md`
- `.kilo/patterns/WorldGenerationPattern.md`
- `summoner-world/src/core/dungeonGenerator.ts`
- related dungeon tests

## Example 4 - Player Core Refactor

Task:

```text
Refactor save/load around Player Core.
```

Context level:

```text
Deep
```

Initial context:

- `DESIGN_CONSTITUTION.md`
- `.kilo/agents/architect.md`
- `.kilo/agents/player.md`
- `.kilo/rules/17_PLAYER_RULES.md`
- `.kilo/context/PlayerFlow.md`
- `.kilo/context/SaveFlow.md`
- `.kilo/patterns/AggregatePattern.md`
- `.kilo/patterns/SavePattern.md`
- relevant save source files
- relevant player source files

## Rule

Examples are starting points.

Always adjust based on the exact task and discovered dependencies.
