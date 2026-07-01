# Release Checklist

Use this checklist before closing a sprint, milestone, or release candidate.

## Task Status

- [ ] Active sprint tasks were reviewed.
- [ ] Completed task checkboxes match real implementation.
- [ ] Incomplete tasks are clearly listed.
- [ ] Blocked tasks are documented.
- [ ] Follow-up tasks are created or noted.

## Build and Test

From `summoner-world`:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## Gameplay Sanity

- [ ] Core loop still works.
- [ ] Save/load still works if relevant.
- [ ] Deterministic systems are stable.
- [ ] Dungeon/combat flows pass relevant tests.
- [ ] Player-owned state is not corrupted.

## Documentation

- [ ] Tasks file is current.
- [ ] Progress file is current.
- [ ] GDD reflects implemented gameplay.
- [ ] TechnicalSpec reflects implemented architecture.
- [ ] Known issues are documented.

## Release Safety

- [ ] Sensitive credentials are not present in committed files.
- [ ] Temporary debug-only code is not left in production paths.
- [ ] Future online-critical state is not treated as client-authoritative.
- [ ] Dependencies are acceptable.

## Release Notes

- [ ] Completed features summarized.
- [ ] Fixes summarized.
- [ ] Known issues listed.
- [ ] Next sprint recommendations listed.
