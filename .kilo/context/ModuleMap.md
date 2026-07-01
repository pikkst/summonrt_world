# Module Map

## Root Direction

SummonerWorld uses player-first architecture.

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

## Player Core

Owns or should own:

- identity
- summoner profile
- level and XP
- stats
- inventory
- equipment
- creature contracts
- achievements
- titles
- reputation
- save metadata

## Creature Core

Owns:

- creature templates
- creature instances
- contracts
- summoning
- commands
- fusion
- genetics
- evolution
- creature AI behavior

## World Core

Owns:

- world generation
- biomes
- resources
- world memory
- settlements
- travel
- weather
- ecology

## Dungeon Core

Owns:

- tower generation
- floor generation
- room graphs
- boss floors
- safe floors
- pathfinding
- dungeon rewards
- Demonlord progression

## Combat Core

Owns:

- damage formula
- elemental modifiers
- boss phases
- scan ability
- status effects
- battle logs
- automated combat

## NPC Core

Owns:

- NPC identity
- schedules
- dialogue
- shops
- factions
- reputation reactions
- quest offerings

## Economy Core

Owns:

- currency
- prices
- supply
- demand
- markets
- taxes
- trading
- settlement economy
