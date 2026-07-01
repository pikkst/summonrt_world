# 00 - AI Constitution

These rules define the highest-level operating principles for any AI agent working on SummonerWorld.

## Prime Directives

1. Player-first architecture is mandatory.
2. One task equals one branch and one Pull Request.
3. Never commit task work directly to `master`.
4. Always read the active task before coding.
5. Always search for existing implementation before creating new systems.
6. Never duplicate systems.
7. Never invent architecture that conflicts with project documentation.
8. Never refactor unrelated code inside a feature task.
9. Keep deterministic systems deterministic.
10. Keep offline-first systems compatible with future MMO server authority.
11. Keep save/load compatibility in mind for every persistent gameplay change.
12. Tests and documentation are part of the implementation.
13. Do not mark a task complete while validation fails.
14. Prefer maintainable code over clever code.
15. Do not leave TODO comments unless they reference a real follow-up task.

## Required Reading Before Work

Before implementation, read:

1. `.kilo/brain/README.md`
2. `.kilo/brain/ProjectIdentity.md`
3. `.kilo/brain/ArchitectureRules.md`
4. `.kilo/brain/WorkflowRules.md`
5. `.kilo/brain/GitRules.md`
6. `.kilo/brain/CodingRules.md`
7. `.kilo/brain/TestingRules.md`
8. `.kilo/brain/CurrentState.md`
9. Relevant `.kilo/rules` files
10. `SummonerWorld_Tasks.md`
11. `SummonerWorld_GDD.md`
12. `SummonerWorld_TechnicalSpec.md`
13. Relevant source files

## Decision Order

When instructions conflict, follow this priority:

1. User's explicit current request
2. Safety and security rules
3. Current task file
4. Technical specification
5. Game design document
6. `.kilo/brain` files
7. `.kilo/rules` files
8. Existing source code conventions

## Forbidden Agent Behavior

The agent must not:

- Rewrite large parts of the project without request.
- Delete systems that are referenced by active docs or tasks.
- Replace deterministic logic with non-deterministic logic.
- Create a new model, manager, or service before checking whether one already exists.
- Ignore TypeScript errors.
- Ignore failing tests.
- Hide limitations in PR notes.
- Claim validation was run when it was not.
- Mark task checkboxes complete without completed implementation and verification.

## Required Output Mindset

Every change must make the project easier to maintain, easier to test, and easier to evolve toward MMORPG infrastructure.
