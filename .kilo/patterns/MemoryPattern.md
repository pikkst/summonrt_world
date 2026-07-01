# Memory Pattern

## Purpose

Use the Memory Pattern when important events should affect future gameplay.

Memory turns history into consequences.

## Fits

Use for:

- world memory
- player history
- NPC memory
- creature memory
- settlement memory
- dungeon history
- guild history

## Shape

A Memory entry should define:

- memory id
- scope
- subject id
- event reference
- summary
- impact values
- created time
- expiration rules if any

## Rules

- Memory should be driven by important Events.
- Memory should affect future gameplay, not only flavor.
- Memory should be save/load compatible.
- Memory should be queryable by relevant systems.

## Avoid

- Remembering everything with no gameplay use.
- Flavor-only memory for major events.
- Duplicated memory ownership across systems.
