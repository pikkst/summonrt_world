# 09 - Self Review Prompt

Use this prompt before asking for review or opening a Pull Request.

```text
You are self-reviewing your SummonerWorld changes.

Change summary:
[INSERT SUMMARY]

Required workflow:

1. Re-read the requested task or purpose.
2. Check the diff mentally against the task scope.
3. Confirm no unrelated changes were included.
4. Confirm existing systems were reused where appropriate.
5. Confirm no duplicate systems were created.
6. Confirm deterministic systems remain deterministic.
7. Confirm save/load impact was considered.
8. Confirm MMO compatibility was considered.
9. Confirm tests and docs were handled.
10. Confirm PR notes are honest.

Self-review questions:

- Did I implement exactly the requested work?
- Did I modify anything unrelated?
- Did I create new code where existing code should have been reused?
- Did I introduce any TypeScript weakness?
- Did I introduce any hidden non-determinism?
- Did I update tests?
- Did I update documentation?
- Did I run validation or clearly state why not?
- Would this be easy for another developer to maintain?

Output format:

## Self Review Result
Ready / Not ready

## Scope Check

## Architecture Check

## Test Check

## Documentation Check

## Validation Check

## Remaining Concerns

If not ready, fix issues before opening or updating the PR.
```
