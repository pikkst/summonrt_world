# Decision Freeze

## Purpose

Reduce repeated analysis loops after the task has already been classified.

## Rule

After `TaskAnalyzer.md` selects task type, primary systems, risk level, and context level, do not re-analyze the same decision unless new evidence appears.

## Freeze Point

A decision is frozen when the agent has recorded:

```text
Task Type:
Primary System:
Secondary Systems:
Risk Level:
Context Level:
Initial Files:
```

## Allowed Reasons To Reopen

Reopen the decision only when:

- a required file contradicts the initial assumption
- the implementation touches more systems than expected
- validation reveals an unexpected dependency
- the task source contains conflicting instructions
- a Guardian or Council role identifies a blocker

## Not Valid Reasons To Reopen

Do not reopen only because:

- the agent is uncertain without new evidence
- another related document exists
- a broader refactor seems interesting
- the same task wording is being reconsidered

## Required Behavior

Once frozen:

1. Move to the Orchestrator execution plan.
2. Inspect only selected files.
3. Implement the smallest safe change.
4. Escalate only if a listed reopen reason appears.

## Example

```text
Task Type: architecture / feature
Primary System: Player Core
Risk Level: High
Context Level: Deep

Decision frozen.
Proceed to ExecutionPlan.md.
```
