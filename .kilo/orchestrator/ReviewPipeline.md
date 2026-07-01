# Review Pipeline

## Purpose

Review work before opening or updating a Pull Request.

## Review Order

```text
Scope Review
  -> Architecture Review
    -> Gameplay Review
      -> Test Review
        -> Documentation Review
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

## Gameplay Review

Check:

- meaningful decisions over repetitive clicking
- Action/Event/Report fit
- world memory impact when important

## Test Review

Check:

- unit tests where useful
- regression tests for fixes
- deterministic tests for generation/simulation
- save/load tests for persistence changes

## Documentation Review

Check:

- task docs
- GDD if gameplay changed
- TechnicalSpec if architecture changed
- `.kilo` docs if AI workflow changed

## Rule

If a review step fails, update the work or document the limitation honestly before PR.
