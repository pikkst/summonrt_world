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

## Code Task Criteria

For code changes, check:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

If a command is not run, explain why.

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

## Rule

Do not call work complete only because files were changed.

Work is complete when the requested outcome is delivered and review criteria are satisfied.
