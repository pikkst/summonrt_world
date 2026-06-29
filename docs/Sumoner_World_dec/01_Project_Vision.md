# SummonerWorld - Project Vision

## Vision

SummonerWorld is a browser-based Summoner RPG about the player becoming a legendary summoner across 100 persistent worlds.

Creatures are essential, but they are not the center of the game by themselves. The center is the player journey:

```text
Player
  -> Summoner
    -> Creatures
      -> World
```

The player creates a character, chooses an element, grows as a summoner, forms contracts with creatures, explores worlds, joins social systems, builds a home, participates in the economy, and eventually reaches Floor 100 to challenge the Demonlord. Defeating the Demonlord makes the player the new Demonlord with floor manager powers until another player challenges and defeats them.

## Core Identity

SummonerWorld is not a Creature Simulator.

SummonerWorld is a Summoner RPG where creatures are powerful tools, companions, tactical options, economic assets, and story anchors for the player.

## Core Goals

- Player-first RPG progression
- Character creation and long-term identity
- Element selection with permanent build consequences
- Creature collection, contracts, commands, training, fusion, and genetics
- Inventory, equipment, crafting, housing, guilds, marketplace, reputation, and achievements
- 100 persistent worlds with travel, memory, economy, NPCs, dungeons, and events
- Event-driven architecture for clean system boundaries
- Offline-first architecture that can evolve toward MMORPG infrastructure

## Design Pillars

1. Player Agency
2. Meaningful Summoner Progression
3. Creatures as Player Tools and Companions
4. Living Event-Driven World
5. Long-Term Economy and Social Systems
6. Offline-First, MMO-Ready Architecture

## Architectural Direction

All major systems should be designed around the player core:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

Creature AI remains valuable technical documentation, but it is subordinate to the player experience. A creature does not exist in isolation; it exists because a player can discover it, contract it, command it, trade around it, fight with it, breed it, lose it, remember it, or build a strategy around it.

## Documentation Direction

The project documentation should be reorganized into volumes:

1. Player Bible
2. Creature Bible
3. World Bible
4. NPC Bible
5. Economy Bible
6. Dungeon Bible
7. MMORPG Bible

The next primary document should be the Player Core Bible. It defines the player journey from character creation to World 100 end-game and becomes the foundation for the other volumes.

## Current Development Status

Current Phase:
- Sprint 6

Current Task:
- T6.4.4 - Dungeon Room Assignment System

Completed:
- Sprint 0
- Sprint 1
- Sprint 2
- Sprint 3
- Sprint 4
- Sprint 5

The roadmap must preserve completed work while shifting the long-term architecture toward a player-first Summoner RPG.
