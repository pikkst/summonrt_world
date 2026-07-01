# Task Analyzer

## Purpose

Analyze the user request before loading many files.

The agent should identify task type, affected systems, risk level, and required context depth.

## Output Shape

Before loading source files, produce:

```text
Task Type:
Systems:
Complexity:
Risk:
Recommended Context Level:
Likely Files:
Initial Documents:
```

## Task Types

- documentation
- bugfix
- feature
- refactor
- test
- review
- architecture
- release

## Context Levels

### Minimal

Use for:

- typo fixes
- small docs updates
- one-file changes
- simple tests

### Standard

Use for:

- normal feature tasks
- normal bug fixes
- system-specific tests

### Deep

Use for:

- architecture changes
- cross-system features
- refactors
- persistence changes
- MMO-sensitive changes

## Rule

Do not load the full project before task analysis.
