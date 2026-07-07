# 08 - Security Rules

## Security Philosophy

SummonerWorld starts offline-first, but every system should be designed with future online and MMO security in mind.

Client-side logic can support UX, but future authoritative systems must be validated server-side.

Online implementation tasks must follow `.kilo/rules/24_ONLINE_IMPLEMENTATION_CONTRACT.md`.

## Secret Handling

Never commit secrets.

Forbidden in repository files:

- API keys
- Tokens
- Passwords
- Private database URLs
- Production credentials
- Private signing keys

Use `.env.example` for documented environment variables.

## Client Authority Rule

Do not treat the client as trusted for future online systems.

Future server-authoritative validation will be required for:

- Currency changes
- Inventory changes
- Marketplace trades
- PvP results
- Guild bank operations
- Dungeon party progression
- Account progression
- Demonlord challenge results

## Input Validation

Validate external and user-controlled inputs.

Examples:

- Save import data
- Account data in future online mode
- Chat messages in future MMO mode
- Marketplace listing data
- Trade data
- Quest command input
- Debug/admin tools

For account work, never store plaintext passwords. Use password hashing and session/token handling.

## Save Import Safety

Imported save files must be treated as untrusted.

Before applying imported save data:

- Validate schema.
- Validate version.
- Validate required fields.
- Reject impossible values where practical.
- Avoid executing imported content.

## Dependency Safety

Before adding dependencies:

- Prefer existing dependencies if sufficient.
- Check maintenance status.
- Avoid unnecessary packages.
- Avoid packages that require network access for offline features.

## OpenAI and External API Rules

If external APIs are added later:

- Keep keys out of source code.
- Route sensitive calls through backend where possible.
- Do not expose private prompts or secrets to the client.
- Document cost and privacy behavior.

## MMO Abuse Prevention

Design future online systems with abuse resistance:

- Rate limits
- Audit logs
- Event validation
- Anti-duplication checks
- Trade restrictions
- Marketplace fraud checks
- Permission checks

## PR Security Notes

If a task touches authentication, persistence, trading, marketplace, or server-authoritative logic, the PR must include a security note.
