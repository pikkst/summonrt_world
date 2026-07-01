# 15 - Event System Rules

## Event-Driven Direction

SummonerWorld should move toward an event-driven architecture as systems grow.

Events keep systems modular, testable, replayable, and compatible with future server-authoritative MMO infrastructure.

## Event Purpose

Events should represent meaningful domain changes.

Good examples:

```text
PlayerEnteredWorld
PlayerEnteredBiome
PlayerCompletedQuest
PlayerCraftedItem
CreatureContracted
CreatureFused
DungeonFloorCleared
DungeonBossDefeated
DemonlordThroneClaimed
ItemTraded
CurrencyChanged
SettlementDemandChanged
```

Bad examples:

```text
ButtonClicked
SetFlagTrue
DoStuff
UpdateThing
```

UI events may exist locally, but domain events should describe gameplay facts.

## Event Naming

Use past-tense names for facts that already happened:

```text
PlayerDefeatedBoss
ItemCrafted
CreatureCaptured
```

Use command/action names only for explicit requests that still require validation:

```text
RequestTrade
ChallengeDemonlord
StartDungeonRun
```

## Event Payloads

Event payloads must be typed.

Payloads should include:

- Entity IDs
- Relevant world/player context
- Timestamp or game-time when needed
- Deterministic seed/reference when needed
- Minimal required state, not entire unrelated objects

## Handler Rules

Handlers should:

- Be deterministic when gameplay state depends on them.
- Be idempotent when possible.
- Avoid hidden cross-system mutation.
- Be testable independently.
- Declare or document side effects.

## Ordering Rule

If handler order matters, make ordering explicit.

Do not rely on accidental import order.

## Replay Rule

Important gameplay events should be replayable in tests.

Event replay is especially important for:

- Save/load validation
- World memory
- Achievements
- Statistics
- Reputation
- Economy reactions
- Dungeon history

## Offline Queue Rule

Future offline event queues must preserve event order and prevent duplicate processing.

Use event IDs where needed for idempotency.

## Server Authority Rule

Future online authoritative events must be validated server-side.

Client-published events should be treated as requests unless the server generated or verified them.

## Forbidden

- No untyped event payloads.
- No events with vague names.
- No hidden mutation across many systems without an event or documented coordinator.
- No relying on LLM output as authoritative event state.
- No non-deterministic event handlers for deterministic simulation.
