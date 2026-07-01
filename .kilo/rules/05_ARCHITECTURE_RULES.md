# 05 - Architecture Rules

## Architecture Direction

SummonerWorld must remain player-first.

The intended dependency direction is:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

Every feature should support the player journey.

## System Ownership

Each system should have clear ownership.

Examples:

- Player Core owns player identity, progression, inventory, equipment, contracts, reputation, statistics, achievements, and save metadata.
- Creature Core owns creature templates, creature instances, contracts, summoning, commands, training, evolution, fusion, genetics, behavior, and ecology.
- World Core owns worlds, biomes, weather, resources, settlements, travel, memory, threats, and world shaping.
- Dungeon Core owns dungeon towers, floors, rooms, bosses, hazards, rewards, and Demonlord progression.
- Economy Core owns prices, supply, demand, markets, taxes, sinks, trades, professions, and settlement economics.

## Coupling Rules

Avoid direct cross-system coupling.

Prefer event-driven communication for cross-system reactions.

Example:

```text
PlayerCompletedQuest
  -> ReputationSystem
  -> AchievementSystem
  -> EconomySystem
  -> WorldMemorySystem
```

## Data-Driven Rules

Gameplay definitions should be data-driven where practical.

Use data/config for:

- Rarity weights
- Element combinations
- Career passive mappings
- Economy coefficients
- Room type weights
- Boss hazard definitions
- Class modifiers

## Deterministic Architecture

Systems that may be synchronized online must be deterministic from shared inputs.

This includes:

- World generation
- Dungeon generation
- Loot generation when required
- Creature procedural identity when required
- Offline catch-up simulation

## Save/Load Architecture

Persistent changes must be designed with save/load in mind.

Before adding a persistent field, determine:

- Owner aggregate
- Serialization format
- Default value
- Migration behavior
- Backward compatibility
- Future server authority impact

## MMO Compatibility

Even when implementing offline features, avoid choices that would block future online play.

Do not rely on client-only authority for systems that will later require server validation, such as:

- Currency
- Trading
- Marketplace listings
- PvP results
- Dungeon party state
- Guild bank changes

## Architecture Red Flags

Stop and reconsider if a change requires:

- A React component to know too much about gameplay logic.
- A store module to import many unrelated systems.
- A gameplay system to mutate another system's internal state directly.
- A large file to become even larger with a separate responsibility.
- A non-deterministic shortcut inside a deterministic system.
