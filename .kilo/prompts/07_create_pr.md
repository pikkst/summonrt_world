# 07 - Create Pull Request Prompt

Use this prompt when preparing a Pull Request.

```text
You are preparing a Pull Request for SummonerWorld.

Branch:
[INSERT BRANCH]

Task or purpose:
[INSERT TASK / PURPOSE]

Required workflow:

1. Confirm work is not on master.
2. Confirm branch name matches the task or purpose.
3. Confirm the PR contains only related changes.
4. Confirm Kilo Workflow Evidence was produced before coding:
   - TaskAnalyzer result
   - AgentSelection result
   - ContextPlanner selected files
   - execution plan
   - final review todo item
5. Run validation when code changed:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
6. Check documentation impact.
7. Confirm `SummonerWorld_Tasks.md` was updated when task status changed.
8. Run `.kilo/orchestrator/ReviewPipeline.md`.
9. Run relevant `.kilo/checklists` and `.kilo/rules/99_FINAL_CHECKLIST.md`.
10. Run `.kilo/guardian/GuardianGate.md`.
11. Write a clear PR title.
12. Write a PR body using the required template.
13. Open PR into master.

PR title format:

```text
Implement T6.12 world 10 dungeon simulation
Fix dungeon boss floor reachability
Add Kilo prompts workflow
Update Player Core documentation
```

PR body template:

```text
## Summary
- What changed
- Why it changed
- Which task it completes, if applicable

## Validation
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build

## Documentation
- Docs updated:
- Docs not needed because:

## Kilo Workflow
- TaskAnalyzer:
- AgentSelection:
- ContextPlanner:
- ReviewPipeline:
- Checklist:
- Guardian:

## Notes
- Known limitations
- Follow-up tasks
```

Rules:

- Be honest if validation was not run.
- Do not claim tests passed if they were not run.
- Mention documentation-only changes clearly.
- Mention known limitations.
- Do not include unrelated task claims.
- Do not open or update the PR if Guardian status is Blocked.
- Do not claim PR readiness if ReviewPipeline, checklists, or GuardianGate were skipped.
```
