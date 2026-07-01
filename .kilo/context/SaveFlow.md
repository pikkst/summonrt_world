# Save Flow

## Direction

Save/load should move toward Player Core as the root aggregate for player-owned state.

## Player Save Flow

```text
Player Core
  -> Identity
  -> Progression
  -> Inventory
  -> Equipment
  -> Creature Contracts
  -> Quest History
  -> Achievements
  -> Reputation
  -> World Unlocks
  -> Save Metadata
```

## World and Dungeon References

Player save state may reference:

- unlocked worlds
- discovered locations
- dungeon run history
- cleared floors
- world memory snapshots

## Import Safety

Imported save files should be treated as untrusted data.

Validate:

- version
- required fields
- numeric bounds
- entity references
- impossible states

## Rule

Do not add persistent fields without considering defaults, migration, and future server authority.
