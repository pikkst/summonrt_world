# 01 - Git Rules

## Mandatory Branch Rule

Every new task must be developed on a new branch.

Never commit feature, fix, refactor, or documentation task work directly to `master`.

## Mandatory Pull Request Rule

Every new task must be delivered through its own Pull Request.

One task = one branch = one Pull Request.

## Branch Naming

Use task-aware branch names:

```text
feature/TASK-ID-short-name
fix/TASK-ID-short-name
refactor/TASK-ID-short-name
docs/TASK-ID-short-name
chore/TASK-ID-short-name
```

Examples:

```text
feature/T6-12-world-10-dungeon-simulation
feature/T6P-1-player-core-state
fix/T6-13-dungeon-combat-missions
refactor/T6-14-combat-career-passives
docs/kilo-ai-framework
```

## Commit Rules

Commit messages must be clear and specific.

Good examples:

```text
Implement T6.12 world 10 dungeon simulation test
Add PlayerCoreState root aggregate
Refactor dungeon pathfinding utilities
Fix deterministic boss floor reachability
```

Bad examples:

```text
fix stuff
updates
new code
changes
work
```

## Pull Request Description

Every PR must include:

```text
## Summary
- What changed
- Why it changed
- Which task it completes

## Validation
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build

## Notes
- Known limitations
- Follow-up tasks
- Documentation updates
```

## PR Scope Rules

A PR must not mix unrelated changes.

Allowed:

- One feature and its tests.
- One bug fix and its regression test.
- One refactor task and its tests.
- One documentation update.

Forbidden:

- Feature plus unrelated cleanup.
- Refactor plus gameplay change unless the task explicitly requires it.
- Documentation rewrites unrelated to the implemented task.
- Multiple sprint tasks in one PR unless explicitly requested.

## Validation Honesty

If validation commands were not run, say so in the PR.

Do not claim success for commands that were not executed.

## Master Branch Protection Rule

`master` must remain the stable integration branch.

Task work reaches `master` only through reviewed Pull Requests.
