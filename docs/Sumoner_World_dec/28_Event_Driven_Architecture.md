# Event-Driven Architecture

Version: 1.0 Draft

## 1. Purpose

SummonerWorld should move toward an event-driven architecture so major systems react to meaningful changes instead of constantly querying one another.

This supports:

- Cleaner boundaries
- Easier testing
- Deterministic save/load
- Offline simulation
- Better debugging
- Future MMO scaling

## 2. Core Idea

Instead of direct system chains like this:

```text
Creature AI asks World
Creature AI asks Weather
Creature AI asks Quest System
Creature AI asks Economy
```

Use events:

```text
Player enters forest
  -> WorldEvent.PlayerEnteredBiome
    -> Spawn Manager reacts
    -> Creature AI reacts
    -> NPC AI reacts
    -> Weather reacts
    -> Quest System reacts
    -> Economy reacts
```

## 3. Event Ownership

Player Core should publish player-driven events.

Examples:

- PlayerCreated
- PlayerElementSelected
- PlayerLevelChanged
- PlayerEnteredWorld
- PlayerEnteredBiome
- PlayerStartedQuest
- PlayerCompletedQuest
- PlayerEquippedItem
- PlayerSummonedCreature
- PlayerCommandedCreature
- PlayerCraftedItem
- PlayerBuiltStructure
- PlayerJoinedGuild
- PlayerListedMarketItem

Creature Core should publish creature-driven events.

Examples:

- CreatureContracted
- CreatureSummoned
- CreatureCommandAccepted
- CreatureCommandRefused
- CreatureLevelChanged
- CreatureEvolved
- CreatureFused
- CreatureMutated
- CreatureInjured
- CreatureDefeated
- CreatureBondChanged

World Core should publish world-driven events.

Examples:

- WorldGenerated
- BiomeEntered
- WeatherChanged
- SeasonChanged
- ResourceSpawned
- DungeonDiscovered
- RoadUnlocked
- SettlementChanged

NPC Core should publish NPC-driven events.

Examples:

- NPCMetPlayer
- NPCReputationChanged
- NPCQuestOffered
- NPCShopInventoryChanged
- FactionStandingChanged

Economy Core should publish economy-driven events.

Examples:

- ItemCrafted
- ItemTraded
- MarketListingCreated
- MarketListingPurchased
- CurrencyChanged
- SettlementDemandChanged

## 4. Event Flow Example

Scenario:

The player enters a forest in World 12.

```text
Player Core
  publishes PlayerEnteredBiome(playerId, worldId, biomeId)

World Core
  updates exploration state
  publishes BiomeEntered

Spawn Manager
  evaluates biome tables
  publishes CreatureSpawnRequested

Creature Core
  creates eligible creatures
  publishes CreatureSpawned

NPC Core
  checks nearby NPC schedules and faction hooks

Quest System
  checks exploration, hunting, gathering, and escort quest triggers

Weather System
  checks biome weather pressure

Economy Core
  updates regional resource demand if player gathering becomes active
```

## 5. Event Bus Requirements

The event bus should support:

- Typed event names
- Payload schemas
- Deterministic ordering
- Priority when needed
- Debug logging
- Replay for tests
- Save/load compatibility
- Offline event queue
- Future server-side validation

## 6. Event Payload Rules

Event payloads should be small and explicit.

Good:

```json
{
  "type": "PlayerEnteredBiome",
  "playerId": "player_1",
  "worldId": "world_12",
  "biomeId": "forest_03",
  "timestamp": 120500
}
```

Avoid putting large mutable objects inside events. Systems should receive IDs and read their own state through approved stores.

## 7. Testing Model

Event-driven systems should be testable by replaying events.

Example test:

```text
Given player has unlocked World 12
When PlayerEnteredBiome is published for forest_03
Then Spawn Manager queues forest creature spawns
And Quest System checks forest quest triggers
And Economy Core updates regional activity
```

## 8. Offline-First Model

Events can be queued while offline.

Offline requirements:

- Events must be deterministic.
- Event handlers must be idempotent where possible.
- Save files must store enough state to resume event processing.
- Randomness should use seeded sources.

## 9. MMO Scaling Path

In MMO mode, the server becomes authoritative for critical events.

Server-authoritative events:

- CurrencyChanged
- ItemTraded
- MarketListingPurchased
- PlayerLevelChanged
- CreatureContracted
- CreatureFused
- PvPMatchResult
- GuildBankChanged

Client-predicted events:

- UI selection
- Local movement preview
- Tooltip discovery
- Non-authoritative animation

## 10. Debugging

The debug overlay should show:

- Recent events
- Event source
- Event payload summary
- Handler count
- Processing time
- Failed handlers
- Replay controls

## 11. Acceptance Criteria

Event-driven architecture is ready when:

- Player actions publish typed events.
- Creature, world, NPC, quest, weather, and economy systems react through handlers.
- Event replay can reproduce important simulation outcomes.
- Save/load preserves pending and completed event state.
- MMO-critical events can be validated server-side later.
