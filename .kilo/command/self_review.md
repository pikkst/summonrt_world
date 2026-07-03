---
description: Review own work before asking for review
agent: code
---
# Self Review

Use this command to review your own work before requesting external review.

Read `.kilo/prompts/09_self_review.md` for the full workflow.

Checklist:
- [ ] Task scope matches exactly one task from `SummonerWorld_Tasks.md`
- [ ] No unrelated refactors or extra systems
- [ ] TypeScript typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] All user-facing strings are English
- [ ] No `any` types introduced without justification
- [ ] No hard-coded gameplay constants
- [ ] No `Math.random()` in deterministic systems
- [ ] Documentation updated if gameplay, architecture, or persistence changed
- [ ] PR description follows template

If anything fails, fix it before proceeding.
