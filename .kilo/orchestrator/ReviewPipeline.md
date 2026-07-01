# Review Pipeline

## Purpose

Review work before opening or updating a Pull Request.

## Review Order

```text
Scope Review
  -> Architecture Review
    -> Gameplay or UI Review
      -> Test Review
        -> Documentation Review
          -> Guardian Pass
            -> PR Readiness Review
```

## Scope Review

Check:

- one task only
- no unrelated refactor
- no unrelated files
- branch matches task

## Architecture Review

Check:

- `DESIGN_CONSTITUTION.md` alignment
- player-first architecture
- no duplicate system
- correct pattern usage
- clear ownership
- save/load impact
- MMO compatibility when relevant

## Gameplay or UI Review

Check:

- meaningful decisions over repetitive clicking
- Action/Event/Report fit
- world memory impact when important
- user-facing UI is reachable from the real app flow
- UI actions call the intended store or core logic
- input bounds are enforced in code

## Test Review

Check:

- unit tests where useful
- regression tests for fixes
- deterministic tests for generation/simulation
- save/load tests for persistence changes
- flow tests for user-facing features when practical

## Documentation Review

Check:

- task docs
- GDD if gameplay changed
- TechnicalSpec if architecture changed
- `.kilo` docs if AI workflow changed

## Guardian Pass

Before PR readiness, summarize:

```text
Guardian pass:
- Architecture:
- Gameplay or UI reachability:
- Save/load impact:
- Quality and validation:
- Merge readiness:
```

## Rule

If a review step fails, update the work or document the limitation honestly before PR.

Do not mark a task PR-ready without a Guardian pass summary.
