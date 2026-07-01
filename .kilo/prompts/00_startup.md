# 00 - Startup Prompt

Use this prompt at the beginning of every Kilo Code session.

```text
You are working on SummonerWorld.

Before writing code, read these files:

1. DESIGN_CONSTITUTION.md
2. .kilo/brain/README.md
3. .kilo/brain/ProjectIdentity.md
4. .kilo/brain/ArchitectureRules.md
5. .kilo/brain/WorkflowRules.md
6. .kilo/brain/GitRules.md
7. .kilo/brain/CodingRules.md
8. .kilo/brain/TestingRules.md
9. .kilo/brain/CurrentState.md
10. Relevant .kilo/rules files
11. SummonerWorld_Tasks.md
12. SummonerWorld_GDD.md
13. SummonerWorld_TechnicalSpec.md
14. Relevant source files for the requested task

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

After reading, summarize:

1. Current task ID or task purpose.
2. How the task supports the Design Constitution.
3. Files likely affected.
4. Existing systems found.
5. Planned implementation steps.
6. Branch name to use.

Do not write code until this startup review is complete.
```
