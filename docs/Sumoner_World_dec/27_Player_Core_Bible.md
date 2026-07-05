# Player Core Bible

Version: 1.0 Draft

## 1. Purpose

The Player Core Bible defines the heart of SummonerWorld.

SummonerWorld is a Summoner RPG. The player is the root of the experience, the owner of long-term progression, and the reason every other system exists.

Creature AI, world simulation, NPCs, economy, dungeons, and MMORPG features must all support this chain:

```text
Player
  -> Summoner
    -> Creatures
      -> World
```

## 2. Player Core Definition

Player Core is the set of systems that describe what the player can be, do, own, command, build, remember, trade, and complete.

It includes:

- Character identity
- Summoner class
- Element selection
- Statistics
- Experience
- Skills
- Talent trees
- Inventory
- Equipment
- Creature slots
- Creature contracts
- Summoning
- Creature commands
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
- Save system
- End-game progression

## 3. Core Player Journey

The expected long-term journey is:

```text
Create Character
  -> Choose Element
  -> Choose Summoner Identity
  -> Receive First Creature Path
  -> Complete Early Worlds
  -> Unlock Inventory, Equipment, Skills
  -> Form Creature Contracts
  -> Learn Creature Commands
  -> Enter Dungeons
  -> Build Housing
  -> Join Economy
  -> Unlock Guild and Social Systems
  -> Travel Across 100 Worlds
  -> Reach Floor 100
  -> Challenge the Demonlord
  -> Defeat the Demonlord
  -> Become the Demonlord
  -> Manage Demonlord Floors
  -> Defend the throne against new challengers
```

## 4. Character Creation

Character creation should establish long-term player identity.

Required decisions:

- Player name
- Appearance
- Starting element
- Summoner class
- Starting world
- Initial attribute bias
- First creature contract path

The system should avoid disposable choices. Early decisions should remain meaningful later through bonuses, reputation hooks, class identity, and creature affinity.

## 5. Summoner Classes

Summoner classes define preferred playstyle.

Example classes:

- Beast Binder: stronger creature bonds and contract stability
- Elementalist: stronger elemental scaling and spell access
- Warden: defensive play, survival, healing, protection
- Ritualist: advanced summoning, rare contracts, sacrifice mechanics
- Tactician: command speed, formation bonuses, combat control
- Alchemist: crafting, mutation, consumables, material conversion
- Pathfinder: travel, exploration, scouting, world traversal
- Duelist: PvP, direct combat, elite single-creature synergy

Classes should guide the build without preventing hybrid play.

## 6. Element Selection

Element selection is one of the most important early decisions.

Elements should affect:

- Player skills
- Creature affinity
- Contract stability
- Equipment scaling
- Crafting recipes
- Dungeon modifiers
- NPC reactions
- World travel
- PvP identity

Elements should not be cosmetic. They should create different paths through the same game.

## 7. Player Statistics

Primary attributes:

- Strength
- Vitality
- Intelligence
- Dexterity
- Wisdom
- Luck

Secondary statistics:

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

## 8. Experience and Progression

Progression should come from many activities:

- Combat
- Quests
- Dungeons
- Crafting
- Exploration
- Creature training
- Trading
- Housing
- Guild participation
- Achievements
- World completion

Player progression should not require only combat. A summoner can be a fighter, trader, crafter, explorer, breeder, guild leader, collector, or PvP specialist.

## 9. Reputation

Reputation is a Player Core bridge into NPC, faction, settlement, creature, world, and dungeon systems.

Core reputation buckets:

- World reputation
- Faction reputation
- Settlement reputation
- Creature reputation

Reputation changes should come from player-visible activity such as quests, trading, ecosystem impact, and dungeon clearing. Positive and negative reputation should produce deterministic effect modifiers for merchant prices, creature capture chance, settlement growth, dungeon difficulty, and NPC reactions.

Reputation belongs to the player save aggregate. Downstream systems may consume reputation effects, but they should not become the source of truth for player reputation.

## 10. Inventory

Inventory is a player-owned system.

Item categories:

- Equipment
- Consumables
- Materials
- Quest items
- Creature items
- Contract items
- Crafting tools
- Housing items
- Marketplace goods
- Dungeon keys

Inventory must support sorting, filtering, stacking, rarity, ownership, binding, trading rules, and save/load stability.

## 11. Equipment

Equipment should support both direct player power and summoner power.

Slots:

- Weapon
- Offhand
- Head
- Chest
- Hands
- Legs
- Feet
- Amulet
- Ring 1
- Ring 2
- Summoner focus
- Creature command artifact

Equipment can modify:

- Player stats
- Elemental mastery
- Creature bond power
- Contract capacity
- Command speed
- Summoning cost
- Crafting efficiency
- Travel utility

## 12. Creature Slots

Creature slots define how many creatures the player can actively use.

Slot types:

- Active combat slots
- Reserve slots
- Utility slots
- Housing slots
- Marketplace listing slots
- Breeding slots

Slot expansion should be tied to player progression, equipment, housing, guild bonuses, and end-game unlocks.

## 13. Creature Contracts

Creatures should not simply be owned as inventory items.

They should be bound through contracts.

Contract properties:

- Creature ID
- Player ID
- Bond level
- Trust
- Loyalty
- Contract stability
- Element compatibility
- Command permissions
- Trade status
- Breeding rights
- PvP eligibility

Contracts make creatures feel like part of the player journey while still allowing economy and marketplace systems.

## 14. Summoning

Summoning is the act of bringing contracted creatures into active play.

Summoning should consider:

- Mana or resource cost
- Cooldown
- Location restrictions
- Dungeon rules
- PvP rules
- Creature mood
- Contract stability
- Element compatibility

## 15. Creature Commands

Creature commands are the player's interface into Creature AI.

Command examples:

- Follow
- Stay
- Guard
- Attack
- Defend
- Retreat
- Scout
- Gather
- Track
- Interact
- Use ability
- Protect ally
- Avoid combat

Creature AI should interpret commands through its own state, personality, training, loyalty, and current world conditions. The player gives intent; the creature executes through simulation.

## 16. Player Skills

Player skills should include:

- Direct combat skills
- Summoner commands
- Elemental skills
- Crafting skills
- Travel skills
- Social skills
- Economy skills
- Housing skills
- PvP skills

Skills should be usable both directly and through creature synergy.

## 17. Talent Trees

Talent trees define long-term build identity.

Possible trees:

- Summoning
- Elemental Mastery
- Creature Bonding
- Combat
- Survival
- Crafting
- Trading
- Housing
- Exploration
- PvP
- Guild Leadership

Talent choices should unlock new options, not only add small stat bonuses.

## 18. Crafting

Crafting should be player-centered and connected to world resources.

Crafting outputs:

- Equipment
- Consumables
- Creature food
- Contract tools
- Housing objects
- Building materials
- Dungeon keys
- Marketplace goods

## 19. Housing and Building

Housing gives the player a persistent place in the world.

Housing supports:

- Storage
- Creature resting
- Breeding
- Crafting stations
- Decoration
- Guild rooms
- Marketplace stalls
- Trophy display
- NPC visitors

Building expands the player's influence beyond character stats.

## 20. Transportation and World Travel

World travel is part of player progression.

Travel systems:

- Walking
- Mount creatures
- Roads
- Boats
- Portals
- Air travel
- Fast travel
- World gates

Travel should connect to exploration, danger, economy, quests, and creature utility.

## 21. Trading and Marketplace

Trading must support player agency without breaking progression.

Tradeable categories:

- Materials
- Crafted items
- Consumables
- Equipment
- Housing items
- Creature-related items
- Some contracts, when rules allow it

Marketplace systems need restrictions for binding, rarity, fraud prevention, listing fees, taxes, and server-side validation in MMO mode.

## 22. Guilds and Friends

Social systems should be part of the long-term RPG loop.

Guild features:

- Shared goals
- Guild housing
- Guild crafting
- Guild marketplace benefits
- Group dungeons
- PvP teams
- Reputation
- Shared achievements

Friends features:

- Presence
- Messaging
- Trading permissions
- Party invites
- Co-op travel

## 23. PvP

PvP should be optional, structured, and build-aware.

Modes:

- Duels
- Ranked arenas
- Creature battles
- Guild battles
- World events
- Marketplace tournaments

PvP must validate player stats, equipment, contracts, creature states, cooldowns, and command rules.

## 24. Achievements and Titles

Achievements should recognize the full game, not only combat.

Categories:

- Exploration
- Creature collection
- Crafting
- Economy
- Housing
- Dungeons
- PvP
- Guilds
- World completion
- Rare events

Titles can provide cosmetic identity, reputation hooks, or small progression bonuses.

Implementation note:

- Player Core owns the title and achievement catalogs.
- Achievement entries carry category, progress, target, and unlock timestamp.
- Title entries carry category and unlock timestamp.
- Statistic-backed achievements are recalculated from PlayerStatistics during creation, migration, and save deserialization.
- Older saves without category fields should be normalized instead of rejected.

## 25. Statistics

Player statistics should support UI, achievements, balance, debugging, and live operations.

Examples:

- Worlds unlocked
- Creatures contracted
- Dungeons cleared
- Items crafted
- Trades completed
- Gold earned
- Bosses defeated
- PvP wins
- Housing value
- Guild contributions
- Quests completed

## 26. Save System

The save system must treat the player as the root aggregate.

Player save data should include:

- Character identity
- Progression
- Inventory
- Equipment
- Skills
- Talents
- Creature contracts
- Quest history
- Housing
- Economy state
- Reputation
- Achievements
- Statistics
- World unlocks

Creature AI state should be saved as part of creature/world state, but player-owned contract state must remain attached to the player.

## 27. End Game

End game begins when the player reaches Floor 100 of the dungeon and challenges the active Demonlord.

The core end-game loop is the Demonlord throne cycle:

```text
Reach Floor 100
  -> Challenge Demonlord
  -> Defeat Demonlord
  -> Become Demonlord
  -> Unlock Demonlord Floor Manager
  -> Accept new challenger
  -> Win and continue reign
     or
  -> Lose throne and restart from Floor 1
```

When a player defeats the Demonlord, that player becomes the new Demonlord. They gain Demonlord authority and floor manager powers for the controlled dungeon range.

The active Demonlord must accept valid challenges from eligible players. If the Demonlord is defeated, they lose Demonlord authority and restart from Floor 1. Their history, achievements, reputation, titles, statistics, and legacy records remain intact. Only the active tower position and active Demonlord reign powers reset.

If a challenger fails to defeat the Demonlord, the challenger does not become Demonlord and simply respawns according to normal death/respawn rules.

End-game systems:

- Floor 100 Demonlord challenge
- Demonlord throne ownership
- Demonlord floor manager powers
- Mandatory challenger acceptance
- Demonlord defeat reset to Floor 1
- Preserved history, achievements, reputation, titles, and statistics
- Failed challenger respawn
- Demonlord reign history
- Guild support for challenges
- PvP seasons around tower control
- High-tier crafting for challenge preparation
- Marketplace demand around challenge cycles

## 28. Relationship to Creature AI

Creature AI supports the Player Core through commands, contracts, loyalty, combat, exploration, gathering, world behavior, and simulation.

The correct relationship is:

```text
Player intent
  -> Creature command
    -> Creature AI decision
      -> World event result
        -> Player progression consequence
```

This keeps Creature AI powerful without allowing it to become the entire game.

## 29. Acceptance Criteria

Player Core is complete when:

- A new player can create a meaningful summoner identity.
- Every major system is reachable through player decisions.
- Creature systems are connected through contracts, slots, summoning, and commands.
- Inventory, equipment, skills, talents, housing, economy, and world travel form one progression loop.
- Save/load treats the player as the root aggregate.
- The architecture can support offline play and future MMO authority.
