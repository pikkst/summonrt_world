# Task Alignment Matrix

## Purpose

This file keeps `docs/Sumoner_World_dec` aligned with `SummonerWorld_Tasks.md`.

The task file remains the implementation checklist. This folder explains the design intent, architecture, and documentation structure behind those tasks.

## Current Task State

Current sprint:
- Sprint 6 - Combat and Dungeon System

Completed through:
- T6.4.4 - Dungeon Room Assignment System

Completed ahead of sequence:
- T6.4.7 - Deterministic floor seed system
- T6.4.9 - Pathfinding utilities

Partially completed:
- T6.4.10 - Dungeon generation tests; remaining coverage should include 100-floor simulation and boss-floor reachability.

Next:
- T6.4.5 - Create generateDungeonTower(worldIndex)

## Completed Task Evidence

Implementation notes already exist in root `docs/` for:

- Sprint 0
- Sprint 1
- Sprint 2
- Sprint 3
- Sprint 4
- Sprint 5
- T6.0.1
- T6.0.4
- T6.0.5
- T6.0.6
- T6.0.7
- T6.1
- T6.2
- T6.3
- T6.4.1
- T6.4.2
- T6.4.3
- T6.4.4
- T6.4.7
- T6.4.9

## Documentation Volume Mapping

| Task Area | Documentation Volume | Current Document |
|---|---|---|
| Sprint 0-3 foundation/game loop | Player Bible / Architecture | Project Vision, Master Roadmap, Player Core Bible |
| Sprint 4 elements and creatures | Player Bible / Creature Bible | Element System, Creature System |
| Sprint 5 fusion | Creature Bible | Creature Fusion, Creature Genetics |
| Sprint 6 combat and dungeon | Dungeon Bible / Player Bible | Combat System, Dungeon Bible |
| Sprint 6.5 player core alignment | Player Bible / Architecture | Player Core Bible, Character System, Event-Driven Architecture |
| Sprint 7 world generation | World Bible | World Generation, World Memory System |
| Sprint 8 economy/housing/crafting | Economy Bible | Economy System, Housing System, Player Core Bible |
| Sprint 9 NPCs/quests/ecosystem | NPC Bible / World Bible | NPC System, Quest System, World Memory System |
| Sprint 10 save/testing/polish | Player Bible / Architecture | Player Core Bible, AI Development Guidelines |
| Sprint 11 online infrastructure | MMORPG Bible / Architecture | Event-Driven Architecture |
| Sprint 12 MMO alpha | MMORPG Bible | Epic Index, Player Core Bible |
| Sprint 13 economy and PvP beta | Economy Bible / MMORPG Bible | Economy System, Player Core Bible |
| Sprint 14 launch | MMORPG Bible | Master Roadmap |
| T15 systems expansion | World Bible / Creature Bible / Player Bible | World Memory System, Creature AI Bible, Player Core Bible |
| Sprint 16 documentation completion | All volumes | Documentation Reorganization, Task Alignment Matrix |

## Sprint 6 Clarifications

Some tasks in Sprint 6 overlap with earlier completed items.

Use this interpretation:

- T6.2 is complete: boss phase mechanics exist.
- T6.5 remains open as an extension task: environmental hazard rotation and Summoner career bonus integration.
- T6.3 is complete: Scan ability exists.
- T6.6 remains open as an extension task: SCAN skill pool integration and final UI feedback.
- T6.4.4 is complete: room type assignment exists.
- T6.4.7 is complete: floor seeds use `hash(worldIndex, floorIndex, globalSeed)` and deterministic graph tests exist.
- T6.4.9 is complete: `findShortestPath`, `findAllShortestPaths`, and `calculateRoomDistanceMap` exist and are tested.
- T6.4.10 remains partially open: current tests cover the implemented floor generator, but final boss-floor and large simulation coverage should be added with T6.4.6/T6.8.
- T6.7 remains open as an interaction/UI task for trap, puzzle, treasure, elite, and vendor rooms.

## Player-First Architecture Mapping

The task backlog should be read through this dependency chain:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

This means:

- Character creation, progression, inventory, equipment, save data, and statistics belong to Player Core.
- Creature generation, capture, contracts, command behavior, fusion, mutation, and AI belong to Creature Core.
- Biomes, weather, travel, dungeons, world memory, threats, and world shaping belong to World Core.
- NPC schedules, relationships, factions, rumors, quests, and reputation belong to NPC Core.
- Crafting, housing, trade, caravans, marketplace, pricing, and professions belong to Economy Core.

## Newly Added Task Groups

`SummonerWorld_Tasks.md` now includes these task groups from the current documentation set:

- Sprint 6.5 - Player Core Architecture Alignment
- T7.13-T7.15 - World travel, world events, and World 100 progression map
- T8.17-T8.19 - Professions, marketplace rules, and economy events
- T9.16-T9.17 - NPC/quest events and reputation integration
- T10.0, T10.22, T10.23 - EventBus, event replay tests, and Player Core UI panels
- T11.13-T11.14 - Server-authoritative event validation and event audit tooling
- T15.11-T15.12 - Demonlord throne-cycle end game and Creature Bible integration
- Sprint 16 - Documentation Volume Completion

## Event-Driven Mapping

Tasks that should be implemented with event-driven architecture:

- T7 world travel and biome entry
- T8 crafting, housing, trade, and marketplace
- T9 NPC schedules, quests, and ecosystem simulation
- T10 save/load and migration systems
- T11.11 event sourcing
- T12 party, guild, chat, and location broadcast
- T13 marketplace, PvP, world events, and territory control
- T15 world memory, dungeon history, threats, and world shaping

## Documentation Gaps

Recommended next docs:

- `30_Creature_Bible.md`
- `31_World_Bible.md`
- `32_Economy_Bible.md`
- `33_NPC_Bible.md`
- `34_MMORPG_Bible.md`
