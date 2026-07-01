# 99 - Final Checklist

Use this checklist before opening or updating a Pull Request.

## Task Scope

- [ ] I identified the exact task ID.
- [ ] I implemented only the requested task.
- [ ] I avoided unrelated refactors.
- [ ] I searched for existing implementation before creating new code.
- [ ] I did not duplicate systems.

## Git Workflow

- [ ] Work is on a task-specific branch.
- [ ] Work is not committed directly to `master`.
- [ ] Branch name includes task ID or clear purpose.
- [ ] Pull Request targets `master`.
- [ ] PR title clearly describes the task.

## Code Quality

- [ ] TypeScript types are clear.
- [ ] No unnecessary `any` was introduced.
- [ ] No circular dependencies were introduced.
- [ ] No deterministic system now uses non-deterministic randomness.
- [ ] No magic numbers were introduced without named constants.
- [ ] Comments are in English.

## Architecture

- [ ] Player-first architecture is preserved.
- [ ] Existing module ownership is respected.
- [ ] Save/load impact was considered.
- [ ] MMO compatibility was considered.
- [ ] Event-driven boundaries were used or preserved where appropriate.

## Tests

- [ ] Unit tests were added or updated when needed.
- [ ] Integration tests were added or updated when needed.
- [ ] Regression tests were added for bug fixes.
- [ ] Deterministic systems have deterministic tests.

## Validation

From `summoner-world` folder:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

If any command was not run, explain why in the PR.

## Documentation

- [ ] Task file updated when task status changed.
- [ ] GDD updated if gameplay changed.
- [ ] TechnicalSpec updated if architecture or persistence changed.
- [ ] Relevant system bible updated if needed.
- [ ] PR notes explain documentation impact.

## Pull Request Description

PR includes:

- [ ] Summary
- [ ] Task reference
- [ ] Validation results
- [ ] Documentation notes
- [ ] Known limitations
- [ ] Follow-up tasks if needed

## Final Rule

Do not claim completion unless the checklist is true or the PR clearly states what remains incomplete.
