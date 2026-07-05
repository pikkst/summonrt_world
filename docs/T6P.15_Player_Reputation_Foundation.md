# Task T6P.15 - Add Player Reputation foundation

## Summary

Implemented the Player Core reputation foundation for world, faction, settlement, and creature reputation.

## Implementation Notes

- Added typed reputation domains, change sources, change payloads, and effect outputs.
- Added `reputationCore.ts` as the canonical Player Core reputation module.
- Added default neutral world reputation for new and migrated player cores.
- Added immutable reputation update helpers with source multipliers and `reputationGain` scaling.
- Added deterministic effect calculations for merchant prices, creature capture chance, settlement growth, dungeon difficulty, and NPC reactions.
- Exported reputation APIs from the Player Core barrel.

## Save/Load Impact

Reputation remains under `PlayerCoreState.reputation` and is serialized with the existing Player Core save envelope. Older saves that lack reputation fields still receive default reputation buckets during deserialization.

## Integration Boundary

This task exposes reusable reputation effect modifiers. Direct merchant, NPC, settlement, creature capture, and dungeon integrations remain follow-up work for the later reputation integration tasks.

## Validation

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
