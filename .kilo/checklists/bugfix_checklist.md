# Bugfix Checklist

Use this checklist before marking a bug fix complete.

## Bug Understanding

- [ ] Observed behavior is understood.
- [ ] Expected behavior is clear.
- [ ] Root cause was identified or reasonably explained.
- [ ] The smallest safe fix was chosen.
- [ ] The fix does not hide a larger architecture problem.

## Scope

- [ ] Bugfix branch was created from `master`.
- [ ] Only the bug was fixed.
- [ ] No unrelated feature work was added.
- [ ] No unrelated refactor was added.
- [ ] Existing tests and code were checked first.

## Regression Protection

- [ ] Regression test added where practical.
- [ ] Existing tests updated only when behavior intentionally changed.
- [ ] No tests were deleted to hide the bug.
- [ ] Edge case that caused the bug is covered.

## Safety

- [ ] TypeScript errors were fixed, not suppressed.
- [ ] Deterministic behavior was preserved.
- [ ] Save/load compatibility was considered.
- [ ] MMO/server-authority implications were considered if relevant.
- [ ] No validation or security checks were weakened.

## Documentation

- [ ] Documentation updated if documented behavior changed.
- [ ] Known issue notes updated if relevant.
- [ ] PR explains the root cause and fix.

## Validation

From `summoner-world`:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## PR

- [ ] PR title clearly says this is a fix.
- [ ] PR body includes root cause.
- [ ] PR body includes regression test notes.
- [ ] Remaining risks are documented.
