# 06 - Refactor Rules

## Refactor Definition

A refactor changes structure without changing intended behavior.

If behavior changes, it is not only a refactor and must be documented as a gameplay or feature change.

## Dedicated Refactor Rule

Large refactors require their own branch and Pull Request.

Do not hide large refactors inside feature tasks.

## Allowed Small Refactors Inside Feature Tasks

Small refactors are allowed only when they directly support the task.

Examples:

- Extracting a helper used by the new test.
- Moving duplicated local logic into an existing utility.
- Renaming a private variable for clarity.
- Adding a type to remove unsafe casts.

## Forbidden Refactors Inside Feature Tasks

Do not perform these unless the task explicitly asks for them:

- Moving entire systems.
- Renaming public APIs across the project.
- Rewriting store architecture.
- Splitting large files unrelated to the task.
- Changing folder structure globally.
- Replacing working logic with a new pattern.

## Refactor Safety Checklist

Before refactoring, confirm:

- The existing behavior is understood.
- Tests exist or will be added.
- Public APIs are preserved unless intentionally changed.
- Save/load compatibility is preserved.
- Deterministic output remains unchanged where required.
- Documentation impact is known.

## Recommended Refactor Pattern

1. Add tests around existing behavior.
2. Refactor in small steps.
3. Run tests after each meaningful change.
4. Keep commits understandable.
5. Document why the refactor was needed.

## Large File Rule

Large files may be split only through a dedicated refactor task unless the current task explicitly requires the split.

Known candidate for future refactor:

```text
summoner-world/src/core/dungeonGenerator.ts
```

Potential future split:

```text
core/dungeon/DungeonSeeds.ts
core/dungeon/MazeGenerator.ts
core/dungeon/RoomAssignment.ts
core/dungeon/Pathfinding.ts
core/dungeon/BossArenaGenerator.ts
core/dungeon/DungeonTowerGenerator.ts
core/dungeon/DungeonHazards.ts
```

Do not perform this split during unrelated feature work.
