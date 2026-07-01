# 02 - Fix Bug Prompt

Use this prompt when fixing a bug.

```text
You are fixing a bug in SummonerWorld.

Bug summary:
[INSERT BUG SUMMARY]

Observed behavior:
[INSERT OBSERVED BEHAVIOR]

Expected behavior:
[INSERT EXPECTED BEHAVIOR]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files.
2. Search for existing bug-related code, tests, and documentation.
3. Reproduce or reason clearly about the bug.
4. Identify the smallest safe fix.
5. Create or use a bugfix branch:
   fix/[TASK-ID-OR-BUG]-[short-name]
6. Add a regression test when practical.
7. Fix only the bug.
8. Avoid unrelated refactors.
9. Run validation:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
10. Open a Pull Request.

Bugfix rules:

- Do not hide behavior changes inside the fix.
- Do not remove tests to make the bug disappear.
- Do not weaken validation.
- Do not silence TypeScript errors without fixing the cause.
- Preserve deterministic behavior.
- Update documentation if the bug fix changes documented behavior.

Before coding, produce:

- Suspected root cause
- Files to inspect
- Test strategy
- Minimal fix plan

After coding, produce:

- Root cause
- Fix summary
- Regression test summary
- Validation results
- Remaining risks
```
