# Kilo Prompts

This folder contains reusable workflow prompts for Kilo Code and other AI coding agents working on SummonerWorld.

These prompts are not project rules by themselves. They are practical task workflows that tell the agent how to start, implement, review, validate, document, and open Pull Requests.

## Required Use

Before starting work, read:

1. `.kilo/brain/README.md`
2. Relevant `.kilo/rules` files
3. The prompt that matches the requested work
4. `SummonerWorld_Tasks.md`
5. Relevant source files

## Prompt Index

- `00_startup.md` - Start any task safely.
- `01_implement_task.md` - Implement one planned task.
- `02_fix_bug.md` - Fix a bug with regression protection.
- `03_refactor.md` - Refactor without changing behavior.
- `04_code_review.md` - Review code or PR changes.
- `05_write_tests.md` - Add or improve tests.
- `06_update_docs.md` - Update documentation only.
- `07_create_pr.md` - Prepare and open a Pull Request.
- `08_release_checklist.md` - Validate a release or milestone.
- `09_self_review.md` - Review own work before asking for review.

## Prime Reminder

One task = one branch = one Pull Request.

Do not combine unrelated work.
