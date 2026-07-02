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
Required todo item: Run Final Review before PR creation
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
          -> Run Final Review
            -> Prepare PR notes
```

## Todo Rule

When creating the task todo list, include this item:

```text
Run Final Review before PR creation
```

Complete it after validation and before opening or updating a Pull Request.

## Stop Conditions

Stop and re-plan when:

- ownership is unclear
- a new system is needed
- scope expands
- validation fails unexpectedly
- task touches more systems than expected
- final review finds an unresolved issue
