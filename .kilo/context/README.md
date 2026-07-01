# Kilo Context

This folder contains quick-reference architecture context for AI coding agents.

Use it to understand how SummonerWorld systems connect before changing code.

## Context Index

- `ProjectStructure.md` - high-level repository and source layout.
- `ModuleMap.md` - major gameplay modules and ownership.
- `DependencyGraph.md` - intended dependency direction.
- `PlayerFlow.md` - player progression flow.
- `CreatureFlow.md` - creature lifecycle flow.
- `DungeonFlow.md` - dungeon tower and clear flow.
- `CombatFlow.md` - combat resolution flow.
- `WorldFlow.md` - world generation and memory flow.
- `SaveFlow.md` - save/load ownership flow.
- `EventFlow.md` - event-driven system communication flow.

## Rule

This folder is a quick navigation layer, not the source of truth.

When implementing, verify details in:

- `SummonerWorld_Tasks.md`
- `SummonerWorld_GDD.md`
- `SummonerWorld_TechnicalSpec.md`
- relevant source files
