# Cache Policy

## Purpose

Reduce repeated reading during one focused task.

## Cacheable Summaries

The agent may keep short summaries of:

- Design Constitution
- relevant agent role
- relevant rule file
- relevant pattern file
- relevant context flow
- source file purpose
- test file purpose

## Cache Shape

```text
File:
Summary:
Important constraints:
Reload when:
```

## Rules

- Keep summaries short.
- Include source file names.
- Reload exact files when exact code matters.
- Refresh summaries after file edits.
- Do not reuse summaries across unrelated tasks.

## Reload When

- source changed
- tests changed
- exact code is needed
- task scope changed
- conflicting information appears
