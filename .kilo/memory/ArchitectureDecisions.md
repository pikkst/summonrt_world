# Architecture Decisions

## Purpose

This file records important architecture decisions in short form so AI agents can preserve the project's direction.

For permanent detailed decisions, create or update proper documentation.

## ADR-000 - Design Constitution Is Highest Design Source

Decision:

```text
DESIGN_CONSTITUTION.md defines the highest-level gameplay identity of SummonerWorld.
```

Reason:

SummonerWorld needs a stable design philosophy that guides all future features, AI-agent work, UI decisions, and architecture choices.

Impact:

- AI agents must read `DESIGN_CONSTITUTION.md` before implementation.
- Repetitive clicking should be replaced with meaningful decisions when possible.
- Actions, Events, Reports, time, and World Memory become recurring design concepts.
- SummonerWorld should be described as a Strategic Commander Browser RPG.

## ADR-001 - Player-First Architecture

Decision:

```text
Player Core is the architectural root.
```

Reason:

SummonerWorld is a Summoner RPG. Creatures, worlds, dungeons, NPCs, and economy systems must support the player journey.

Dependency direction:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

Impact:

- Creature AI must not become the project root.
- Save/load should move toward Player Core as root aggregate.
- Systems should answer how they affect player agency and progression.

## ADR-002 - Offline First, MMO Compatible

Decision:

```text
Build offline prototype first, but keep all systems compatible with future server authority.
```

Impact:

- Deterministic generation is important.
- Avoid client-authoritative assumptions for future online economy/PvP/trading.
- Save/load design should not block future cloud saves.

## ADR-003 - One Task, One Branch, One Pull Request

Decision:

```text
Every new task gets its own branch and Pull Request.
```

Reason:

This keeps AI-agent work reviewable and prevents unrelated changes from mixing.

## ADR-004 - Event-Driven Direction

Decision:

```text
Future cross-system reactions should move toward typed domain events.
```

Example:

```text
DungeonBossDefeated
  -> QuestSystem
  -> WorldMemory
  -> AchievementSystem
  -> ReputationSystem
  -> EconomySystem
```

Impact:

- Avoid direct cross-system coupling when events would be cleaner.
- Event replay should support save/load, memory, achievements, and future MMO auditability.

## ADR-005 - Dungeon Refactor Deferred

Decision:

```text
Do not split dungeonGenerator.ts during unrelated tasks.
```

Reason:

The file is large, but functional. A split should be a dedicated refactor PR with tests.

Potential future modules:

- DungeonSeeds
- MazeGenerator
- RoomAssignment
- Pathfinding
- BossArenaGenerator
- DungeonTowerGenerator
- DungeonHazards
