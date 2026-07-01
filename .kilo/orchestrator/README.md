# Kilo Orchestrator

This folder defines how Kilo Code should coordinate task execution for SummonerWorld.

The orchestrator does not replace specialist agents. It decides which agents, documents, patterns, checks, and review steps are needed for a task.

## Core Principle

```text
Analyze first.
Select context second.
Plan third.
Implement fourth.
Review before PR.
```

## File Index

- `TaskLifecycle.md` - full task lifecycle from request to PR.
- `AgentSelection.md` - choose only the needed specialist roles.
- `ContextSelection.md` - select context using the context engine.
- `ExecutionPlan.md` - build a safe implementation plan.
- `ReviewPipeline.md` - review sequence before PR.
- `MergePipeline.md` - merge readiness and post-merge notes.
- `FailureRecovery.md` - what to do when work gets stuck.
- `RetryPolicy.md` - safe retry rules.
- `CompletionCriteria.md` - when a task can be called complete.

## Rule

The orchestrator must reduce unnecessary work, not add ceremony.

Use the smallest workflow that safely completes the task.
