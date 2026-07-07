# Kilo Start Router

Use this file first. It is the compact router for the `.kilo` framework.

## Goal

Use the full framework without loading unnecessary files.

Default rule:

```text
Read the smallest context that proves the plan is safe.
Stop loading when the task, owner, files, rules, tests, and docs are clear.
```

## Required Startup

For every implementation task:

1. Read `AGENTS.md`.
2. Read this file.
3. Read `.kilo/SYSTEM_MAP.md` only once per session.
4. Read `SummonerWorld_Tasks.md` enough to identify the exact task.
5. Use `.kilo/context_engine/Bundles.md` to choose the first context bundle.
6. Use `.kilo/context_engine/TaskAnalyzer.md` only for non-trivial or unclear tasks.
7. Use `.kilo/context_engine/ContextPlanner.md` only when the bundle is not enough.

Do not open whole folders. Use index files and targeted search first.

## Lean Mode

Use Lean Mode for docs-only changes, typo fixes, prompt edits, small tests, or one-file fixes.

Lean Mode reads:

- `AGENTS.md`
- `.kilo/START_HERE.md`
- exact target files
- one relevant checklist before finishing

Lean Mode skips Council, GDD, TechnicalSpec, and broad memory unless directly relevant.

## Standard Mode

Use Standard Mode for normal features and bug fixes.

Standard Mode reads:

- one context bundle from `.kilo/context_engine/Bundles.md`
- one relevant agent file
- one relevant rule file
- one relevant pattern or context flow when needed
- directly related source and test files

## Deep Mode

Use Deep Mode only for architecture, persistence, save/load, MMO-sensitive, or cross-system changes.

Deep Mode may read:

- `TaskAnalyzer.md`
- `ContextPlanner.md`
- `TaskLifecycle.md`
- `AgentSelection.md`
- `.kilo/rules/24_ONLINE_IMPLEMENTATION_CONTRACT.md` for online/MMO tasks
- relevant Council index and roles
- relevant Guardian file

State why Deep Mode is needed before expanding context.

## Compact Kilo Evidence

Before coding, output this compact evidence:

```text
Kilo Evidence:
Task:
Mode:
Type/Risk:
Agents:
Context:
Branch:
Validation:
Final review todo: yes
```

Keep each line short. Do not paste long document summaries.

If this evidence is missing before coding, invoke `.kilo/agents/workflow.md` and stop implementation until the evidence is produced.

## Context Budget

Initial limits:

- Lean: 2-5 files
- Standard: 6-10 files
- Deep: 11-20 files

Load more only when it reduces a concrete implementation risk.

## Stop Loading

Stop loading context when you know:

- exact task
- owning system
- likely changed files
- relevant rules and patterns
- validation commands
- documentation impact

If more context is needed after this point, state:

```text
Missing:
Why it matters:
Next file only:
```

## PR Gate

Before PR readiness:

1. Run validation or report what was not run.
2. Run the relevant checklist.
3. Run `.kilo/orchestrator/ReviewPipeline.md`.
4. Run `.kilo/guardian/GuardianGate.md`.
5. Run `.kilo/agents/workflow.md` when evidence, checklist use, or PR body compliance is uncertain.

Use delta-based review: mention only changed systems, risks, validation, and blockers.

The PR body must include a Kilo Workflow section. If it does not, the PR is not ready.
