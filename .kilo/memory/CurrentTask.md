# Current Task

## Task Selection Rule

```text
No task is pinned here.
```

## Purpose

This file must not override the user's requested task or `SummonerWorld_Tasks.md`.

Agents must identify the exact task from the current user request and `SummonerWorld_Tasks.md`.
If there is no explicit task reference, use `SummonerWorld_Tasks.md` to find the next unchecked task and report the choice before implementation.

## Required Cross-Check

Before coding, verify:

- User-requested task ID, if provided.
- Matching task entry in `SummonerWorld_Tasks.md`.
- Branch name derived from that exact task.
- Relevant `.kilo` context selected by the Context Engine.

## Stale Memory Rule

If this memory file conflicts with `SummonerWorld_Tasks.md` or the user's request, the user request and task file win.
