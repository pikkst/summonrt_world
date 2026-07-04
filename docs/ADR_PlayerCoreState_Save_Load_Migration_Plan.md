# ADR - PlayerCoreState Save/Load Migration Plan

## Status

Accepted for incremental implementation.

## Context

SummonerWorld currently has two player state shapes:

- `PlayerState` in `src/types/game.ts` is the active runtime compatibility shape used by existing Zustand actions and UI.
- `PlayerCoreState` in `src/types/playerCore.ts` is the intended Player Core root aggregate for identity, progression, inventory, equipment, contracts, statistics, reputation, quest history, world unlocks, resources, position, settings, money, skill points, and time.

Save/load was legacy-first:

- Active key: `summonerworld-save`
- Active legacy version: `1.1.0`
- Active legacy payload field: `player`
- Older helper key: `summonerworld-save-v1`
- Legacy XP serialization could lose BigInt precision
- `discoveredTiles` and world tile maps needed explicit round-trip handling

The migration must keep old local saves loadable, keep current UI panels working, and avoid moving world-owned data into Player Core.

## Decision

Introduce a versioned compatibility envelope:

```ts
interface SaveEnvelopeV2 {
  version: '2.0.0';
  schema: 'player-core-transition';
  playerCore: SerializedPlayerCoreState;
  legacyPlayer?: SerializedPlayerState;
  runtime: {
    worlds: SerializedWorldData[];
    currentWorldId: number;
    turnCount: number;
    screen: string;
    combat: unknown;
    dungeon: unknown;
    activity: unknown;
    missions: unknown[];
    exploring: unknown;
    searching: unknown;
    capturing: unknown;
    lastLogoutTimestamp?: number;
    log: unknown[];
  };
  savedAt: number;
}
```

`playerCore` is the authoritative player-owned save aggregate. `legacyPlayer` remains a temporary compatibility projection while runtime modules still read and mutate `PlayerState`.

## Implemented In T6P.16

- Added `src/modules/save/playerCoreSaveMigration.ts`.
- Added `playerCore: PlayerCoreState | null` to `GameStoreState`.
- Updated character creation and legacy init flows to retain `playerCore`.
- Updated `saveGame()` to write `version: '2.0.0'`, `playerCore`, `legacyPlayer`, and runtime state.
- Updated `loadGame()` to read `2.0.0`, migrate active `1.1.0` saves, and migrate `summonerworld-save-v1` helper saves.
- Preserved BigInt XP as strings in serialized Player Core and legacy player payloads.
- Preserved `Set` and `Map` data through explicit serialization for discovered tiles and worlds.
- Added focused migration tests for BigInt round-trip, active legacy save migration, helper payload migration, and v2 idempotency.

## Field Mapping

| Legacy `PlayerState` | Player Core destination | Notes |
|---|---|---|
| `id`, `name`, `gender`, `appearance` | `identity` | Direct mapping. |
| `archetype` | `summonerProfile.archetype`, derived `class` | Uses existing class fallback. |
| `level`, `experience` | `level`, `experience` | BigInt serializes as string. |
| `affinity` | `elements` | Preserves learned and multi-element traits. |
| primary flat stats | `primaryStats` | Existing migration recalculates secondary stats. |
| `energy`, `nerve`, `happy`, `life` | `resources` | Direct mapping. |
| `currentWorldId`, `tileX`, `tileY` | `position`, `worldUnlocks.activeWorldId` | Unlocks are derived conservatively. |
| `creatures` | `creatureContracts` | Creature instances are preserved inside contracts. |
| `inventory` | `inventory` | Inventory stacks and modifiers are preserved. |
| `activeQuests`, `completedQuests` | `questHistory` | Direct mapping. |
| `skillsUnlocked` | `skills` | Record converted to entries. |
| `unlocked_node_ids` | `talents` | IDs converted to unlocked talent nodes. |
| `money`, `skillPoints`, time fields | matching core fields | Direct mapping. |
| `discoveredTiles`, world maps, transient activity | runtime envelope / legacy compatibility | Not forced into Player Core. |

## Rollout Checklist

- [x] Add `playerCoreSaveMigration.ts`.
- [x] Add migration tests with fixture payloads.
- [x] Add `playerCore: PlayerCoreState | null` to store state.
- [x] Update `createCharacter()` store action to retain `playerCore`.
- [x] Update `loadGame()` to dual-read legacy and core saves.
- [x] Update `saveGame()` to dual-write `playerCore` and `legacyPlayer`.
- [ ] Add runtime invariant checks in development builds.
- [ ] Move inventory actions through Inventory Core.
- [ ] Move equipment UI/actions through Equipment Core.
- [ ] Move creature list/capacity through contracts and creature slots.
- [ ] Move summon/command flows through Player Core modules.
- [ ] Remove `legacyPlayer` from default saves after UI/store migration is complete.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Follow-Up Notes

Runtime actions still mostly mutate `PlayerState`; `saveGame()` refreshes `playerCore` from legacy state during the transition. Later adapter PRs should move high-use domains to Player Core one at a time before removing `legacyPlayer`.
