# Context Planner

## Purpose

Choose the smallest useful set of documents and source files for the task.

## Planning Steps

1. Read the task.
2. Classify task type.
3. Identify primary system.
4. Identify secondary systems only if needed.
5. Choose context level.
6. Select initial documents.
7. Stay under the token budget.
8. Load more only if uncertainty remains.

## Initial Context Template

```text
Always:
- DESIGN_CONSTITUTION.md
- .kilo/brain/README.md
- .kilo/memory/CurrentTask.md

Task-specific:
- one relevant agent file
- one relevant rule file
- one relevant pattern file
- one relevant context flow file
- related source files
```

## Rule

Do not read unrelated agent, rule, pattern, philosophy, or source files just because they exist.
