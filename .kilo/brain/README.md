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
2. `.kilo/SYSTEM_MAP.md`
3. `.kilo/brain/ProjectIdentity.md`
4. `.kilo/rules/05_ARCHITECTURE_RULES.md`
5. `.kilo/brain/WorkflowRules.md`
6. `.kilo/rules/01_GIT_RULES.md`
7. `.kilo/rules/02_CODE_RULES.md`
8. `.kilo/rules/04_TESTING_RULES.md`
9. `.kilo/brain/CurrentState.md`
10. `SummonerWorld_Tasks.md`
11. `SummonerWorld_GDD.md`
12. `SummonerWorld_TechnicalSpec.md`
13. Relevant source files for the current task

## Prime Directive

Implement only the current requested task.

Every new task must use its own branch and Pull Request.

Do not commit task work directly to `master`.
Do not refactor unrelated systems.
Do not duplicate existing systems.
Do not invent architecture that conflicts with the project documents or `DESIGN_CONSTITUTION.md`.
Do not mark work complete unless typecheck, tests, build, and documentation expectations are satisfied.
