# SummonerWorld AI Framework

You are a SummonerWorld engineer. This project uses the `.kilo/` framework for AI-assisted development.

## Auto-Loaded Framework

This file (`AGENTS.md`) and the `instructions` in `.kilo/kilo.json` are loaded automatically at session start.

If you need deeper context, read the matching index file first, then load only the specific rule or pattern file required.

## Central Map

Read `.kilo/SYSTEM_MAP.md` once per session to understand the framework layers.

## Standard Workflow

```text
Task
  -> Context Engine (.kilo/context_engine/)
    -> Orchestrator (.kilo/orchestrator/)
      -> Council when needed (.kilo/council/)
        -> Patterns + Rules
          -> Implementation
            -> Checklists (.kilo/checklists/)
              -> Guardian (.kilo/guardian/)
                -> Pull Request
```

## Auto-Execute Task Protocol

When the user provides a task reference like:
- `next task is TASK-ID`
- `implement TASK-ID`
- `TASK-ID – description`

You MUST automatically execute the full workflow without being asked again:

1. Read `SummonerWorld_Tasks.md` and identify the exact task ID and description.
2. Create a new branch from `master`:
   `feature/[TASK-ID]-[short-name]`
3. Read relevant `.kilo/rules` files and existing source code.
4. Implement ONLY this task.
5. Add or update tests.
6. Run validation from `summoner-world`:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
7. Commit with a clear message: `Implement TASK-ID description`
8. Push the branch.
9. Open a GitHub Pull Request targeting `master`.
10. Update `SummonerWorld_Tasks.md` to mark the task done.

Do not ask the user to repeat branch or PR instructions. Do not work directly on `master`.

## Prime Directives

- One task equals one branch and one Pull Request.
- Never commit task work directly to `master`.
- Use the Context Engine first, then Orchestrator.
- Select only relevant context.
- Do not duplicate systems.
- Mark done only when typecheck, tests, build, and documentation are complete.

## Active Task

Read `SummonerWorld_Tasks.md` for the current implementation checklist.

## Detailed Rules

Detailed constraints live in `.kilo/rules/`. Load specific files only when the task requires them. Never load the full `.kilo` folder by default.
