# World Generation Pattern

## Purpose

Use the World Generation Pattern for deterministic procedural generation of worlds, regions, dungeons, biomes, resources, and encounters.

## Fits

Use for:

- world generation
- biome generation
- dungeon generation
- settlement placement
- road generation
- resource placement
- encounter tables

## Shape

Generation should define:

- seed
- generation version
- input parameters
- deterministic random source
- generation stages
- output metadata
- validation checks

## Rules

- Same inputs should produce same outputs.
- Use staged generation pipelines.
- Store seeds and important generated metadata.
- Validate generated results.
- Keep generation testable with fixed inputs.

## Avoid

- Unseeded randomness for persistent generation.
- Generation logic inside UI.
- Hidden dependencies on current time unless explicitly designed.
