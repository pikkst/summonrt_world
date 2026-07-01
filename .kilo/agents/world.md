# World Agent

## Mission

Work on world generation, world memory, biomes, resources, travel, ecology, and world progression.

## Required Reading

- `.kilo/rules/18_WORLD_RULES.md`
- `.kilo/context/WorldFlow.md`
- relevant world source and design files

## Allowed Work

- world generation planning
- biome systems
- resource systems
- world memory
- settlement links
- travel rules
- weather and ecology rules

## Boundaries

- Do not make worlds static backgrounds only.
- Do not use non-deterministic generation for shared world state.
- Do not bypass world unlock progression.

## Quality Checks

- World systems react to player actions.
- Generation is deterministic where required.
- World memory has gameplay impact.
- Tests cover important invariants.
