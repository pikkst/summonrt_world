# Workflow Rules

## Required Workflow Before Coding

Before writing code, Kilo Code must:

1. Read `.kilo/brain/README.md`.
2. Read all required `.kilo/brain` rule files.
3. Read `SummonerWorld_Tasks.md`.
4. Read `SummonerWorld_GDD.md`.
5. Read `SummonerWorld_TechnicalSpec.md`.
6. Search the source tree for existing implementations related to the task.
7. Identify the exact current task ID.
8. Create a task-specific branch before implementation.

## Single-Task Rule

Implement exactly one requested task at a time.

Do not complete multiple tasks in one pass unless the user explicitly asks for it.
Do not silently start the next task.
Do not refactor unrelated systems.

## Discovery Rule

For every feature request, search first for:

- Existing types
- Existing utilities
- Existing modules
- Existing tests
- Existing documentation notes
- Existing TODOs or task references

Only create a new system when no existing system should be extended.

## Documentation Sync

When a task changes gameplay rules, persistent state, architecture, or task status, update relevant documentation in the same PR.

Documentation updates should be small and directly related to the task.

## Done Means Done

A task is not complete until:

- The implementation is finished.
- Relevant tests are added or updated.
- TypeScript typecheck passes.
- Tests pass.
- Build passes.
- Documentation is updated when needed.
- A Pull Request is opened.
