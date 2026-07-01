# 01 - Implement Task Prompt

Use this prompt when implementing a planned task from `SummonerWorld_Tasks.md`.

```text
You are implementing one SummonerWorld task.

Task ID:
[INSERT TASK ID]

Task description:
[INSERT TASK DESCRIPTION]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files.
2. Read SummonerWorld_Tasks.md.
3. Read SummonerWorld_GDD.md.
4. Read SummonerWorld_TechnicalSpec.md.
5. Search the codebase for existing implementation related to this task.
6. Create or use a task-specific branch:
   feature/[TASK-ID]-[short-name]
7. Implement only this task.
8. Add or update tests.
9. Update documentation if gameplay, architecture, persistence, or task status changes.
10. Run validation:
    npm run typecheck
    npm run lint
    npm run test
    npm run build
11. Prepare a Pull Request into master.

Implementation rules:

- Do not implement future tasks.
- Do not refactor unrelated code.
- Do not duplicate existing systems.
- Keep deterministic systems deterministic.
- Keep save/load compatibility in mind.
- Keep MMO compatibility in mind.
- Use English comments.
- Keep TypeScript strict.

Before coding, produce a short implementation plan.

After coding, produce:

- Summary of changes
- Files changed
- Tests added/updated
- Validation results
- Documentation updates
- Known limitations
```
