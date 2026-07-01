# Council Output

## Purpose

Standardize council feedback so it is short, useful, and easy for the orchestrator to act on.

## Output Format

Each council role should respond in this shape:

```text
Role:
Decision:
Confidence:
Reasoning:
Blockers:
Recommendations:
Required follow-up:
```

## Decision Values

Use one:

- `Approve`
- `Approve with notes`
- `Request changes`
- `Escalate`
- `Out of scope`

## Confidence Values

Use one:

- High
- Medium
- Low

## Blocker Rule

A blocker must be concrete.

Examples:

- violates Design Constitution
- creates duplicate system
- changes save shape without migration plan
- lacks regression test for bug fix
- creates unclear ownership

## Length Rule

Council output should be concise.

Prefer actionable notes over long essays.
