# Context Budget

## Purpose

Control token usage by matching context size to task complexity.

## Recommended Budgets

```text
Tiny docs change:      2k - 4k tokens
Small bugfix:         4k - 8k tokens
Normal feature:       8k - 20k tokens
Refactor:             20k - 40k tokens
Architecture work:    40k - 60k tokens
Large system design:  60k+ only when necessary
```

## Budget Rule

Start small.

Increase only when the task cannot be completed safely with current context.

## When Budget Is Exceeded

If the selected context is too large:

1. Stop loading files.
2. Summarize known context.
3. Remove unrelated documents.
4. Load only the next most relevant file or section.
5. Continue with a narrower plan.

## Rule

A bigger context is not automatically better.

Use the smallest context that allows a correct implementation.
