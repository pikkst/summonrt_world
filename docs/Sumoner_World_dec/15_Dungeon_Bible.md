# Dungeon Bible

## Central Concept

Every world contains a central dungeon tower.

The dungeon system is part of the player journey, not only a combat generator. Dungeons provide progression gates, boss milestones, rare creature access, crafting materials, world memory, guild challenges, and end-game loops.

## Player Role

The player enters dungeons to:

- Progress through worlds
- Test builds
- Command creatures under pressure
- Discover boss weaknesses
- Earn rare rewards
- Unlock travel and teleport routes
- Influence world and dungeon memory
- Challenge the Demonlord on Floor 100
- Become the Demonlord after victory
- Manage Demonlord-controlled floors while holding the throne

## Current Implementation Status

Aligned source:
- `SummonerWorld_Tasks.md`

Completed through:
- T6.4.4 - Dungeon Room Assignment System

Completed ahead of sequence:
- T6.4.7 - Deterministic floor seed system
- T6.4.9 - Pathfinding utilities

Partially completed:
- T6.4.10 - Dungeon generation tests currently cover deterministic seeds, room connectivity, multi-path validation, treasure rooms, and room type assignment.

Completed Sprint 6 dungeon/combat foundation:
- T6.0 - Demonlord integration
- T6.1 - Combat damage formula
- T6.2 - Boss phase mechanics
- T6.3 - Scan ability
- T6.4.1 - generateDungeonFloor(worldIndex, floorIndex)
- T6.4.2 - Multi-path guarantee
- T6.4.3 - Treasure room placement
- T6.4.4 - Room type assignment with biome/tier consistency and rest room guarantee
- T6.4.7 - Deterministic floor seed system
- T6.4.9 - Pathfinding utilities

## Implemented Rules

- Procedural floor generation
- Connected room graph
- Entrance and boss/exit rooms
- Multiple shortest paths
- Treasure room placement
- Room type assignment
- Biome/tier themed room distributions
- At least one rest room per floor
- Deterministic floor seeds from world, floor, and global seed
- Shortest-path and distance-map utilities
- Unit tests for current floor generation, room types, paths, treasures, and deterministic output
- Boss phase mechanics
- Scan ability for boss weakness discovery
- Demonlord floor range and challenge flow

## Remaining Sprint 6 Tasks

Next:
- T6.4.5 - Create generateDungeonTower(worldIndex)

Remaining:
- T6.4.6 - Boss floor generation rules
- T6.4.8 - Dungeon metadata export
- T6.4.10 - Remaining dungeon generation tests: 100-floor simulation and boss-floor reachability
- T6.5 - Extend boss phase mechanics with environmental hazard rotation and Summoner career bonuses
- T6.6 - Extend Scan ability with creature ability pool integration and final UI feedback
- T6.7 - Add trap, puzzle, treasure, elite, and vendor room interactions/UI
- T6.8 - Dungeon floor count and progression rules
- T6.9 - Ascending requires floor guardian defeat or rare teleport item
- T6.10 - Dungeon exit scales player to minimum viable level
- T6.11 - Trap/puzzle minigame UI
- T6.12 - Full clear World 10 dungeon simulation
- T6.13 - Timed mission integration
- T6.14 - Career passive integration into combat

## Tower Rules

The central tower should support:

- Floor count = BaseFloors + WorldIndex
- Continuous vertical progression
- Exit of one floor links to entrance of next floor
- Safe floors every 10th floor
- Rest area, vendor, and teleport unlock on safe floors
- Final floor boss arena per world
- Floors 50-100 are influenced by the active Demonlord
- Floor 100 is the Demonlord throne challenge floor

## Demonlord End Game

The dungeon end game is the Demonlord throne cycle.

```text
Player reaches Floor 100
  -> Player challenges Demonlord
  -> Demonlord must accept
  -> Challenger wins
     -> Challenger becomes Demonlord
     -> Former Demonlord restarts from Floor 1
  -> Challenger loses
     -> Challenger respawns normally
```

### Becoming Demonlord

When the player defeats the active Demonlord on Floor 100:

- The player becomes the new Demonlord.
- The player unlocks the Demonlord title.
- The player unlocks the Demonlord floor manager interface.
- Demonlord reign history records the victory.
- World and dungeon memory record the throne change.

### Demonlord Floor Manager

The active Demonlord can manage controlled floors within strict game rules.

Possible manager powers:

- Bias room type distribution
- Set floor themes
- Place elite encounters within a budget
- Choose boss modifiers
- Adjust rest, vendor, and trap frequency within limits
- Influence floors 50-100

The floor manager must not break deterministic generation, save/load, or MMO authority. All changes should be auditable events.

### Mandatory Challenge Acceptance

If an eligible player challenges the active Demonlord, the Demonlord must accept.

Rules:

- Valid challenges cannot be ignored indefinitely.
- A refusal timer should auto-accept if the Demonlord does not respond.
- Challenge results update dungeon history.
- Challenge results update player reputation and Demonlord reign records.

### Demonlord Defeat Reset

When the active Demonlord loses:

- They lose active Demonlord authority.
- They restart from Floor 1.
- They keep history.
- They keep achievements.
- They keep reputation.
- They keep titles and statistics as legacy records.
- They lose only current tower position, current reign powers, and active Demonlord authority.

### Failed Challenger Respawn

If the challenger cannot defeat the Demonlord:

- The challenger respawns normally.
- The challenger does not become Demonlord.
- The failed challenge is recorded in dungeon history.
- Existing death/respawn rules apply.

## Room Types

Supported room types:

- Combat
- Trap
- Puzzle
- Treasure
- Rest
- Elite
- Vendor
- Boss
- Entrance

Room assignment is complete; room interaction gameplay remains future work.

## Event-Driven Hooks

Dungeon systems should publish and react to events:

- DungeonFloorGenerated
- DungeonRoomEntered
- DungeonTrapTriggered
- DungeonPuzzleSolved
- DungeonBossScanned
- DungeonBossDefeated
- DungeonTreasureOpened
- DungeonGuardianDefeated
- DungeonFloorCleared
- DemonlordChallenged
- DemonlordDefeated
- DemonlordThroneClaimed
- DemonlordChallengeAccepted
- DemonlordChallengeFailed
- DemonlordReignEnded
- DemonlordFloorManagerChanged

## Future

- Seasonal dungeons
- Guild raids
- Endless tower
- Dungeon lore memory
- Dynamic dungeon difficulty
- Server-synchronized party dungeon runs
