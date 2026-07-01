# Testing Checklist

Use this checklist when adding, changing, or reviewing tests.

## Test Fit

- [ ] Tests cover meaningful behavior, not only object existence.
- [ ] Tests match the owning system.
- [ ] Regression tests are added for bug fixes when practical.
- [ ] Integration tests are considered for cross-system behavior.

## Determinism

- [ ] Seeded systems use fixed seeds in tests.
- [ ] Simulation results are reproducible.
- [ ] World or dungeon generation tests validate key invariants.
- [ ] Tests do not depend on unstable timing unless explicitly controlled.

## Validation

- [ ] Typecheck is considered.
- [ ] Lint is considered.
- [ ] Unit tests are considered.
- [ ] Build is considered.

## Quality

- [ ] Tests are readable.
- [ ] Test names describe behavior.
- [ ] Assertions are not weakened just to pass.
- [ ] Known gaps are documented.
