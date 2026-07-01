# Context Stop Rules

## Purpose

Prevent unnecessary file loading once enough context exists to complete the task safely.

## Stop Loading When

Stop loading more context when the agent can answer all of these:

- What task is being implemented?
- Which system owns the change?
- Which files are likely to change?
- Which patterns or rules apply?
- What validation is required?
- What documentation must be updated?

## Hard Stop Conditions

Stop immediately when:

- 12 initial documents were loaded and no blocker exists
- primary source files are found
- implementation path is clear
- further reading would only add background context
- the next file is not directly connected to the task

## Load One More File Only If

Load exactly one more file when:

- ownership is unclear
- migration or save compatibility is unclear
- tests reveal missing behavior
- a required type or factory cannot be found
- a Council or Guardian reference requires confirmation

## Summary Before More Context

Before loading more after the stop point, write:

```text
Known context:
Missing information:
Why one more file is needed:
Expected file:
```

## Rule

More context is allowed only when it reduces implementation risk.

More context is not allowed when it only increases confidence without changing the plan.
