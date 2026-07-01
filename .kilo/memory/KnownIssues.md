# Known Issues

## Purpose

This file tracks short-term known issues and risks for AI agents.

It is not a replacement for GitHub Issues or `SummonerWorld_Tasks.md`.

## Current Known Risks

### Dungeon Generator File Size

`src/core/dungeonGenerator.ts` contains multiple responsibilities:

- Seed generation
- Maze generation
- Room graph conversion
- Room assignment
- Treasure placement
- Boss floor generation
- Hazard metadata
- Boss scaling
- Tower generation
- Safe floors
- Pathfinding

This is acceptable for the current sprint, but it should eventually be split in a dedicated refactor PR.

Do not perform this split during unrelated feature tasks.

### Current Need for Full Simulation Tests

Dungeon generation has many pieces implemented, but the next high-value protection is a full World 10 dungeon traversal simulation.

Recommended task:

```text
T6.12 - Test full clear World 10 dungeon simulation
```

### Documentation Can Drift

Project documentation is strong but large.

When implementing a task, always check:

- `SummonerWorld_Tasks.md`
- `SummonerWorld_GDD.md`
- `SummonerWorld_TechnicalSpec.md`
- Relevant system bible

### AI Agent Risk

AI agents may try to implement future tasks too early.

Prevent this by enforcing:

```text
One task = one branch = one Pull Request
```

## No Confirmed Runtime Bugs Listed Here

As of this memory snapshot, no specific failing runtime error is recorded in this file.

If a bug is found, add:

- Date
- Symptom
- Expected behavior
- Suspected files
- Related task or issue
- Status
