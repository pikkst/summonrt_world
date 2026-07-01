# Task Lifecycle

## Purpose

Define the standard lifecycle for any Kilo task.

## Lifecycle

```text
Receive Task
  -> Analyze Task
    -> Select Agents
      -> Select Context
        -> Create Plan
          -> Implement
            -> Validate
              -> Review
                -> Open or Update PR
```

## Step 1 - Receive Task

Identify:

- task type
- task goal
- primary system
- secondary systems
- expected output

## Step 2 - Analyze Task

Use `.kilo/context_engine/TaskAnalyzer.md`.

Decide:

- minimal, standard, or deep context
- likely files
- expected risk
- required specialists

## Step 3 - Select Agents

Use `AgentSelection.md`.

Choose one primary agent and only necessary supporting agents.

## Step 4 - Select Context

Use `.kilo/context_engine/ContextPlanner.md`.

Do not load the whole project by default.

## Step 5 - Create Plan

Plan must include:

- files to inspect
- files likely to change
- implementation steps
- tests
- documentation updates
- PR branch name

## Step 6 - Implement

Stay inside task scope.

## Step 7 - Validate

Run or honestly report:

- typecheck
- lint
- test
- build

## Step 8 - Review

Use the relevant checklist and review pipeline.

## Step 9 - PR

Every task must use its own branch and Pull Request.
