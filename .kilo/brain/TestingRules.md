# Testing Rules

## Required Validation Commands

For every code task, run these commands from the `summoner-world` folder:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If a command fails, the task is not complete.

## Test Requirements

Every gameplay system should have:

- Unit tests for pure logic.
- Integration tests for cross-system behavior.
- Regression tests for previously fixed bugs.

## Deterministic Test Rules

For procedural systems:

- Same seed must produce the same result.
- Generated structures must be valid.
- Graphs must be connected where required.
- Critical paths must be reachable.
- Edge cases must be covered.

## Dungeon Test Expectations

Dungeon-related tests should verify:

- Floor graph connectivity.
- Entrance-to-boss reachability.
- Multiple shortest paths when required.
- Treasure room placement.
- Boss floor reachability.
- Vertical tower links.
- Deterministic output for same seed.

## Pull Request Validation Section

Each PR must include the validation status:

```text
## Validation
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build
```

If a command was not run, clearly say why.
