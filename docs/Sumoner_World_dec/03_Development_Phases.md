# Development Phases

## Current Source of Truth

The active implementation checklist is `SummonerWorld_Tasks.md`.

This document mirrors that checklist at phase level so the design docs and sprint tasks stay aligned.

## Phase 1 - Foundation

Status: Complete

Aligned tasks:
- Sprint 0
- Sprint 1
- Sprint 2
- Sprint 3
- Sprint 4
- Sprint 5

Covered systems:
- Technical foundation
- Career tree data layer
- Mission queue and offline execution
- Core gameplay loop and XP
- Elemental affinity and creature system
- Fusion logic and skill inheritance

## Phase 2 - Player Core and Core Gameplay

Status: In Progress

Current sprint:
- Sprint 6 - Combat and Dungeon System

Completed through:
- T6.4.4 - Dungeon Room Assignment System

Next implementation task:
- T6.4.5 - Create generateDungeonTower(worldIndex)

Player-first documentation added:
- Documentation Reorganization
- Player Core Bible
- Event-Driven Architecture

## Phase 3 - Creature Core

Status: Design expanded, implementation partially complete

Aligned tasks:
- Sprint 4
- Sprint 5
- T15.2
- T15.6
- T15.9

Notes:
- Creature AI Bible is retained as a technical appendix.
- Creature systems must be framed through contracts, slots, summoning, commands, and player progression.

## Phase 4 - World Core

Status: Planned

Aligned tasks:
- Sprint 7
- T15.1
- T15.5
- T15.10

Notes:
- World Identity Memory, world threats, and player-driven world shaping should build on event-driven architecture.

## Phase 5 - Economy Core

Status: Planned

Aligned tasks:
- Sprint 8
- T13.1
- T13.2
- T13.9
- T13.10
- T13.12

Notes:
- Economy should be player-facing first: inventory, crafting, housing, building, professions, trading, and marketplace.

## Phase 6 - NPC and Quest Core

Status: Planned

Aligned tasks:
- Sprint 9
- T15.7

Notes:
- Reputation is a Player Core bridge into NPC, faction, settlement, and creature systems.

## Phase 7 - Save, Testing, and Polish

Status: Planned

Aligned tasks:
- Sprint 10

Notes:
- Player save data is the root aggregate.
- Creature and world state remain attached through contracts, ownership, events, and world references.

## Phase 8 - Online Infrastructure

Status: Planned

Aligned tasks:
- Sprint 11

Notes:
- Event sourcing in T11.11 should be implemented from the event-driven architecture document.

## Phase 9 - MMORPG Alpha

Status: Planned

Aligned tasks:
- Sprint 12

## Phase 10 - MMORPG Beta

Status: Planned

Aligned tasks:
- Sprint 13

## Phase 11 - Launch and Operations

Status: Planned

Aligned tasks:
- Sprint 14
