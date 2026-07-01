# SummonerWorld Kilo Framework

This folder contains the AI development framework for SummonerWorld.

It is designed for Kilo Code and other AI coding agents that work on the project.

## Start Here

Read these first:

1. `DESIGN_CONSTITUTION.md`
2. `.kilo/SYSTEM_MAP.md`
3. `.kilo/context_engine/TaskAnalyzer.md`
4. `.kilo/orchestrator/TaskLifecycle.md`

Do not load the full `.kilo` folder by default.

## Main Layers

```text
brain/            persistent project context
rules/            mandatory constraints
philosophy/       design philosophy
patterns/         architecture patterns
anti_patterns/    known risks to avoid
context_engine/   context and token management
orchestrator/     task lifecycle and execution process
council/          expert decision roles
checklists/       practical review checks
guardian/         final quality gate
memory/           architecture and project memory
prompts/          reusable AI prompts
context/          system maps and flow documents
```

## Standard Flow

```text
Task
  -> Context Engine
    -> Orchestrator
      -> Council if needed
        -> Implementation
          -> Checklists
            -> Guardian
              -> PR
```

## Most Important Rules

- One task equals one branch and one Pull Request.
- Do not commit task work directly to `master`.
- Use the smallest useful context.
- Do not duplicate systems.
- Do not create new `.kilo` layers when an existing layer already owns the responsibility.
- Preserve `DESIGN_CONSTITUTION.md`.
- Prefer meaningful decisions over repetitive clicking.
- Be honest about validation that was not run.

## Layer Ownership

Before adding new AI documentation, check `.kilo/SYSTEM_MAP.md`.

If the new content fits an existing layer, update that layer instead of creating a duplicate.
