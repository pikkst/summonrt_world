# Kilo Brain Framework

This folder contains persistent project context for Kilo Code and other AI coding agents working on SummonerWorld.

The goal is to reduce repeated discovery work, prevent architectural drift, and keep every implementation aligned with the game vision, roadmap, coding standards, active task list, and Pull Request workflow.

## Reading Order

Before writing or modifying code, the agent must read these files in order:

1. `.kilo/brain/ProjectIdentity.md`
2. `.kilo/brain/ArchitectureRules.md`
3. `.kilo/brain/WorkflowRules.md`
4. `.kilo/brain/GitRules.md`
5. `.kilo/brain/CodingRules.md`
6. `.kilo/brain/TestingRules.md`
7. `.kilo/brain/CurrentState.md`
8. `SummonerWorld_Tasks.md`
9. `SummonerWorld_GDD.md`
10. `SummonerWorld_TechnicalSpec.md`
11. Relevant source files for the current task

## Prime Directive

Implement only the current requested task.

Every new task must use its own branch and Pull Request.

Do not commit task work directly to `master`.
Do not refactor unrelated systems.
Do not duplicate existing systems.
Do not invent architecture that conflicts with the project documents.
Do not mark work complete unless typecheck, tests, build, and documentation expectations are satisfied.
