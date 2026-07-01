# 21 - Dungeon Rules

## Dungeon Role

Dungeons are part of the player journey, not only combat generators.

They provide:

- World progression gates
- Boss milestones
- Rare creature access
- Crafting materials
- World memory events
- Guild challenges
- Dungeon history
- End-game Demonlord loop

## Tower Rule

Every world contains a central dungeon tower.

Tower rules should support:

- Floor count = base floors + world index
- Continuous vertical progression
- Exit of one floor links to entrance of next floor
- Safe floors every 10th floor
- Rest area, vendor, and teleport unlock on safe floors
- Final boss arena per world
- Floors 50-100 influenced by Demonlord where applicable
- Floor 100 Demonlord challenge floor

## Procedural Generation Rule

Dungeon generation must be deterministic.

Same inputs must produce the same floor graph.

Inputs should include:

- worldIndex
- floorIndex
- globalSeed

## Floor Graph Rule

Generated floor graphs must be valid.

Required properties:

- Connected graph
- Entrance room exists
- Boss or exit room exists
- Entrance-to-boss path exists
- Room IDs are unique
- Connections are valid and bidirectional where required
- Treasure rooms exist when required
- Room types are valid

## Room Type Rule

Supported room types include:

- Entrance
- Combat
- Trap
- Puzzle
- Treasure
- Rest
- Elite
- Vendor
- Boss

Room assignment should respect biome/tier themes where documented.

## Boss Floor Rule

Boss floors should be open boss arenas, not normal maze floors.

Boss floors should include:

- Boss room
- Entrance room
- Reachable path
- Element-based hazards
- Boss scaling metadata
- Phase-compatible layout

## Safe Floor Rule

Safe floors should provide:

- Rest room
- Vendor room
- Teleport unlock room

Safe floors should not accidentally become boss floors unless explicitly designed.

## Ascension Rule

Ascending should require defeating a floor guardian or consuming a rare teleport item where documented.

Entrance lobby exceptions must be explicit.

## Demonlord Rule

The Demonlord system is an end-game dungeon loop.

Flow:

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

The active Demonlord may influence controlled floors within strict rules and auditability.

## Dungeon Metadata Rule

Dungeon metadata must be exportable/persistable for:

- Save/load
- Online synchronization
- Party dungeon runs
- Replay tests
- Dungeon history

Metadata may include:

- Floor graph
- Room types
- Treasure locations
- Boss room ID
- Seed inputs
- Cleared rooms
- Vertical links
- Safe floor metadata

## Event Rule

Dungeon systems should publish/react to events such as:

```text
DungeonFloorGenerated
DungeonRoomEntered
DungeonTrapTriggered
DungeonPuzzleSolved
DungeonBossScanned
DungeonBossDefeated
DungeonTreasureOpened
DungeonGuardianDefeated
DungeonFloorCleared
DemonlordChallenged
DemonlordDefeated
DemonlordThroneClaimed
DemonlordChallengeAccepted
DemonlordChallengeFailed
DemonlordReignEnded
DemonlordFloorManagerChanged
```

## Testing Requirements

Dungeon features should test:

- Deterministic generation
- Floor graph connectivity
- Entrance-to-boss reachability
- Multi-path rules when required
- Treasure placement
- Boss floor reachability
- Tower vertical links
- Safe floor metadata
- World 10 full clear simulation
- 100-floor simulation where required

## Forbidden

- Do not use non-deterministic dungeon generation.
- Do not create disconnected rooms.
- Do not bypass world progression gates.
- Do not make Demonlord floor powers unauditable.
- Do not store dungeon run state without save/load considerations.
- Do not mix dungeon refactors into unrelated gameplay tasks.
