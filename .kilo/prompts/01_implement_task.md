# 01 - Implement Task Prompt

Use this prompt when implementing a planned task from `SummonerWorld_Tasks.md`.

```text
You are implementing one SummonerWorld task.

Task ID:
[INSERT TASK ID]

Task description:
[INSERT TASK DESCRIPTION]

Required workflow:

1. Read `.kilo/START_HERE.md`.
2. Read `.kilo/SYSTEM_MAP.md` once per session.
3. Read `.kilo/context_engine/Bundles.md` and choose one primary bundle.
4. Choose Lean, Standard, or Deep Mode.
5. Read .kilo/brain and relevant .kilo/rules files selected by the bundle or Context Planner.
6. Read SummonerWorld_Tasks.md enough to identify the exact task.
7. Read `.kilo/context_engine/TaskAnalyzer.md` and `.kilo/context_engine/ContextPlanner.md` only when the selected mode requires them.
8. Read SummonerWorld_GDD.md only when needed for gameplay/design context.
9. Read SummonerWorld_TechnicalSpec.md only when needed for architecture/persistence context.
10. Search the codebase for existing implementation related to this task.
11. Create or use a task-specific branch:
   feature/[TASK-ID]-[short-name]
12. Implement only this task.
13. Add or update tests.
14. Update documentation and SummonerWorld_Tasks.md before the final commit if gameplay, architecture, persistence, or task status changes.
15. Run validation:
    npm run typecheck
    npm run lint
    npm run test
    npm run build
16. Run `.kilo/orchestrator/ReviewPipeline.md`.
17. Run the relevant `.kilo/checklists` file and `.kilo/rules/99_FINAL_CHECKLIST.md`.
18. Run `.kilo/guardian/GuardianGate.md`.
19. Prepare a Pull Request into master.

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

The plan must include Kilo Workflow Evidence:

```text
Kilo Evidence:
Task:
Mode:
Type/Risk:
Agents:
Context:
Branch:
Validation:
Final review todo: yes
```

Keep evidence short. Do not paste long summaries from loaded docs.

After coding, produce:

- Summary of changes
- Files changed
- Tests added/updated
- Validation results
- Documentation updates
- ReviewPipeline summary
- Checklist results
- Guardian status
- Known limitations

Do not claim PR readiness if ReviewPipeline, checklists, or GuardianGate were skipped.
```
