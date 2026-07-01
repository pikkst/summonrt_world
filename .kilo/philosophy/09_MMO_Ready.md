# 09 - MMO Ready

## Principle

SummonerWorld should remain compatible with future multiplayer and MMO systems.

Offline-first does not mean offline-only forever.

## Design Meaning

Systems should avoid choices that would require complete rewrites for future online play.

Important future online systems need clear validation, ownership, and audit boundaries.

## MMO-Sensitive Areas

Be careful with:

- currency
- inventory
- creature ownership
- marketplace
- trading
- PvP
- guild banks
- Demonlord challenge results
- world event rewards

## AI Rule

When changing persistent or economy-related gameplay, consider how the system would be validated in future online mode.
