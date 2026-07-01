# Refactor Checklist

Use this checklist before completing a refactor.

## Refactor Scope

- [ ] Refactor has a clear purpose.
- [ ] Refactor branch was created from `master`.
- [ ] Refactor is not mixed with unrelated feature work.
- [ ] Public behavior is intended to remain unchanged.
- [ ] Public APIs to preserve were identified.

## Safety Before Change

- [ ] Existing behavior was understood.
- [ ] Tests exist or were added before structural changes.
- [ ] Save/load compatibility was considered.
- [ ] Deterministic output was protected where required.
- [ ] A rollback path is clear.

## Implementation

- [ ] Changes were made in small, understandable steps.
- [ ] No gameplay formulas changed unintentionally.
- [ ] No persistent data structure changed unintentionally.
- [ ] No circular dependencies introduced.
- [ ] File/module boundaries are clearer after the refactor.

## Documentation

- [ ] Technical docs updated if architecture changed.
- [ ] Task docs updated if this completes a refactor task.
- [ ] PR explains why the refactor was needed.
- [ ] PR explains what behavior is intentionally unchanged.

## Validation

From `summoner-world`:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

## PR

- [ ] PR title includes `Refactor` or equivalent.
- [ ] PR summary lists moved/split files.
- [ ] PR states behavior compatibility.
- [ ] Follow-up work is documented if needed.
