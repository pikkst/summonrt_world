# Current Task

## Recommended Active Task

```text
T6.12 - Test full clear World 10 dungeon simulation
```

## Purpose

Prove that the current dungeon tower generation supports a complete traversal simulation for World 10.

This task should protect the existing dungeon generator before larger Player Core and World Core work begins.

## Expected Validation Ideas

A T6.12 implementation should likely verify:

- `generateDungeonTower(10)` returns a valid tower.
- Every floor exists and has valid metadata.
- Every floor has a reachable entrance-to-boss path.
- Vertical links connect each floor to the next floor.
- The final boss floor is reachable.
- The simulation can mark floors as cleared in order.
- Deterministic generation remains stable for the same seed.

## Suggested Branch

```text
feature/T6-12-world-10-dungeon-simulation
```

## Files Likely Involved

Likely source files:

- `summoner-world/src/core/dungeonGenerator.ts`
- Existing dungeon test files
- `SummonerWorld_Tasks.md`
- Relevant docs only if task status changes

## Important Constraint

Do not refactor `dungeonGenerator.ts` during this task unless the implementation absolutely requires a very small extraction.

A larger dungeon generator split should be a dedicated refactor PR.
