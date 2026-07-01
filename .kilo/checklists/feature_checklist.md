# Feature Checklist

Use this checklist before marking a feature task complete.

## Scope

- [ ] Exact task ID or feature purpose is identified.
- [ ] Feature branch was created from `master`.
- [ ] Only this feature was implemented.
- [ ] No unrelated refactors were added.
- [ ] Existing systems were searched before adding new code.
- [ ] No duplicate system was created.

## Architecture

- [ ] Player-first architecture is preserved.
- [ ] Module ownership is clear.
- [ ] Cross-system effects are event-driven or explicitly coordinated.
- [ ] Save/load impact was considered.
- [ ] Future MMO/server-authority impact was considered.
- [ ] Deterministic systems remain deterministic.

## Code Quality

- [ ] TypeScript strictness is preserved.
- [ ] No unnecessary `any` was introduced.
- [ ] No circular dependencies were introduced.
- [ ] No gameplay constants were hard-coded without reason.
- [ ] Comments are in English.
- [ ] React components do not contain heavy gameplay logic.

## Tests

- [ ] Unit tests were added or updated where practical.
- [ ] Integration tests were added or updated where relevant.
- [ ] Deterministic systems have deterministic tests.
- [ ] Save/load tests were added if persistent state changed.
- [ ] Tests protect meaningful gameplay behavior.

## Documentation

- [ ] Task file updated if the task status changed.
- [ ] GDD updated if gameplay rules changed.
- [ ] TechnicalSpec updated if architecture/persistence changed.
- [ ] `.kilo` docs updated if AI workflow changed.

## Validation

From `summoner-world`:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## PR

- [ ] PR targets `master`.
- [ ] PR summary explains what changed and why.
- [ ] PR validation section is honest.
- [ ] Known limitations are documented.
