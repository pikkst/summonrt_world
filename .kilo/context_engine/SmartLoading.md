# Smart Loading

## Purpose

Load context lazily and intentionally.

## Process

```text
Need context?
  -> Yes: load the smallest useful file or section
  -> No: skip
```

## Good Loading

Good loading is:

- task-specific
- system-specific
- file-specific
- budget-aware
- easy to explain

## Bad Loading

Bad loading is:

- loading the whole `.kilo` folder
- loading the whole source tree
- loading every design doc
- loading unrelated systems
- loading old memory before current task context

## Rule

Every loaded file should answer a specific question.

Before loading, state:

```text
I need this file because...
```

## Stop Condition

Stop loading when enough context exists to create a safe plan.
