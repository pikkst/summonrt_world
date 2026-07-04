# Task T6P.14 - Add Player Statistics tracking

## Summary

Implemented deterministic Player Core progress-statistics tracking for the long-term counters listed in the Sprint 6.5 checklist.

## Implementation Notes

- Added `playerStatisticsTracking.ts` as the canonical statistics tracking module.
- Added typed statistic definitions, defaults, normalization, merging, direct update modes, and domain event application.
- Tracked these Player Core counters:
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
- Hooked existing gameplay events into Player Core statistics where the current prototype has clear event points:
  - Successful capture increments creatures contracted.
  - Completed quest increments quests completed and records quest gold rewards.
  - Boss-floor dungeon victory increments bosses defeated and dungeons cleared.
  - Treasure gold records gold earned.
  - Completed craft missions increment items crafted.
  - Accepted trades increment trades completed.
- Updated save/load migration so future-only Player Core counters are preserved when the app regenerates `PlayerCoreState` from legacy player state.

## Save/Load Impact

Statistics are serialized as part of `PlayerCoreState`. Deserialization normalizes malformed or old payloads back to the full statistic shape, and legacy migration merges derived values with previously tracked Player Core counters so counters such as dungeons cleared and items crafted do not reset.

## Validation

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
