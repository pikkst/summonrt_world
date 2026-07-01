# Git and Pull Request Rules

## Prime Rule

Every new task must be developed in its own branch and delivered through its own Pull Request.

Never commit task work directly to `master`.

## Required Task Flow

For every new task:

1. Read the current task description from `SummonerWorld_Tasks.md`.
2. Create a new branch from `master`.
3. Use a clear branch name based on the task ID and short purpose.
4. Implement only that task.
5. Add or update tests required by the task.
6. Run validation commands.
7. Commit the completed work.
8. Open a Pull Request back into `master`.
9. Include a PR summary, test results, and changed files overview.

## Branch Naming

Use this format:

```text
feature/TASK-ID-short-name
fix/TASK-ID-short-name
refactor/TASK-ID-short-name
docs/TASK-ID-short-name
```

Examples:

```text
feature/T6-12-world-10-dungeon-simulation
feature/T6P-1-player-core-state
fix/T6-13-dungeon-combat-mission-integration
refactor/T6-14-combat-career-passives
```

## Pull Request Requirements

Each PR must include:

```text
## Summary
- What was implemented
- Why it was implemented
- Which task it completes

## Validation
- npm run typecheck
- npm run lint
- npm run test
- npm run build

## Notes
- Any known limitations
- Any follow-up tasks
```

## Commit Rules

Use clear commit messages:

```text
Implement T6.12 world 10 dungeon simulation test
Fix T6.13 automated dungeon combat integration
Refactor dungeon pathfinding utilities
Add PlayerCoreState root aggregate
```

## Forbidden

- Do not push task work directly to `master`.
- Do not combine unrelated tasks in one PR.
- Do not make large refactors inside feature PRs unless the task explicitly requires it.
- Do not mark PR ready if validation commands fail.
- Do not update completed task checkboxes unless implementation and validation are complete.
