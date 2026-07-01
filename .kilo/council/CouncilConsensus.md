# Council Consensus

## Purpose

Define how the orchestrator should interpret multiple council opinions.

## Default Rule

Council does not need unanimous agreement for small or normal tasks.

The orchestrator should look for blockers and clear recommendations.

## Blocker Priority

A blocker from these roles should pause implementation:

- ChiefArchitect
- SystemIntegrator
- QAEngineer
- SecurityEngineer
- PlayerAdvocate when player value is absent

## Consensus Levels

### Green

No blockers.

Proceed with implementation plan.

### Yellow

No blockers, but important notes exist.

Proceed only after adding notes to the plan.

### Red

One or more concrete blockers exist.

Stop and revise design or task scope.

## Conflict Rule

If council roles disagree:

1. Identify the exact disagreement.
2. Prefer `DESIGN_CONSTITUTION.md` and architecture ownership.
3. Ask ChiefArchitect only if the conflict affects architecture.
4. Keep the current task focused.

## Output

The orchestrator should summarize council result as:

```text
Council status:
Blockers:
Plan changes:
Proceed or stop:
```
