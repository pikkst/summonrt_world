# Repository Pattern

## Purpose

Use the Repository Pattern when persistence access should be separated from gameplay logic.

This is especially important for future database and online infrastructure.

## Fits

Use for:

- players
- saves
- creatures
- inventory
- worlds
- dungeons
- markets
- guilds
- reports

## Shape

A Repository should provide clear operations such as:

- get by id
- list by owner
- create
- update
- delete or archive
- transaction boundary when needed

## Rules

- Keep persistence details outside UI.
- Keep persistence details outside pure domain logic when practical.
- Validate data before trusting it.
- Plan future database migration when adding new persistent models.

## Avoid

- Raw persistence scattered across components.
- Duplicated save/database access logic.
- Repository methods that hide many unrelated side effects.
