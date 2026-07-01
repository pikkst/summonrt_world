# Manager Explosion

## Risk

The project gains many vague manager classes or services without clear ownership.

## Signs

- Files named `SomethingManager` own unrelated rules.
- Managers call other managers in long chains.
- It is unclear which system owns data.
- New features create new managers by default.

## Why It Hurts

- Architecture becomes hard to navigate.
- Ownership boundaries disappear.
- AI agents duplicate orchestration layers.

## Preferred Direction

Use:

- domain modules
- `AggregatePattern.md`
- `ActionPattern.md`
- `RepositoryPattern.md`

## Rule

Name modules by domain responsibility, not vague control words.
