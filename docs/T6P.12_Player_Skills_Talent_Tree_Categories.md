# Task T6P.12 - Add Player Skills and Talent Tree categories

## Summary

Implemented typed Player Core categories for player skills and talent trees.

## Player Skill Categories

The Player Core now defines these skill categories:

- Direct Combat
- Summoner Commands
- Elemental Skills
- Crafting
- Travel
- Social
- Economy
- Housing
- PvP

Skill categories include metadata for direct use and creature synergy support.

## Talent Tree Categories

The Player Core now defines these long-term talent tree categories:

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

Talent categories include an unlock focus so future talent nodes can express meaningful player options instead of only stat bumps.

## Implementation Notes

- Added category types and metadata to `PlayerCoreState` skill and talent entries.
- Added `skillTalentCore.ts` as the canonical Player Core category catalog.
- Added deterministic category inference for legacy skill keys and career tree node IDs.
- Updated legacy player migration to categorize `skillsUnlocked` and `unlocked_node_ids`.
- Updated player-core save deserialization to add missing categories to older payloads.
- Exported the category API from the Player Core barrel.

## Save/Load Impact

Older saves that lack skill or talent category fields remain loadable. During deserialization:

- skill entries infer a `PlayerSkillCategoryId` from their key.
- talent nodes infer a `TalentTreeCategoryId` from their node ID.
- existing unlocked state is preserved.

## Validation

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
