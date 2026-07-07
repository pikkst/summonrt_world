# SummonerWorld AI Framework

You are a SummonerWorld engineer. This project uses the `.kilo/` framework for AI-assisted development.

## Auto-Loaded Framework

This file (`AGENTS.md`) and the `instructions` in `.kilo/kilo.json` are loaded automatically at session start.

If you need deeper context, read the matching index file first, then load only the specific rule or pattern file required.

## Central Map

Read `.kilo/START_HERE.md` first for token-efficient routing.
Read `.kilo/SYSTEM_MAP.md` once per session to understand the framework layers.

## Standard Workflow

```text
Task
  -> Context Engine (.kilo/context_engine/)
    -> Orchestrator (.kilo/orchestrator/)
      -> Council when needed (.kilo/council/)
        -> Patterns + Rules
          -> Implementation
            -> Checklists (.kilo/checklists/)
              -> Guardian (.kilo/guardian/)
                -> Pull Request
```

## Auto-Execute Task Protocol

When the user provides a task reference like:
- `next task is TASK-ID`
- `implement TASK-ID`
- `TASK-ID – description`

You MUST automatically execute the full workflow without being asked again:

1. Read `.kilo/START_HERE.md`.
2. Read `.kilo/SYSTEM_MAP.md` once for the session.
3. Read `SummonerWorld_Tasks.md` and identify the exact task ID and description.
4. Choose Lean, Standard, or Deep Mode from `.kilo/START_HERE.md`.
5. Select the first context bundle from `.kilo/context_engine/Bundles.md`.
6. Run the Context Engine only as much as the selected mode requires:
   - `.kilo/context_engine/TaskAnalyzer.md`
   - `.kilo/context_engine/ContextPlanner.md`
7. Run the Orchestrator:
   - `.kilo/orchestrator/TaskLifecycle.md`
   - `.kilo/orchestrator/AgentSelection.md`
   - `.kilo/orchestrator/ExecutionPlan.md` when the task is non-trivial
8. Add `.kilo/agents/workflow.md` as a supporting agent when workflow compliance, context routing, PR readiness, or `.kilo` changes are involved.
9. Produce compact Kilo Workflow Evidence before coding.
10. Create a new branch from `master`:
   `feature/[TASK-ID]-[short-name]`
11. Read relevant `.kilo/rules`, `.kilo/patterns`, `.kilo/context`, memory files, and existing source code selected by the bundle or Context Planner.
12. Stop loading context when `.kilo/START_HERE.md` stop conditions are met.
13. Implement ONLY this task.
14. Add or update tests.
15. Update `SummonerWorld_Tasks.md` and relevant documentation before the final commit when task status, gameplay, architecture, or persistence changes.
16. Run validation from `summoner-world`:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
17. Run `.kilo/orchestrator/ReviewPipeline.md`.
18. Run the relevant `.kilo/checklists` file and `.kilo/rules/99_FINAL_CHECKLIST.md`.
19. Run `.kilo/guardian/GuardianGate.md` and produce a Guardian output.
20. Run `.kilo/agents/workflow.md` if evidence, checklist use, Guardian status, or PR body compliance is uncertain.
21. Commit with a clear message: `Implement TASK-ID description`
22. Push the branch.
23. Open a GitHub Pull Request targeting `master`.

Do not ask the user to repeat branch or PR instructions. Do not work directly on `master`.

## Required Kilo Workflow Evidence

Before writing code, output the compact form from `.kilo/START_HERE.md`:

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

Before opening or updating a PR, output:

- ReviewPipeline summary.
- Checklist results.
- Guardian status using the `GuardianGate.md` output shape.
- Validation results.
- Documentation and task-file update status.
- Workflow Steward status when applicable.

If this evidence is missing, the task is not ready for PR.
If the PR body lacks `## Kilo Workflow`, the task is not ready for PR.

## Prime Directives

- One task equals one branch and one Pull Request.
- Never commit task work directly to `master`.
- Use the Context Engine first, then Orchestrator.
- Select only relevant context.
- Prove framework usage with compact Kilo Workflow Evidence.
- Use `.kilo/START_HERE.md` and `.kilo/context_engine/Bundles.md` to reduce token load.
- Use `.kilo/agents/workflow.md` to audit framework compliance when uncertain.
- Run ReviewPipeline, checklists, and GuardianGate before PR readiness.
- Do not duplicate systems.
- Mark done only when typecheck, tests, build, and documentation are complete.

## Active Task

Read `SummonerWorld_Tasks.md` for the current implementation checklist.

## Detailed Rules

Detailed constraints live in `.kilo/rules/`. Load specific files only when the task requires them. Never load the full `.kilo` folder by default.
