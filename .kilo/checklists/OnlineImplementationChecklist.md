# Online Implementation Checklist

Use this checklist for online, account, cloud save, social, trade, party, guild, PvP, marketplace, dungeon party sync, or server-authoritative tasks.

## Scope

- [ ] The task explicitly requires online/MMO behavior or touches an online-sensitive system.
- [ ] Offline core gameplay remains usable unless the task explicitly changes that.
- [ ] Online-only behavior is isolated from offline progression.

## Service Boundary

- [ ] New online calls go through a service interface or repository boundary.
- [ ] Store modules do not gain new scattered raw `axios`, `fetch`, or WebSocket calls.
- [ ] Offline and online implementations have clear responsibilities.
- [ ] API base URLs are configurable and not hardcoded for production.

## Server Authority

- [ ] Client payloads are treated as requests, not trusted state.
- [ ] Server validates important mutations before committing them.
- [ ] Currency, inventory, creature ownership, trades, marketplace, PvP, guild banks, dungeon party progress, Demonlord results, and territory control are not client-authoritative.

## Auth And Security

- [ ] Passwords are hashed if account credentials are implemented or changed.
- [ ] Session/token behavior is documented.
- [ ] Actor identity comes from auth/session, not only a client-provided `playerId`.
- [ ] Inputs are validated for shape, ownership, bounds, and impossible values.
- [ ] Secrets are not committed; `.env.example` is updated when needed.
- [ ] Abuse risks are considered for chat, reports, trade, guilds, marketplace, and PvP.

## Realtime

- [ ] WebSocket/Socket.IO is used only when realtime behavior is required.
- [ ] Realtime channels validate membership and permissions.
- [ ] Server sends authoritative payloads.
- [ ] Disconnect/reconnect behavior is considered.
- [ ] Spam/rate-limit behavior is considered for social features.

## Persistence And Audit

- [ ] Persistence follows the documented PostgreSQL/Prisma direction or documents any temporary backend choice.
- [ ] Important online mutations have event/audit records where relevant.
- [ ] Migration/default behavior is documented for persistent schema changes.

## Tests

- [ ] Service boundary tests were added or updated.
- [ ] Server validation tests cover success and failure.
- [ ] Permission/unauthorized tests were added where relevant.
- [ ] Offline fallback tests were added where relevant.
- [ ] Duplicate/concurrent action behavior was tested or documented.

## PR Notes

- [ ] PR explains server authority impact.
- [ ] PR explains offline compatibility impact.
- [ ] PR explains security and validation impact.
- [ ] PR lists any temporary online architecture debt.
