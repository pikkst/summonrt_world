# 23 - MMO Rules

## MMO Direction

SummonerWorld starts as an offline-first prototype but must remain compatible with a future MMORPG architecture.

Do not make offline implementation choices that block future server-authoritative systems.

## Progression Path

The intended path is:

```text
Offline Prototype
  -> Online Prototype
  -> MMO Alpha
  -> MMO Beta
  -> Persistent World Launch
```

## Server Authority Rule

Future online systems must be server-authoritative for important state changes.

The server must validate:

- Account progression
- Currency changes
- Item trades
- Marketplace purchases
- Creature ownership
- Creature fusion
- PvP results
- Guild bank changes
- Dungeon party progression
- Demonlord challenge results
- Territory control

Client-side prediction may improve UX, but the server is the source of truth.

## Event Sourcing Rule

MMO-compatible systems should move toward event sourcing where practical.

Important events should be auditable, replayable, and validated.

Examples:

```text
CurrencyChanged
ItemTraded
MarketListingPurchased
PlayerLevelChanged
CreatureContracted
CreatureFused
PvPMatchResult
GuildBankChanged
DemonlordThroneClaimed
```

## Determinism Rule

Shared procedural systems must be deterministic.

The server may send seeds and authoritative state; clients may generate matching views from shared inputs.

This applies to:

- World generation
- Dungeon generation
- Room metadata
- Spawn tables
- Some loot previews
- Party dungeon sync

## Offline Compatibility Rule

Offline systems should not require network access.

If a feature is online-only, clearly separate it from offline core progression.

## Account Rule

Future accounts should support:

- Registration/login
- Session management
- Cloud saves
- Character ownership
- Friends
- Block list
- Mail
- Guild membership
- Moderation records

## Social Systems Rule

MMO social systems should include safety and moderation considerations.

Examples:

- Chat filtering
- Reports
- Blocks
- Guild permissions
- Trade restrictions
- Anti-spam limits

## Marketplace Rule

The marketplace must be server-authoritative.

Marketplace systems need:

- Listing fees
- Trade taxes
- Binding restrictions
- Rarity restrictions
- Fraud prevention checks
- Contract listing rules for eligible creatures
- Audit logs

## PvP Rule

PvP must be designed for fairness and validation.

Future PvP systems may include:

- Arena PvP
- Ranked seasons
- Bounties
- Consent-based open-world PvP
- Faction wars
- Guild territory conflict

PvP results must not be client-authoritative.

## Guild Rule

Guild systems must be permissioned and auditable.

Guild features may include:

- Guild creation
- Invites
- Shared vaults
- Guild halls
- Territory control
- Guild support for Demonlord challenges
- Guild contribution tracking

## Live Operations Rule

Future launch systems should support:

- Monitoring
- Analytics
- Price floor/ceiling monitoring
- Event scheduling
- Server health alerts
- Moderation tools
- Regression testing

## Testing Requirements

MMO-related features should test:

- Server validation paths
- Permission checks
- Event replay
- Concurrent action safety where practical
- Trade and marketplace edge cases
- Party dungeon synchronization
- Guild permission rules

## Forbidden

- Do not make important online state client-authoritative.
- Do not add online-only requirements to offline core systems.
- Do not expose secrets to the client.
- Do not implement trading or marketplace without validation rules.
- Do not make Demonlord challenge outcomes unaudited.
- Do not ignore moderation and abuse prevention for social systems.
