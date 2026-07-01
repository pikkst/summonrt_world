# Event Flow

## Direction

Cross-system gameplay reactions should move toward typed domain events.

## Basic Flow

```text
Command / Action
  -> Validation
  -> State Change
  -> Domain Event
  -> System Reactions
  -> Save / UI Update
```

## Example

```text
DungeonBossDefeated
  -> Quest progress update
  -> Achievement unlock check
  -> Reputation update
  -> World memory update
  -> Statistics update
```

## Good Event Names

- PlayerEnteredWorld
- CreatureContracted
- DungeonFloorCleared
- DungeonBossDefeated
- ItemCrafted
- QuestCompleted
- WorldMemoryChanged

## Event Payload Rule

Event payloads should include:

- relevant ids
- relevant world/player context
- game time if needed
- compact state needed by listeners

Avoid sending huge unrelated objects.

## Rule

If multiple systems need to react to one gameplay fact, consider an event boundary instead of direct coupling.
