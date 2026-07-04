# ADR - PlayerCoreState Save/Load Migration Plan

## Status

Accepted for incremental implementation.

## Context

SummonerWorld currently has two player state shapes:

- `PlayerState` in `src/types/game.ts` is the active runtime shape used by Zustand store, UI panels, local save/load, server sync, combat, missions, inventory, creatures, resources, and world position.
- `PlayerCoreState` in `src/types/playerCore.ts` is the intended Player Core root aggregate. It groups identity, summoner profile, stats, inventory, equipment, skills, talents, titles, achievements, statistics, reputation, quest history, creature contracts, creature slots, world unlocks, save metadata, resources, position, settings, money, skill points, and time.

Player Core modules are already implemented and tested, but most runtime flows still mutate legacy `PlayerState` directly. The current transition keeps that runtime compatibility while making Player Core the authoritative player-owned save aggregate.

Save/load was legacy-first:

- Active Zustand save key: `summonerworld-save`
- Active legacy save version: `1.1.0`
- Active legacy payload field: `player`
- Older helper key: `summonerworld-save-v1`
- Legacy XP serialization could lose BigInt precision
- `discoveredTiles` and world tile maps needed explicit round-trip handling

The migration must not break existing local saves, online sync payloads, or current UI panels.

## Decision

Migrate gradually from `PlayerState` to `PlayerCoreState` using a compatibility envelope and adapter layer.

The save file becomes versioned around a stable envelope, not around whichever store shape is current that month. During transition, saves may contain both legacy and core player data:

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

`playerCore` is the authoritative player-owned save aggregate. `legacyPlayer` remains optional compatibility data until all runtime modules read from Player Core or adapters.

## Implemented In T6P.16

- Added `src/modules/save/playerCoreSaveMigration.ts`.
- Added `playerCore: PlayerCoreState | null` to `GameStoreState`.
- Updated character creation and legacy init flows to retain `playerCore`.
- Updated `saveGame()` to write `version: '2.0.0'`, `playerCore`, `legacyPlayer`, and runtime state.
- Updated `loadGame()` to read `2.0.0`, migrate active `1.1.0` saves, and migrate `summonerworld-save-v1` helper saves.
- Preserved BigInt XP as strings in serialized Player Core and legacy player payloads.
- Preserved `Set` and `Map` data through explicit serialization for discovered tiles and worlds.
- Added focused migration tests for BigInt round-trip, active legacy save migration, helper payload migration, and v2 idempotency.

## Migration Phases

### Phase 0 - Document and Freeze Boundaries

Goal: stop accidental growth of legacy `PlayerState`.

- Treat `PlayerState` as runtime compatibility state.
- Treat `PlayerCoreState` as the future source of truth for player-owned domain data.
- New Player-owned systems should target Player Core modules first.
- Legacy fields may still be read by UI/store until their adapter is ready.
- Do not add new long-lived systems directly to `PlayerState` unless they are explicitly temporary.

### Phase 1 - Add Pure Serialization Layer

Goal: make Player Core safely saveable without changing runtime behavior.

Create a dedicated save migration module:

```text
src/modules/save/playerCoreSaveMigration.ts
```

Responsibilities:

- `serializePlayerCore(core: PlayerCoreState): SerializedPlayerCoreState`
- `deserializePlayerCore(data: unknown): PlayerCoreState`
- `serializeLegacyPlayer(player: PlayerState): SerializedPlayerState`
- `deserializeLegacyPlayer(data: unknown): PlayerState`
- `migrateSaveToV2(data: unknown): SaveEnvelopeV2`
- `migrateLegacyPlayerToCore(player: PlayerState): PlayerCoreState`
- `projectCoreToLegacyPlayer(core: PlayerCoreState, previous?: PlayerState): PlayerState`

Important rules:

- BigInt fields must serialize as strings, not numbers.
- `Set`, `Map`, and dates must have explicit round-trip handling.
- Missing Player Core fields must be filled through factory defaults.
- Migration must be pure and unit tested. It should not call Zustand, `localStorage`, server APIs, random generators, or wall-clock time except through injected parameters.

### Phase 2 - Dual-Read Load Flow

Goal: load old and new saves through one path.

`loadGame()` should read the active key `summonerworld-save` and detect payload shape:

- If `version` is `2.0.0` and `playerCore` exists, deserialize `playerCore`.
- If `version` is `1.1.0` and `player` exists, migrate `player` into `playerCore`.
- If only `summonerworld-save-v1` exists, migrate the older helper payload into the new envelope.
- If migration fails, leave the save untouched and return a clear failure log.

During this phase, the store may still set `state.player` by projecting `playerCore` back to legacy `PlayerState`.

### Phase 3 - Dual-Write Save Flow

Goal: preserve rollback compatibility while Player Core becomes canonical.

`saveGame()` should write:

- `playerCore`: authoritative migrated/core state.
- `legacyPlayer`: temporary projection for old runtime panels and safer rollback.
- `runtime`: world, screen, combat, dungeon, mission, activity, log, and transient state.

The store can continue exposing `player` while also holding `playerCore`:

```ts
interface GameStoreState {
  player: PlayerState | null;
  playerCore: PlayerCoreState | null;
}
```

Temporary invariant:

```text
playerCore identity/resources/position/money/time must match projected player fields after every save/load.
```

### Phase 4 - Runtime Adapters

Goal: move store/UI modules one domain at a time without a full rewrite.

Recommended adapter order:

1. Identity, resources, position, money, time
2. Statistics and quest history
3. Inventory
4. Equipment
5. Creature contracts and creature slots
6. Summoning and command permissions
7. Reputation, titles, achievements
8. Skills and talents

Each adapter should expose narrow getters/actions so UI does not need to know both shapes:

```ts
getPlayerDisplayName(state)
getPlayerResources(state)
addInventoryItem(state, item)
getActiveCreatureSlots(state)
performContractSummon(state, contractId)
```

Once a domain is adapted, runtime writes should go through Player Core module functions instead of direct legacy mutation.

### Phase 5 - Core-First Store

Goal: make Player Core the runtime source of truth.

After all high-use panels and systems use adapters:

- Store actions mutate `playerCore` first.
- Legacy `player` becomes derived compatibility data.
- Save payload no longer needs `legacyPlayer` by default.
- Online sync can send `playerCore` or a server-specific DTO derived from it.

### Phase 6 - Legacy Removal

Goal: remove duplicate state after compatibility window.

Remove or deprecate:

- Direct writes to `player.inventory`, `player.creatures`, `player.skillsUnlocked`, `player.unlocked_node_ids`, and flat stat fields where Player Core equivalents exist.
- `legacyPlayer` from new saves.
- Any UI logic that assumes creature capacity is always `6` instead of using `creatureSlots`.
- Any save migration path older than the supported compatibility window.

Keep read-only import support for exported old saves if needed.

## Field Mapping

| Legacy `PlayerState` | Player Core destination | Notes |
|---|---|---|
| `id`, `name`, `gender`, `appearance` | `identity` | Direct mapping. |
| `archetype` | `summonerProfile.archetype`, derived `class` | Use existing class fallback. |
| `level`, `experience` | `level`, `experience` | Serialize BigInt as string. |
| `affinity` | `elements` | Preserve learned/secondary/tertiary traits if present. |
| `strength`, `vitality`, `intelligence`, `dexterity`, `wisdom`, `luck` | `primaryStats` | Recalculate secondary stats after equipment migration. |
| `defense`, `speed` | compatibility/projection | These are not direct Player Core primary stats; derive or preserve during projection. |
| `energy`, `nerve`, `happy`, `life` | `resources` | Direct mapping. |
| `currentWorldId`, `tileX`, `tileY` | `position`, `worldUnlocks.activeWorldId` | `worldUnlocks.unlockedWorlds` can be derived conservatively from progress. |
| `creatures` | `creatureContracts`, `creatureSlots` | Wrap creatures with contracts while preserving creature instances. |
| `inventory` | `inventory` | Initially preserve `InventoryStack[]`; later migrate to categorized `InventoryItem[]` if the type is widened. |
| `activeQuests`, `completedQuests` | `questHistory` | Direct mapping. |
| `skillsUnlocked` | `skills` | Convert record into `SkillEntry[]`. |
| `unlocked_node_ids` | `talents` | Convert IDs into unlocked talent nodes. |
| `money`, `skillPoints` | `money`, `skillPoints` | Direct mapping. |
| `dayCount`, `gameTimeMinutes` | `dayCount`, `gameTimeMinutes` | Direct mapping. |
| `settings` | `settings` | Direct mapping with defaults. |
| `discoveredTiles`, `territorialHostilities`, activity state | runtime envelope or world/domain state | Do not force world-owned data into Player Core. |

## Invariants

Migration must preserve:

- Player identity
- XP and level
- Money and skill points
- Resources
- Position and active world
- Creature instances
- Inventory stacks
- Active/completed quests
- Career tree unlocks
- Settings
- Offline catch-up timestamps and missions

Migration must not:

- Regenerate starting creatures for existing saves
- Re-roll player element identity
- Lose BigInt precision
- Drop unknown inventory modifiers
- Drop creature mutation, affection, evolution, health, mana, skills, or traits
- Convert world-owned state into Player Core

## Testing Plan

Focused tests cover:

- Load `1.1.0` save payload and migrate to `2.0.0`.
- Load `summonerworld-save-v1` style payload and migrate to `2.0.0`.
- Round-trip `PlayerCoreState` with BigInt XP as string.
- Migrate legacy creatures into contracts without changing creature instance data.
- Migrate inventory stacks without dropping modifiers.
- Project `PlayerCoreState` back to legacy `PlayerState` for existing UI.
- Verify save/load idempotency: migrating an already migrated save produces the same result.
- Verify missing optional fields use defaults without crashing.

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

## Consequences

Positive:

- Existing saves remain loadable.
- Player Core can become authoritative without a risky big-bang rewrite.
- Store/UI can migrate per domain.
- Save files gain a stable envelope that separates player-owned data from runtime/world state.
- Online sync can later adopt Player Core DTOs cleanly.

Tradeoffs:

- For several tasks, both `player` and `playerCore` will exist in store state.
- Adapters must maintain temporary consistency between the two shapes.
- Runtime actions still mostly mutate `PlayerState`; `saveGame()` refreshes `playerCore` from legacy state during the transition.
- Some code will look redundant until legacy fields are removed.

## Open Questions

- Should `PlayerCoreState.inventory` remain `InventoryStack[]`, or should it be widened to `InventoryItem[]` before core-first runtime?
- Should server sync accept `playerCore` directly, or should the client send a normalized server DTO?
- How long should old local save formats remain supported?
- Should the old helper key `summonerworld-save-v1` be auto-upgraded into `summonerworld-save`, or only read as fallback?
