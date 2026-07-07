---
description: Implement one planned task from SummonerWorld_Tasks.md
agent: code
---
# Implement Task

Use this command to implement one planned SummonerWorld task.

Read `.kilo/prompts/01_implement_task.md` for the full workflow.

Required steps:
1. Read `.kilo/START_HERE.md`.
2. Read `SummonerWorld_Tasks.md` for the current task.
3. Use `.kilo/context_engine/Bundles.md` to choose a context bundle.
4. Choose Lean, Standard, or Deep Mode.
5. Use `.kilo/context_engine/TaskAnalyzer.md` and `.kilo/context_engine/ContextPlanner.md` only when the selected mode requires them.
6. Use `.kilo/orchestrator/TaskLifecycle.md` and `.kilo/orchestrator/AgentSelection.md` for Standard or Deep Mode.
7. Add `.kilo/agents/workflow.md` as support when workflow compliance, PR readiness, or `.kilo` changes are involved.
8. Produce compact Kilo Workflow Evidence before coding.
9. Read relevant `.kilo/rules`, `.kilo/patterns`, `.kilo/context`, and memory files selected by the bundle or Context Planner.
10. Search for existing implementation.
11. Create branch `feature/[TASK-ID]-short-name`.
12. Implement the task.
13. Add or update tests.
14. Update `SummonerWorld_Tasks.md` and relevant docs before the final commit when task status, gameplay, architecture, or persistence changes.
15. Run validation.
16. Run `.kilo/orchestrator/ReviewPipeline.md`.
17. Run relevant `.kilo/checklists` and `.kilo/rules/99_FINAL_CHECKLIST.md`.
18. Run `.kilo/guardian/GuardianGate.md`.
19. Run `.kilo/agents/workflow.md` if evidence, checklist use, Guardian status, or PR body compliance is uncertain.
20. Commit and push.

Do not commit, push, open, or update a PR until the final review todo item is complete.
Do not open or update a PR without a `## Kilo Workflow` section in the PR body.
