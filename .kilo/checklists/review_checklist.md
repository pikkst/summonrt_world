# Review Checklist

Use this checklist when reviewing code or a Pull Request.

## Scope Review

- [ ] PR has a clear task or purpose.
- [ ] PR does not mix unrelated work.
- [ ] Branch name matches the task or purpose.
- [ ] PR targets `master`.
- [ ] PR description is honest and useful.

## Architecture Review

- [ ] Player-first architecture is preserved.
- [ ] Existing systems were reused where appropriate.
- [ ] No duplicate systems were introduced.
- [ ] Module ownership is clear.
- [ ] Cross-system effects are event-driven or clearly coordinated.
- [ ] Save/load impact was considered.
- [ ] MMO/server-authority impact was considered where relevant.

## Code Review

- [ ] TypeScript safety is preserved.
- [ ] No unnecessary `any` introduced.
- [ ] No broad error suppressions added.
- [ ] No hidden non-determinism introduced.
- [ ] No circular dependencies introduced.
- [ ] Comments are useful and in English.
- [ ] React components are not overloaded with gameplay logic.

## Test Review

- [ ] Tests protect meaningful behavior.
- [ ] Regression tests exist for bug fixes.
- [ ] Deterministic systems have deterministic tests.
- [ ] Persistent state changes include save/load tests where practical.
- [ ] Test changes do not merely weaken assertions.

## Documentation Review

- [ ] Task status updated only if actually complete.
- [ ] GDD updated if gameplay changed.
- [ ] TechnicalSpec updated if architecture or persistence changed.
- [ ] PR notes mention documentation impact.

## Validation Review

- [ ] Validation commands are listed.
- [ ] Claims about passed commands are credible.
- [ ] If commands were not run, PR explains why.

## Review Output

- [ ] Blocking issues are clearly separated.
- [ ] Non-blocking suggestions are clearly separated.
- [ ] Positive notes are included when appropriate.
