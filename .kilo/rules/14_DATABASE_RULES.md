# 14 - Database Rules

## Current Database Direction

SummonerWorld is offline-first in the prototype phase.

Planned persistence path:

```text
Local JSON / SQLite prototype
  -> PostgreSQL online infrastructure
  -> Server-authoritative MMORPG persistence
```

## Data Ownership

Every database model must have clear ownership and purpose.

Planned major persistence entities include:

- Player
- World
- Tile
- CreatureTemplate
- Creature
- ItemTemplate
- InventoryItem
- Structure
- Settlement
- QuestInstance
- NPC
- DungeonRun

## JSON vs Relational Rule

Use relational columns for stable queryable identity and ownership.

Use JSON/JSONB for flexible structured data that is not yet stable enough to normalize.

Examples suitable for JSON during early phases:

- Appearance data
- Trait lists
- Mutation lists
- Dungeon room metadata
- Quest objective progress
- NPC schedules

## Migration Rule

Schema changes must consider:

- Existing saves
- Default values
- Backward compatibility
- Migration scripts
- Test fixtures

Do not break old saves without a documented migration path.

## Server Authority Rule

Future online database state must be server-authoritative for:

- Currency
- Inventory
- Creature ownership
- Marketplace trades
- Guild banks
- PvP results
- Demonlord throne state
- Dungeon party progression

## Deterministic Seed Storage

Store seeds and deterministic inputs, not only generated output, when future synchronization requires regeneration.

Also store generated metadata when it is needed for persistence or party synchronization.

## Database Access Layer

Use service/repository abstraction where practical.

Avoid scattering raw persistence logic across UI components.

## Validation Rule

All imported or external persistence data must be validated before being trusted.

This applies to:

- Save imports
- Future API payloads
- Database migrations
- Marketplace listings
- Account data

## Testing Rule

Persistence work requires tests for:

- Create/read/update behavior
- Round-trip serialization
- Migration behavior when relevant
- Invalid data rejection when relevant

## Forbidden

- No secrets in database config files.
- No client-authoritative online economy state.
- No undocumented schema changes.
- No breaking save data without migration notes.
