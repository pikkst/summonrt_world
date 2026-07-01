# Future Ideas

## Purpose

This file collects future ideas that should not be implemented unless they become real tasks.

AI agents must not treat this file as an active task list.

## Possible Future AI Framework Additions

- `.kilo/checklists/`
- `.kilo/templates/`
- `.kilo/examples/`
- `.kilo/context/`
- ADR templates
- PR templates
- Issue templates
- Bug report templates
- Feature specification templates

## Possible Future Refactors

### Dungeon Generator Split

Potential future module split:

```text
core/dungeon/DungeonSeeds.ts
core/dungeon/MazeGenerator.ts
core/dungeon/RoomAssignment.ts
core/dungeon/Pathfinding.ts
core/dungeon/BossArenaGenerator.ts
core/dungeon/DungeonTowerGenerator.ts
core/dungeon/DungeonHazards.ts
```

Only do this through a dedicated refactor task.

## Possible Future Gameplay Expansions

- Creature contract UI
- Player Core root aggregate
- World memory event viewer
- Dungeon full clear simulation UI
- Demonlord floor manager UI
- NPC reputation dialogue layer
- Supply/demand economy simulation
- Guild support for dungeon challenges
- Marketplace rules and taxes

## Rule

Do not implement ideas from this file without user confirmation and a task-specific branch.
