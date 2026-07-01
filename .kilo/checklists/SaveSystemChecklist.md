# Save System Checklist

Use this checklist for save/load, persistence, import/export, and migration-sensitive changes.

## Ownership

- [ ] Persistent state owner is clear.
- [ ] Player-owned state remains rooted correctly.
- [ ] Temporary UI state is not saved unnecessarily.
- [ ] Duplicate persistent ownership is avoided.

## Compatibility

- [ ] Save format version is considered.
- [ ] Defaults exist for new fields.
- [ ] Migration behavior is considered.
- [ ] Imported data is treated as untrusted.

## Validation

- [ ] Required fields are validated.
- [ ] Numeric bounds are checked when relevant.
- [ ] Entity references are checked when relevant.
- [ ] Impossible states are rejected or handled safely.

## Future Online

- [ ] Future server authority is considered.
- [ ] Auditability is considered for economy, trading, PvP, or rewards.
- [ ] Deterministic inputs are stored for replay-sensitive systems.
