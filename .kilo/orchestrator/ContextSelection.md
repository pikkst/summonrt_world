# Context Selection

## Purpose

Select enough context to work safely while controlling token usage.

## Required Start

Always consider:

- `DESIGN_CONSTITUTION.md`
- `.kilo/context_engine/TaskAnalyzer.md`
- `.kilo/context_engine/ContextPlanner.md`
- current task or user request

## Context Levels

### Minimal

Use for:

- small docs edits
- one-file fixes
- simple review comments

### Standard

Use for:

- normal features
- normal bug fixes
- focused tests

### Deep

Use for:

- architecture changes
- refactors
- cross-system work
- save/load changes
- MMO-sensitive work

## Selection Steps

1. Pick task type.
2. Pick primary system.
3. Pick one primary agent file.
4. Pick one or two relevant rule files.
5. Pick relevant patterns.
6. Pick source files directly involved.
7. Add docs only if design or task status changes.

## Rule

Never load the full `.kilo` folder or full source tree at the start of a task.
