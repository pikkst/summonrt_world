# Task T6P.13 - Add Titles and Achievements systems

## Summary

Implemented Player Core title and achievement systems with typed categories, deterministic statistic-backed unlocks, title grants, and save/load normalization.

## Categories

Titles and achievements now share these Player Core categories:

- Exploration
- Creature Collection
- Crafting
- Economy
- Housing
- Dungeons
- PvP
- Guilds
- World Completion
- Rare Events

## Implementation Notes

- Added `PlayerAchievementCategoryId` to Player Core types.
- Added category and description metadata to title entries.
- Added category metadata to achievement entries.
- Added `titleAchievementCore.ts` as the canonical catalog and evaluator.
- Added achievement definitions backed by `PlayerStatistics` where current statistics exist.
- Added title definitions granted from selected achievement unlocks.
- Default Player Core creation now initializes the achievement catalog and unlocks applicable starting achievements.
- Legacy player migration converts existing statistics into achievement progress and title grants.
- Player Core deserialization normalizes older title and achievement payloads that lack category fields.

## Save/Load Impact

Older player-core saves that lack title or achievement category fields remain loadable. During deserialization:

- known titles infer category and description from the title catalog.
- known achievements infer category, target, and description from the achievement catalog.
- custom unknown achievements are preserved and categorized as Rare Events.
- statistic-backed achievements are refreshed from `PlayerStatistics`.

## Validation

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
