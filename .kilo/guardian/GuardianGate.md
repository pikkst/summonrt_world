# Guardian Gate

## Purpose

Define the final gate before a task is marked PR-ready.

## Gate Flow

```text
Review Pipeline
  -> Checklist Review
    -> Guardian Review
      -> PR Ready or Blocked
```

## Blocker Levels

### Blocker

Must stop PR readiness.

Examples:

- violates `DESIGN_CONSTITUTION.md`
- creates duplicate core system
- changes save format without migration/default plan
- claims validation that was not run
- introduces unclear ownership

### Warning

Does not block by itself, but must be noted.

Examples:

- documentation follow-up needed
- tests not run for docs-only change
- performance risk known but acceptable for prototype

### Note

Useful observation for follow-up.

## Guardian Output

```text
Guardian:
Status: Pass | Warning | Blocked
Blockers:
Warnings:
Notes:
Required action:
```

## Rule

If blocked, do not open or mark the PR ready until the required action is handled or explicitly moved to a separate approved task.
