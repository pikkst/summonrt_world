# Kilo Brain Framework

This folder contains persistent project context for Kilo Code and other AI coding agents working on SummonerWorld.

The goal is to reduce repeated discovery work, prevent architectural drift, and keep every implementation aligned with the game vision, design constitution, roadmap, coding standards, active task list, and Pull Request workflow.

## Highest Design Source

Before doing anything, read:

```text
DESIGN_CONSTITUTION.md
```

This document defines the highest-level gameplay identity of SummonerWorld.

## Reading Order

Before writing or modifying code, the agent must read these files in order:

1. `DESIGN_CONSTITUTION.md`
2. `.kilo/brain/ProjectIdentity.md`
3. `.kilo/brain/ArchitectureRules.md`
4. `.kilo/brain/WorkflowRules.md`
5. `.kilo/brain/GitRules.md`
6. `.kilo/brain/CodingRules.md`
7. `.kilo/brain/TestingRules.md`
8. `.kilo/brain/CurrentState.md`
9. `SummonerWorld_Tasks.md`
10. `SummonerWorld_GDD.md`
11. `SummonerWorld_TechnicalSpec.md`
12. Relevant source files for the current task

## Prime Directive

Implement only the current requested task.

Every new task must use its own branch and Pull Request.

Do not commit task work directly to `master`.
Do not refactor unrelated systems.
Do not duplicate existing systems.
Do not invent architecture that conflicts with the project documents or `DESIGN_CONSTITUTION.md`.
Do not mark work complete unless typecheck, tests, build, and documentation expectations are satisfied.
