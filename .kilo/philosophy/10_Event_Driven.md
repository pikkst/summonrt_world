# 10 - Event Driven

## Principle

Important gameplay facts should become Events.

Events allow systems to react without direct coupling.

## Event Flow

```text
Action Completed
  -> Event Created
    -> Systems React
      -> Memory Updates
        -> Report Generated
```

## Good Events

Examples:

- QuestCompleted
- DungeonFloorCleared
- DungeonBossDefeated
- CreatureContracted
- ItemCrafted
- PlayerBuiltStructure
- SettlementPolicyChanged
- DemonlordThroneClaimed

## Design Meaning

Events make the game easier to test, replay, audit, save, and synchronize later.

## AI Rule

If more than one system needs to react to the same gameplay fact, consider a typed Event boundary.
