# Character System

## Overview

Characters are permanent Summoners and the root entity of the game.

The player character is not only a stat block. It is the owner of progression, identity, inventory, equipment, skills, titles, achievements, housing, reputation, creature contracts, quest history, economy access, guild membership, and world completion.

## Character Role in Architecture

```text
Player Character
  -> Summoner Profile
    -> Player Systems
      -> Creature Systems
        -> World Systems
```

Every creature, item, quest, dungeon, building, profession, and market interaction should be reachable from the player character model either directly or through an owned subsystem.

## Character Creation

Character creation should define:

- Name
- Appearance
- Starting world
- Starting element
- Summoner class
- Initial attribute bias
- Starting creature contract option
- Starting profession hint

The player should understand that these decisions shape the long-term build.

## Summoner Classes

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

## Elements

Element selection should affect:

- Player abilities
- Creature affinity
- Contract stability
- Equipment bonuses
- Crafting options
- Dungeon advantages
- NPC reputation hooks
- World travel constraints

## Progression

- Level 1-1000
- Experience
- Attributes
- Passive talents
- Active skills
- Titles
- Achievements
- World completion milestones
- End-game ascension

## Core Attributes

- Strength
- Vitality
- Intelligence
- Dexterity
- Wisdom
- Luck

## Secondary Statistics

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

## Owned Systems

The character owns or references:

- Inventory
- Equipment
- Skill loadout
- Talent trees
- Creature slots
- Creature contracts
- Housing
- Building permissions
- Quest history
- Reputation
- Guild membership
- Marketplace permissions
- Statistics
- Save data

## Future

- Floor 100 Demonlord challenge profile
- Demonlord title ownership
- Demonlord reign history
- Demonlord floor manager permissions
- Defeated Demonlord reset to Floor 1
- Preserved history, achievements, reputation, titles, and statistics
- Account-wide achievements
