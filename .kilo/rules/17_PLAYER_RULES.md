# 17 - Player Rules

## Player Core Principle

The player is the root gameplay object.

SummonerWorld is a Summoner RPG, not a creature simulator, economy simulator, or dungeon generator by itself.

Every major system must support the player journey.

## Player Journey

The player journey should support:

```text
Character Creation
  -> Element Identity
  -> Summoner Class
  -> Creature Contract
  -> Exploration
  -> Progression
  -> Crafting / Economy / Housing
  -> Dungeons
  -> World Advancement
  -> Guilds / PvP / Marketplace
  -> Floor 100 Demonlord Challenge
  -> Demonlord Throne Cycle
```

## Root Aggregate Rule

PlayerCoreState should become the root aggregate for player-owned data.

It should eventually own or reference:

- Identity
- Summoner profile
- Level and XP
- Elements
- Class
- Inventory
- Equipment
- Skills
- Talents
- Titles
- Achievements
- Statistics
- Reputation
- Quest history
- Creature contracts
- Housing references
- World unlocks
- Save metadata

## Character Creation Rule

Character creation should define meaningful long-term identity:

- Name
- Appearance
- Starting world
- Starting element
- Summoner class
- Initial attribute bias
- First creature contract path
- Starting profession hint

Do not add character creation choices that have no gameplay meaning or future path.

## Summoner Class Rule

Summoner classes define playstyle, not hard lockouts.

Examples:

- Beast Binder
- Elementalist
- Warden
- Ritualist
- Tactician
- Alchemist
- Pathfinder
- Duelist

Class modifiers should be data-driven, not hard-coded branch logic scattered through systems.

## Element Identity Rule

Element selection is a player identity decision.

It may affect:

- Player abilities
- Creature affinity
- Contract stability
- Equipment scaling
- Crafting recipes
- Dungeon modifiers
- NPC reactions
- World travel
- PvP identity

## Statistics Rule

Player statistics should be deterministic and recalculable.

Primary attributes:

- Strength
- Vitality
- Intelligence
- Dexterity
- Wisdom
- Luck

Secondary statistics may include:

- Health
- Mana
- Stamina
- Movement
- Critical Chance
- Elemental Mastery
- Contract Capacity
- Command Speed
- Creature Bond Power
- Inventory Capacity
- Crafting Efficiency
- Trade Influence
- Reputation Gain

## Inventory and Equipment Rule

Inventory and equipment are Player Core systems.

Do not implement item ownership without a clear player owner or world/economy owner.

Equipment should modify player stats, summoner abilities, creature bond power, contract capacity, crafting efficiency, and travel utility where appropriate.

## Titles, Achievements, and Statistics Rule

Long-term progression should be remembered.

Track meaningful accomplishments such as:

- Worlds unlocked
- Creatures contracted
- Dungeons cleared
- Bosses defeated
- Items crafted
- Trades completed
- Gold earned
- PvP wins
- Housing value
- Guild contributions
- Quests completed

## Reputation Rule

Reputation connects Player Core to NPC, creature, settlement, world, and dungeon systems.

Reputation may affect:

- Merchant prices
- Creature capture chance
- Settlement growth
- Dungeon difficulty
- NPC dialogue
- Quest access

## Demonlord Rule

The Demonlord system is an end-game player identity loop.

When a player defeats the Demonlord:

- They become the new Demonlord.
- They gain Demonlord title and floor manager permissions.
- Their reign is recorded.
- The former Demonlord loses active authority but keeps history, achievements, reputation, titles, and statistics.

## Testing Requirements

Player features should test:

- Character creation validity
- Element/class modifier determinism
- Inventory/equipment save/load round-trip
- Creature contract ownership
- Statistics updates
- Achievement unlock conditions
- Reputation effects

## Forbidden

- Do not make creature state replace player progression.
- Do not add persistent player data without save/load consideration.
- Do not make class choices hard lock future systems unless the design explicitly says so.
- Do not ignore the player-first architecture.
