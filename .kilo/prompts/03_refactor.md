# 03 - Refactor Prompt

Use this prompt for dedicated refactor work.

```text
You are refactoring SummonerWorld.

Refactor target:
[INSERT FILES / SYSTEM]

Refactor reason:
[INSERT REASON]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files, especially 06_REFACTOR_RULES.md.
2. Confirm this is a dedicated refactor task.
3. Create or use a refactor branch:
   refactor/[TASK-ID-OR-SYSTEM]-[short-name]
4. Identify current behavior and public API.
5. Add or confirm tests around current behavior before changing structure.
6. Refactor in small steps.
7. Keep intended behavior unchanged.
8. Run validation:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
9. Open a Pull Request.

Refactor rules:

- Do not change gameplay behavior unless explicitly requested.
- Do not rename public APIs without updating all call sites and docs.
- Do not combine refactor with unrelated feature work.
- Preserve deterministic output.
- Preserve save/load compatibility.
- Keep commits understandable.

Before coding, produce:

- Current responsibilities
- Proposed new structure
- Public APIs to preserve
- Tests protecting behavior
- Risk list

After coding, produce:

- What moved
- What stayed behaviorally identical
- Tests run
- Validation results
- Follow-up opportunities
```
