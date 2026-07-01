# Execution Plan

## Purpose

Create a safe implementation plan before editing files.

## Required Plan Sections

```text
Task summary:
Primary agent:
Supporting agents:
Context level:
Files to inspect:
Files likely to change:
Patterns to use:
Tests required:
Docs required:
Branch name:
Risk level:
```

## Planning Rules

- Plan only the requested task.
- Search for existing implementation before creating new files.
- Prefer existing patterns over new architecture.
- Identify save/load impact before editing persistent state.
- Identify whether Reports, Events, or World Memory are needed.
- Identify whether UI should collect a decision or only display a result.

## Implementation Order

```text
Inspect existing code
  -> Make smallest safe change
    -> Add or update tests
      -> Update docs if needed
        -> Run validation
          -> Produce visible Guardian Pass
            -> Prepare PR notes
              -> Create PR
```

## Visible Guardian Pass Requirement

Before running `gh pr create` or opening a Pull Request, print or write a Guardian Pass summary.

Use this format:

```text
Guardian Pass:
- Architecture: PASS | WARNING | BLOCKED
- Gameplay/UI reachability: PASS | WARNING | BLOCKED | N/A
- API quality: PASS | WARNING | BLOCKED | N/A
- Save/load impact: PASS | WARNING | BLOCKED | N/A
- Quality and validation: PASS | WARNING | BLOCKED
- Merge readiness: READY | NOT READY
```

If any item is `BLOCKED` or merge readiness is `NOT READY`, do not create the PR yet.

Fix the issue or document an approved follow-up first.

## Stop Conditions

Stop and re-plan when:

- ownership is unclear
- a new system is needed
- scope expands
- validation fails unexpectedly
- task touches more systems than expected
- Guardian Pass has a blocked item
