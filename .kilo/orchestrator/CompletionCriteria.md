# Completion Criteria

## Purpose

Define when a task may be considered complete.

## Minimum Completion Criteria

A task is complete only when:

- requested scope is implemented
- no unrelated work was added
- relevant validation was run or honestly reported
- tests were added or updated when needed
- documentation impact was handled
- PR notes are accurate
- known limitations are listed
- Guardian pass summary is completed before PR readiness

## Code Task Criteria

For code changes, check:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

If a command is not run, explain why.

## User-Facing Feature Criteria

For UI or player-facing changes, check:

- the new UI is reachable from the actual app flow
- the UI action reaches the intended store or core logic
- the user can complete the intended flow normally
- input bounds are enforced in code
- validation confirms the reachable flow

## Documentation Task Criteria

For documentation-only changes:

- affected docs are focused
- no implementation status is overstated
- validation section states docs-only
- no runtime source code changed unless intended

## Architecture Task Criteria

For architecture changes:

- `DESIGN_CONSTITUTION.md` is preserved
- ownership is clear
- save/load impact is noted
- future online compatibility is considered
- relevant ADR or memory file is updated when needed

## Required Guardian Pass Summary

Before opening or updating a PR, add a short Guardian pass summary to the PR notes or task report:

```text
Guardian pass:
- Architecture:
- Gameplay or UI reachability:
- Save/load impact:
- Quality and validation:
- Merge readiness:
```

If any line is uncertain, resolve it or document it as follow-up work before calling the task PR-ready.

## Rule

Do not call work complete only because files were changed.

Work is complete when the requested outcome is delivered and review criteria are satisfied, including Guardian pass for PR-ready work.
