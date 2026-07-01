# 03 - Documentation Rules

## Documentation Is Part of Implementation

Documentation must stay aligned with code.

A task is not complete if the implementation changes gameplay, architecture, persistence, or task status and the documentation remains outdated.

## Required Documentation Sources

Before implementation, read the relevant source documents:

- `SummonerWorld_Tasks.md`
- `SummonerWorld_GDD.md`
- `SummonerWorld_TechnicalSpec.md`
- `01_Project_Vision.md` when architecture or identity is involved
- Relevant system bible documents when present

## What to Update

Update documentation based on the type of change:

### Gameplay Rule Change

Update:

- GDD or relevant system bible
- Task notes if the change completes or modifies a task

### Architecture Change

Update:

- Technical specification
- Architecture notes
- Relevant `.kilo` rules if AI workflow is affected

### Task Completion

Update:

- `SummonerWorld_Tasks.md`
- Progress document if present and current

### New Persistent State

Update:

- Technical specification
- Save/load documentation
- Relevant type/model documentation

### New Test Coverage

Update:

- Task notes
- PR validation notes

## Documentation Style

Documentation should be:

- Clear
- Direct
- Specific
- Implementation-aware
- Free of vague promises

Avoid:

- Huge unrelated rewrites
- Outdated progress statements
- Marking planned features as implemented
- Changing completed task history without evidence

## Task Checkbox Rule

Only mark a task as complete when:

- Code is implemented.
- Tests are added or updated.
- Validation has passed or failure is explicitly documented.
- The implementation matches the task description.

## PR Documentation Section

Every PR with documentation impact should include:

```text
## Documentation
- Updated task file: yes/no
- Updated GDD: yes/no
- Updated TechnicalSpec: yes/no
- Updated system bible: yes/no
- Reason if no documentation update was needed
```

## Source of Truth Rule

If documents disagree, prefer the active task list for implementation sequencing, then reconcile the documents in the smallest reasonable update.
