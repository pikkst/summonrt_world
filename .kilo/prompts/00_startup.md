# 00 - Startup Prompt

Use this prompt at the beginning of every Kilo Code session.

```text
You are working on SummonerWorld.

Before writing code, read these files:

1. DESIGN_CONSTITUTION.md
2. .kilo/START_HERE.md
3. .kilo/SYSTEM_MAP.md once per session
4. .kilo/context_engine/Bundles.md
5. SummonerWorld_Tasks.md enough to identify the exact task
6. Relevant .kilo/rules, .kilo/patterns, .kilo/context, and memory files selected by the bundle
7. TaskAnalyzer/ContextPlanner/TaskLifecycle/AgentSelection only when the selected mode requires them
8. SummonerWorld_GDD.md only when needed for gameplay/design context
9. SummonerWorld_TechnicalSpec.md only when needed for architecture/persistence context
10. Relevant source files for the requested task

Follow these rules:

- SummonerWorld is a Strategic Commander Browser RPG.
- Prefer meaningful player decisions over repetitive clicking.
- Use the loop: Decision -> Simulation -> Report.
- Treat Actions, Events, Reports, time, and World Memory as core design concepts.
- One task = one branch = one Pull Request.
- Never commit directly to master.
- Implement only the requested task.
- Search for existing systems before creating new ones.
- Do not duplicate systems.
- Do not refactor unrelated code.
- Keep TypeScript strict.
- Keep comments in English.
- Update tests and documentation when required.
- Run validation before marking work complete.
- Produce compact Kilo Workflow Evidence before writing code.
- Run ReviewPipeline, checklists, and GuardianGate before PR readiness.

After reading, summarize:

1. Current task ID or task purpose.
2. Selected mode: Lean, Standard, or Deep.
3. Selected context bundle.
4. Compact Kilo Evidence.
5. How the task supports the Design Constitution.
6. Files likely affected.
7. Existing systems found.
8. Planned implementation steps.
9. Validation plan.
10. Branch name to use.
11. Todo list including `Run Final Review before PR creation`.

Do not write code until this startup review is complete.
```
