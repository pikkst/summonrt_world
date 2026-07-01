# 22 - Save System Rules

## Save Philosophy

Save/load is a core gameplay system, not a technical afterthought.

SummonerWorld is offline-first now and MMO-ready later, so save state must be stable, explicit, validated, and migration-friendly.

## Root Aggregate Direction

Player Core should become the root save aggregate for player-owned state.

Player-owned save data should include:

- Identity
- Summoner profile
- Level and XP
- Elements
- Class
- Inventory
- Equipment
- Skills and talents
- Titles
- Achievements
- Statistics
- Reputation
- Creature contracts
- Housing references
- Quest history
- World unlocks
- Save metadata

## World and Dungeon State

World and dungeon state may be referenced from Player Core but should preserve their own clear structures.

Examples:

- World seed
- Discovered tiles
- World memory
- Settlement state
- Dungeon run state
- Dungeon metadata
- Demonlord throne history

## Save Slot Rules

The planned save system includes:

- 3 manual slots
- 1 auto-slot
- JSON export/import
- Future cloud save replacement

Do not introduce save behavior that blocks this plan.

## Versioning Rule

Every save format should include a version.

Versioned saves allow:

- Migration
- Debugging
- Backward compatibility
- Future online conversion

## Migration Rule

When changing persistent structures:

1. Add sensible defaults.
2. Preserve existing data where practical.
3. Document migration behavior.
4. Add tests for round-trip compatibility when practical.

## Validation Rule

Imported saves are untrusted.

Validate:

- Version
- Required fields
- Entity IDs
- Numeric bounds
- Array/object shapes
- Impossible states

## Deterministic State Rule

For procedural systems, save enough deterministic inputs to reproduce state.

For systems requiring persistence or multiplayer sync, save generated metadata too.

Example for dungeons:

- worldIndex
- floorIndex
- globalSeed
- floor graph
- room types
- treasure locations
- boss room ID
- cleared rooms
- party run state

## Future Online Rule

Future cloud saves must be server-authoritative.

The client may cache state, but final authority for online mode belongs to the server.

## Testing Rule

Save system changes require tests for:

- Save creation
- Save loading
- Export/import
- Round-trip equality
- Missing field defaults
- Migration behavior
- Invalid save rejection when relevant

## Forbidden

- No silent destructive migrations.
- No unversioned save format changes.
- No trusting imported JSON blindly.
- No persisting temporary UI state as gameplay state unless intentionally designed.
- No breaking completed sprint data without migration notes.
