# Kilo AI Decision Council

This folder defines the AI decision layer for SummonerWorld.

The council does not replace the orchestrator or specialist agents. It gives structured expert viewpoints for tasks that need cross-role judgment.

## Purpose

Use the council to improve decisions before implementation or review.

## Council Groups

- `executive/` - high-level architecture, gameplay direction, technical direction, release readiness.
- `design/` - domain design viewpoints.
- `engineering/` - implementation, QA, performance, security, and documentation viewpoints.
- root roles - AI Historian, Player Advocate, and System Integrator.

## Use With Orchestrator

The orchestrator should select only the council roles required by the task.

Small tasks should not invoke the full council.

## Required Flow

```text
Task
  -> Orchestrator
    -> Context Engine
      -> Council Routing
        -> Relevant Council Views
          -> Implementation Plan
```

## Rule

Council output is advisory unless a role identifies a blocker that violates `DESIGN_CONSTITUTION.md`, architecture ownership, validation, save compatibility, or task scope.
