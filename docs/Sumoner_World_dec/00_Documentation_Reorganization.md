# Documentation Reorganization

## Reason for Change

The current documentation has grown heavily toward Creature AI. That work is valuable, but it creates the wrong center of gravity if it becomes the main project spine.

SummonerWorld is a Summoner RPG, not a standalone creature simulation.

The correct dependency chain is:

```text
Player
  -> Summoner
    -> Creatures
      -> World
```

This means every major design document should begin from the player experience and only then explain how creatures, NPCs, economy, world simulation, dungeons, and online systems support that experience.

## New Documentation Volumes

### Volume 01 - Player Bible

Defines the full player journey from character creation to World 100 end-game.

Primary topics:
- Character Creation
- Summoner Classes
- Elements
- Player Statistics
- Experience
- Equipment
- Inventory
- Creature Slots
- Creature Contracts
- Summoning
- Creature Commands
- Player Skills
- Talent Trees
- Crafting
- Housing
- Building
- Transportation
- Trading
- Marketplace
- Guilds
- Friends
- PvP
- Achievements
- Statistics
- Save System

### Volume 02 - Creature Bible

Defines creatures as player tools, companions, combat units, economy objects, world inhabitants, and simulation entities.

The existing Creature AI Bible should be kept as a technical sub-volume.

### Volume 03 - World Bible

Defines world generation, travel, world memory, biomes, weather, settlements, roads, world progression, and 100-world structure.

### Volume 04 - NPC Bible

Defines NPC identity, dialogue, factions, reputation, schedules, merchants, trainers, quest givers, and social simulation.

### Volume 05 - Economy Bible

Defines inventory economy, crafting, housing, building, trade, marketplace, professions, resource sinks, settlements, and long-term balance.

### Volume 06 - Dungeon Bible

Defines dungeon towers, room assignment, encounters, bosses, rewards, keys, progression gates, and end-game dungeon loops.

### Volume 07 - MMORPG Bible

Defines accounts, friends, guilds, chat, PvP, shared marketplace, server authority, live operations, moderation, and scaling.

## Existing Creature AI Bible

The current Creature AI Bible should not be deleted.

It should be repositioned as:

```text
Volume 02 - Creature Bible
  -> Technical Appendix A - Creature AI Bible
```

It remains useful for deterministic simulation, offline behavior, ecology, predator systems, memory, learning, territory, and MMO readiness. The change is only its architectural role: it serves the player-facing creature system instead of replacing it.

## New Core Architecture

The project should be organized around:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

This hierarchy does not mean economy is unimportant. It means the player is the primary actor and the rest of the simulation should be reachable through player decisions, events, ownership, progression, or consequences.

## Event-Driven Direction

The project should move toward an event-driven architecture:

```text
Player enters forest
  -> World Event
    -> Spawn Manager
    -> Creature AI
    -> NPC AI
    -> Weather
    -> Quest System
    -> Economy
```

Systems should react to events instead of constantly querying one another. This creates cleaner boundaries, better testability, easier save/load replay, and a more realistic path toward future MMO scaling.

## Next Documentation Priority

The next major document should be:

```text
Volume 01 - Player Core Bible
```

It should become the central design reference for SummonerWorld.
