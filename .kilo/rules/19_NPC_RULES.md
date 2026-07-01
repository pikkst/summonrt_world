# 19 - NPC Rules

## NPC Role

NPCs are persistent simulated citizens, not static quest boards.

They should support the player journey through:

- Dialogue
- Quests
- Trading
- Training
- Reputation
- Factions
- Rumors
- Schedules
- Economy participation
- Settlement life
- Social memory

## Player-First NPC Rule

NPC systems must answer:

```text
How does this NPC system help the player discover opportunities, build reputation, trade, learn, progress, or shape the world?
```

## NPC Identity Rule

NPCs should have meaningful identities.

NPC data may include:

- Name
- Role
- Faction
- Settlement
- Home
- Occupation
- Schedule
- Wealth
- Inventory
- Personality
- Relationships
- Player reputation value
- Memory of important events

## NPC Types

Supported or planned NPC types include:

- Merchant
- Blacksmith
- Guard
- Farmer
- Noble
- Explorer
- Summoner
- Scholar
- Criminal
- Trainer
- Quest giver
- Guild representative

## Schedule Rule

NPCs should eventually follow schedules instead of existing only as static interactables.

Schedules may include:

- Sleep
- Work
- Travel
- Market
- Tavern
- Training
- Patrol
- Quest availability windows

## Relationship and Reputation Rule

NPC reactions should be affected by player behavior.

Reputation may influence:

- Dialogue tone
- Quest access
- Merchant pricing
- Trainer availability
- Faction trust
- Settlement support
- Rumor quality

## Faction Rule

NPC faction systems should be event-driven where possible.

Quest outcomes, trade, combat, and world actions may change faction standing.

## Rumor Rule

Rumors should expose world-state information through NPC trust.

Rumors may reveal:

- Boss weaknesses
- Hidden quests
- Resource locations
- Dungeon dangers
- Faction conflicts
- Economy shortages
- Rare creature sightings

## Economy Rule

NPCs should participate in economy systems.

NPCs may have:

- Cash reserves
- Inventory limits
- Restock behavior
- Production roles
- Demand and supply effects
- Reaction to player undercutting

## Quest Rule

NPC quests should combine templates with world state.

Inputs may include:

- Current biome
- NPC needs
- Economy state
- Weather
- World history
- Faction standing
- Player reputation

## Event Rule

NPC systems should publish and react to events such as:

```text
NPCMetPlayer
NPCReputationChanged
NPCQuestOffered
NPCShopInventoryChanged
FactionStandingChanged
PlayerStartedQuest
PlayerCompletedQuest
```

## Testing Requirements

NPC features should test:

- Schedule generation
- Reputation effects
- Quest offering conditions
- Merchant price reactions
- Faction standing changes
- Deterministic name generation where seeded

## Forbidden

- Do not make all NPCs static menus.
- Do not ignore player reputation.
- Do not duplicate quest generation logic inside NPC modules.
- Do not make NPC economy separate from the main economy system.
- Do not hard-code major NPC behavior that should be data-driven.
