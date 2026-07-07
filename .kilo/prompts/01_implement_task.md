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
5. Select agents using `.kilo/orchestrator/AgentSelection.md`; include `.kilo/agents/workflow.md` if workflow compliance is uncertain.
6. Read .kilo/brain and relevant .kilo/rules files selected by the bundle or Context Planner.
7. Read SummonerWorld_Tasks.md enough to identify the exact task.
8. Read `.kilo/context_engine/TaskAnalyzer.md` and `.kilo/context_engine/ContextPlanner.md` only when the selected mode requires them.
9. Read SummonerWorld_GDD.md only when needed for gameplay/design context.
10. Read SummonerWorld_TechnicalSpec.md only when needed for architecture/persistence context.
11. Search the codebase for existing implementation related to this task.
12. Create or use a task-specific branch:
   feature/[TASK-ID]-[short-name]
13. Implement only this task.
14. Add or update tests.
15. Update documentation and SummonerWorld_Tasks.md before the final commit if gameplay, architecture, persistence, or task status changes.
16. Run validation:
    npm run typecheck
    npm run lint
    npm run test
    npm run build
17. Run `.kilo/orchestrator/ReviewPipeline.md`.
18. Run the relevant `.kilo/checklists` file and `.kilo/rules/99_FINAL_CHECKLIST.md`.
19. Run `.kilo/guardian/GuardianGate.md`.
20. Run `.kilo/agents/workflow.md` if evidence or PR readiness is uncertain.
21. Prepare a Pull Request into master.

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
Do not open or update a PR without a Kilo Workflow section in the PR body.
```
