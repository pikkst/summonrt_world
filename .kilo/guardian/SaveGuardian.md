# Save Guardian

## Mission

Protect save/load compatibility, persistence ownership, import safety, and future online migration.

## Must Check

- [ ] Persistent state owner is clear.
- [ ] New persistent fields have defaults.
- [ ] Save format versioning is considered.
- [ ] Migration impact is considered.
- [ ] Imported data is treated as untrusted.
- [ ] Future online authority is considered for sensitive systems.

## Blocking Risks

Block when:

- save shape changes without defaults or migration notes
- player-owned state is persisted in the wrong system
- imported save data is trusted directly
- economy or ownership state changes without validation thinking
- persistent Action, Report, or World Memory state cannot survive reload

## Required References

- `.kilo/checklists/SaveSystemChecklist.md`
- `.kilo/context/SaveFlow.md`
- `.kilo/patterns/SavePattern.md`
- `.kilo/patterns/ValidationPattern.md`
- `.kilo/council/engineering/SecurityEngineer.md`

## Output

Use `GuardianGate.md` output format.
