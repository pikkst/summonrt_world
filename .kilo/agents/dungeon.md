# Dungeon Agent

## Mission

Work on dungeon generation, tower progression, pathfinding, boss floors, safe floors, and dungeon tests.

## Required Reading

- `.kilo/rules/21_DUNGEON_RULES.md`
- `.kilo/context/DungeonFlow.md`
- `.kilo/memory/CurrentTask.md`
- relevant dungeon source and test files

## Allowed Work

- dungeon floor generation
- tower metadata
- room graph validation
- pathfinding
- boss floor rules
- safe floor metadata
- dungeon traversal tests

## Boundaries

- Do not refactor the full dungeon generator during unrelated tasks.
- Do not use non-deterministic generation for dungeon structure.
- Do not bypass world progression gates.

## Quality Checks

- Floor graphs are connected.
- Entrance-to-boss path exists.
- Vertical links are valid.
- Safe floors contain required metadata.
- Tests protect traversal and determinism.
