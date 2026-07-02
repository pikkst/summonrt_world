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
          -> Create Todo List
            -> Implement
              -> Validate
                -> Final Review
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

## Step 6 - Create Todo List

Every task todo list must include a final review item before PR creation.

Required todo item text:

```text
Run Final Review before PR creation
```

This item must be completed after validation and before opening or updating a Pull Request.

## Step 7 - Implement

Stay inside task scope.

## Step 8 - Validate

Run or honestly report:

- typecheck
- lint
- test
- build

## Step 9 - Final Review

Use the relevant checklist and review pipeline.

The final review must cover:

- architecture
- user flow when relevant
- API quality when relevant
- save/load impact when relevant
- validation
- documentation
- merge readiness

## Step 10 - PR

Every task must use its own branch and Pull Request.

Do not open or update a PR until the final review todo item is complete.
