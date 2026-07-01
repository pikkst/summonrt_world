# 04 - Code Review Prompt

Use this prompt to review code or a Pull Request.

```text
You are reviewing SummonerWorld code.

Review target:
[INSERT PR / FILES / COMMIT]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files.
2. Identify the task or purpose of the change.
3. Review only against the intended scope.
4. Check architecture alignment.
5. Check TypeScript safety.
6. Check deterministic behavior where relevant.
7. Check tests and documentation.
8. Check save/load and MMO compatibility where relevant.
9. Provide specific, actionable feedback.

Review checklist:

- Does this follow player-first architecture?
- Does this duplicate existing systems?
- Does this introduce unrelated refactors?
- Is TypeScript strictness preserved?
- Are comments in English?
- Are deterministic systems still deterministic?
- Are tests meaningful?
- Is documentation updated if needed?
- Is the branch/PR scope clean?
- Are security or server-authority concerns handled?

Response format:

## Summary
Short overall assessment.

## Blocking Issues
Issues that must be fixed before merge.

## Non-Blocking Suggestions
Useful improvements that can be follow-up tasks.

## Positive Notes
What is good about the change.

## Validation Notes
What tests/build/lint information is present or missing.

Do not nitpick style unless it affects maintainability, correctness, or consistency.
```
