# 06 - Update Docs Prompt

Use this prompt for documentation-only work or documentation updates after implementation.

```text
You are updating SummonerWorld documentation.

Documentation target:
[INSERT DOCS / TASK / SYSTEM]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files, especially 03_DOCUMENTATION_RULES.md.
2. Identify the source of truth for this topic.
3. Compare current docs with current implementation or requested change.
4. Update only relevant documentation.
5. Avoid rewriting unrelated sections.
6. Keep wording clear, specific, and implementation-aware.
7. Open a Pull Request if this is standalone documentation work.

Documentation impact rules:

- Gameplay change -> update GDD or system bible.
- Architecture change -> update TechnicalSpec or architecture docs.
- Task completion -> update SummonerWorld_Tasks.md.
- Progress change -> update progress docs.
- AI workflow change -> update .kilo files.

Before editing, produce:

- Documents inspected
- Mismatches found
- Update plan

After editing, produce:

- Documents updated
- What changed
- What intentionally did not change
- Follow-up documentation gaps

Do not mark a task complete unless implementation and validation are actually complete.
```
