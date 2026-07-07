# 09 - Self Review Prompt

Use this prompt before asking for review or opening a Pull Request.

```text
You are self-reviewing your SummonerWorld changes.

Change summary:
[INSERT SUMMARY]

Required workflow:

1. Re-read the requested task or purpose.
2. Confirm Kilo Workflow Evidence exists from before coding.
3. Confirm Context Engine was used: TaskAnalyzer and ContextPlanner.
4. Confirm Orchestrator was used: TaskLifecycle and AgentSelection.
5. Check the diff mentally against the task scope.
6. Confirm no unrelated changes were included.
7. Confirm existing systems were reused where appropriate.
8. Confirm no duplicate systems were created.
9. Confirm deterministic systems remain deterministic.
10. Confirm save/load impact was considered.
11. Confirm MMO compatibility was considered.
12. Confirm tests and docs were handled.
13. Run `.kilo/orchestrator/ReviewPipeline.md`.
14. Run relevant `.kilo/checklists` and `.kilo/rules/99_FINAL_CHECKLIST.md`.
15. Run `.kilo/guardian/GuardianGate.md`.
16. Confirm PR notes are honest.

Self-review questions:

- Did I implement exactly the requested work?
- Did I produce Kilo Workflow Evidence before coding?
- Did I use TaskAnalyzer, ContextPlanner, TaskLifecycle, and AgentSelection?
- Did I run ReviewPipeline, checklists, and GuardianGate?
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

## Kilo Workflow Check

## Guardian Status

## Remaining Concerns

If not ready, fix issues before opening or updating the PR.
```
