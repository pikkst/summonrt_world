# 04 - Testing Rules

## Validation Commands

For code changes, run these commands from the `summoner-world` folder:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If a command fails, the PR must clearly describe the failure.

## Minimum Test Expectations

Every gameplay task should include tests when practical.

Use:

- Unit tests for pure logic.
- Integration tests for system interaction.
- Regression tests for fixed bugs.
- Determinism tests for procedural systems.

## Test Placement

Follow the existing project structure.

If no clear test folder exists for the target system, use the closest existing test location and keep naming consistent.

## Deterministic System Tests

Procedural systems must test repeatability.

Examples:

- Same seed generates same dungeon.
- Same world index and floor index generate the same boss floor.
- Same creature inputs generate the same deterministic derived data when applicable.

## Dungeon Test Requirements

Dungeon tests should verify:

- Generated floors are connected.
- Entrance-to-boss path exists.
- Boss floor is reachable.
- Tower vertical links are valid.
- Treasure rooms exist when required.
- Safe floors have rest/vendor/teleport metadata.
- World 10 dungeon full clear simulation can traverse all floors.

## Save/Load Test Requirements

Persistent features must test:

- Serialization
- Deserialization
- Round-trip stability
- Version/migration compatibility when relevant

## Economy and Simulation Test Requirements

Simulation systems should test:

- Bounds
- Stability over many ticks
- No negative impossible values
- Deterministic replay where required

## Test Quality Rules

Tests should not simply assert that a function returns something.

Good tests verify meaningful gameplay invariants.

## PR Validation Honesty

Use this exact style in PR notes:

```text
## Validation
- [x] npm run typecheck
- [x] npm run lint
- [x] npm run test
- [x] npm run build
```

If not run:

```text
- [ ] npm run test — not run; documentation-only change
```

Never claim a command passed unless it was actually run.
