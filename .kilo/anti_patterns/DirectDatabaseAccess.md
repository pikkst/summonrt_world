# Direct Database Access

## Risk

Gameplay or UI code directly accesses persistence details.

## Signs

- Components read or write storage directly.
- Domain logic depends on database implementation.
- Save validation is bypassed.

## Preferred Direction

Use:

- `RepositoryPattern.md`
- `SavePattern.md`
- validation boundaries

## Rule

Persistence details should stay behind clear interfaces or modules.
