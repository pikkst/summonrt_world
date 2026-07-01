# 18 - World Rules

## World Role

Worlds are not static maps.

Each world should become a persistent gameplay space that remembers player actions, supports exploration, creates progression gates, and reacts through ecology, economy, NPCs, dungeons, settlements, and events.

## 100 Worlds Rule

SummonerWorld contains 100 worlds.

World progression should remain meaningful:

```text
World 1
  -> World Boss defeated
  -> World 2 unlocked
  -> ...
  -> World 100
  -> Demonlord end-game loop
```

Do not add world progression shortcuts that bypass core advancement unless explicitly designed.

## Deterministic Generation Rule

World generation must be deterministic from shared inputs.

Generation should use seeds for:

- Biomes
- Rivers
- Mountains
- Settlements
- Roads
- Dungeons
- Creatures
- Resources
- Weather patterns where needed

Do not use non-deterministic randomness for world generation that may need offline replay or MMO synchronization.

## World Pipeline Rule

World generation should follow the documented pipeline:

```text
Seed
  -> Biomes
  -> Rivers
  -> Mountains
  -> Settlements
  -> Roads
  -> Dungeons
  -> Creatures
  -> Resources
```

## World Memory Rule

Worlds should remember meaningful player actions.

Tracked values may include:

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

World memory can produce world identity values:

- aggression_score
- ecology_score
- trade_score
- exploration_score
- dungeon_activity_score

These should affect gameplay, not just flavor.

## Dynamic Effects Rule

World state may affect:

- New quests
- NPC dialogue
- Economy changes
- Biome evolution
- Rare events
- Sanctuary events
- Merchant spawns
- Elite encounter rates
- Dungeon difficulty
- World threat events

## Travel Rule

World travel systems should support multiple movement modes over time:

- Walking
- Mount creature travel
- Road travel bonuses
- Boat travel
- Portal travel
- Air travel
- World gates

Travel must remain connected to player progression and world unlocks.

## Weather and Biome Rule

Weather and biomes should affect gameplay.

Examples:

- Encounter tables
- Resource yield
- Element affinity bonuses
- Creature behavior
- Travel difficulty
- Quest availability
- NPC schedules

## Event Rule

World systems should publish and react to domain events such as:

```text
PlayerEnteredWorld
PlayerEnteredBiome
BiomeEntered
WeatherChanged
ResourceSpawned
DungeonDiscovered
PlayerBuiltStructure
CreaturePopulationChanged
ResourceNodeDepleted
SettlementPolicyChanged
```

## Testing Requirements

World features should test:

- Same seed creates same world features.
- Generated biomes are valid.
- No invalid or empty tiles.
- Resource respawn timing.
- Weather effect rules.
- Travel unlock requirements.
- World memory updates from events.

## Forbidden

- Do not make worlds static backgrounds only.
- Do not use non-deterministic generation for world state.
- Do not bypass world unlock progression.
- Do not implement world memory as flavor text only.
- Do not couple world systems directly to unrelated systems when events would be cleaner.
