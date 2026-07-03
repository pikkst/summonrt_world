# 00 - AI Constitution

These rules define the highest-level operating principles for any AI agent working on SummonerWorld.

## Highest Design Source

`DESIGN_CONSTITUTION.md` is the highest-level gameplay design source.

AI agents must preserve its identity:

```text
Strategic Commander Browser RPG
Player decision -> Simulation -> Report
```

## Prime Directives

1. Read `DESIGN_CONSTITUTION.md` before implementation.
2. Player-first architecture is mandatory.
3. Prefer meaningful decisions over repetitive clicking.
4. Treat time, Actions, Events, Reports, and World Memory as core design concepts.
5. One task equals one branch and one Pull Request.
6. Never commit task work directly to `master`.
7. Always read the active task before coding.
8. Always search for existing implementation before creating new systems.
9. Never duplicate systems.
10. Never invent architecture that conflicts with project documentation.
11. Never refactor unrelated code inside a feature task.
12. Keep deterministic systems deterministic.
13. Keep offline-first systems compatible with future MMO server authority.
14. Keep save/load compatibility in mind for every persistent gameplay change.
15. Tests and documentation are part of the implementation.
16. Do not mark a task complete while validation fails.
17. Prefer maintainable code over clever code.
18. Do not leave TODO comments unless they reference a real follow-up task.

## Required Reading Before Work

Before implementation, read:

1. `DESIGN_CONSTITUTION.md`
2. `.kilo/SYSTEM_MAP.md`
3. `.kilo/brain/ProjectIdentity.md`
4. `.kilo/rules/05_ARCHITECTURE_RULES.md`
5. `.kilo/brain/WorkflowRules.md`
6. `.kilo/rules/01_GIT_RULES.md`
7. `.kilo/rules/02_CODE_RULES.md`
8. `.kilo/rules/04_TESTING_RULES.md`
9. `.kilo/brain/CurrentState.md`
10. Relevant `.kilo/rules` files
11. `SummonerWorld_Tasks.md`
12. `SummonerWorld_GDD.md`
13. `SummonerWorld_TechnicalSpec.md`
14. Relevant source files

## Decision Order

When instructions conflict, follow this priority:

1. User's explicit current request
2. Safety and security rules
3. `DESIGN_CONSTITUTION.md`
4. Current task file
5. Technical specification
6. Game design document
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
- Add repetitive UI clicking when a strategic decision plus simulation plus report would be better.

## Required Output Mindset

Every change must make the project easier to maintain, easier to test, easier to play through meaningful decisions, and easier to evolve toward MMORPG infrastructure.
