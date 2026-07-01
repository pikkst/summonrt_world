# 00 - Startup Prompt

Use this prompt at the beginning of every Kilo Code session.

```text
You are working on SummonerWorld.

Before writing code, read these files:

1. .kilo/brain/README.md
2. .kilo/brain/ProjectIdentity.md
3. .kilo/brain/ArchitectureRules.md
4. .kilo/brain/WorkflowRules.md
5. .kilo/brain/GitRules.md
6. .kilo/brain/CodingRules.md
7. .kilo/brain/TestingRules.md
8. .kilo/brain/CurrentState.md
9. Relevant .kilo/rules files
10. SummonerWorld_Tasks.md
11. SummonerWorld_GDD.md
12. SummonerWorld_TechnicalSpec.md
13. Relevant source files for the requested task

Follow these rules:

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
2. Files likely affected.
3. Existing systems found.
4. Planned implementation steps.
5. Branch name to use.

Do not write code until this startup review is complete.
```
