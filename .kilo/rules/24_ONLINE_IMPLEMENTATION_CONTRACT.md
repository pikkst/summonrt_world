# 24 - Online Implementation Contract

Use this contract when a task implements or changes online, account, cloud save, social, trade, party, guild, PvP, marketplace, dungeon party sync, or server-authoritative behavior.

## Direction

SummonerWorld is offline-first now, but online features must be built as a server-authoritative MMORPG path, not as trusted client shortcuts.

The client may request, preview, cache, and predict.
The server validates and commits important state.

## Required Architecture

Online implementation must use an explicit service boundary:

```text
UI / Store
  -> GameService interface
    -> OfflineGameService for local/offline mode
    -> OnlineGameService for fetch/WebSocket mode
      -> Server API
        -> Validation
        -> Authoritative state change
        -> Event/audit record where important
```

Do not scatter raw `axios`, `fetch`, or WebSocket calls across store modules for new online work.

If legacy direct calls already exist, do not expand them. Add or route through a service boundary when touching that area.

## Server Authority

The client must never be authoritative for:

- account progression
- currency
- inventory
- item trades
- marketplace listings or purchases
- creature ownership
- creature fusion
- PvP results
- guild membership, permissions, and banks
- dungeon party progression
- Demonlord challenge results
- territory control

Client payloads are requests. Server responses are authoritative results.

## Auth And Sessions

Online account work must include:

- password hashing, never plaintext passwords
- session or token strategy
- server-side identity lookup
- no trusted `playerId` from the client without authentication
- no secrets committed to source
- `.env.example` updates when environment variables change

## Validation

Every online mutation endpoint must validate:

- authenticated actor
- ownership and permissions
- input shape and bounds
- resource costs
- duplicate submission/idempotency where relevant
- impossible values
- current state preconditions

Trade, marketplace, guild bank, PvP, and Demonlord endpoints must include audit notes or event records.

## Realtime

Use WebSocket/Socket.IO only when realtime state is required.

Realtime events must have:

- authenticated connection identity
- room/channel authorization
- server-generated authoritative payloads
- disconnect/reconnect behavior
- rate limits or spam protection for social channels

## Offline Compatibility

Offline core gameplay must still work without network access.

Online-only features must be isolated behind service methods and clear UI states.

Do not make local exploration, combat, save/load, or progression require a server unless the task explicitly converts that system.

## Persistence Direction

Follow the current technical direction unless the task explicitly changes it:

```text
Local JSON / SQLite prototype
  -> PostgreSQL + Prisma online infrastructure
  -> server-authoritative MMORPG persistence
```

If using a temporary backend model, document why it is temporary and how it maps to the intended online schema.

## Tests

Online tasks must add or update tests for:

- service interface behavior
- server validation success/failure
- permission checks
- unauthorized requests
- important event/audit output
- offline fallback where relevant
- concurrency or duplicate requests when practical

## Forbidden

- No plaintext password storage.
- No client-authoritative important state.
- No new direct API calls inside UI or store modules when a service boundary is required.
- No online-only dependency for offline core gameplay.
- No trade, marketplace, guild bank, PvP, or Demonlord authority without validation and auditability.
- No hardcoded production server URLs.
