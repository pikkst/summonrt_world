# Orchestrator Integration

## Purpose

Explain how `.kilo/orchestrator` should use the AI Decision Council.

## Integration Flow

```text
Task Analysis
  -> Agent Selection
    -> Context Selection
      -> Council Routing
        -> Council Output
          -> Execution Plan
```

## When To Use Council

Use council for:

- architecture changes
- new gameplay systems
- cross-system features
- save/load changes
- major UX decisions
- performance-sensitive simulations
- future online-sensitive systems

## When Not To Use Council

Do not use council for:

- typo fixes
- small docs edits
- simple formatting
- one-file low-risk fixes

## Required Orchestrator Behavior

The orchestrator should:

1. Read `Council.index.md`.
2. Select only relevant council roles.
3. Request concise output using `CouncilOutput.md`.
4. Summarize consensus using `CouncilConsensus.md`.
5. Update the implementation plan with blockers or recommendations.

## Token Rule

Council should reduce risk, not waste tokens.

Use the smallest useful council set.
