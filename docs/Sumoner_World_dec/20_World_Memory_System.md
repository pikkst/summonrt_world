# World Memory System

## Purpose

Every world remembers player actions.

World memory is not only simulation flavor. It is how the world reacts to the player's long-term identity, reputation, economy behavior, creature impact, dungeon activity, and building choices.

## Player-First Rule

World memory should answer:

```text
What did the player do here, and how did the world change because of it?
```

## Tracked Values

- Boss defeats
- Dungeon clears
- Player deaths
- Puzzle solves
- Forest destruction
- Creature extinction
- Creature protection
- Trade activity
- Crafting activity
- Exploration percentage
- Population
- Pollution
- Settlement growth
- Reputation
- Guild activity
- Built structures

## World Identity State

Aligned with T15.1:

- aggression_score
- ecology_score
- trade_score
- exploration_score
- dungeon_activity_score

## Dynamic Effects

- New quests
- NPC dialogue
- Economy changes
- Biome evolution
- Rare events
- Sanctuary events
- Merchant spawns
- Elite encounter rate
- Dungeon difficulty changes
- World threat events

## Event-Driven Hooks

World memory should react to events such as:

- PlayerEnteredWorld
- PlayerEnteredBiome
- PlayerCompletedQuest
- PlayerClearedDungeonFloor
- PlayerDefeatedBoss
- PlayerCraftedItem
- PlayerTradedItem
- PlayerBuiltStructure
- CreaturePopulationChanged
- ResourceNodeDepleted
- SettlementPolicyChanged

## Related Task Backlog

- T15.1 - World Identity Memory System
- T15.3 - Dynamic Dungeon Difficulty
- T15.5 - Global World Threats
- T15.7 - Player Reputation System
- T15.8 - Dungeon Lore Memory
- T15.10 - Player-Driven World Shaping

## MMO Goal

Each server develops a unique history while still preserving deterministic, auditable event records for important state changes.
