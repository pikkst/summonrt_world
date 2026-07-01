# Kilo Context Engine

This folder teaches AI agents how to choose the smallest useful context before working.

The goal is to reduce token usage while preserving correctness.

## Framework Position

Read `.kilo/SYSTEM_MAP.md` first.

The Context Engine owns context selection and token usage.

Do not create another router or context-selection layer. Update this folder if context selection needs to improve.

## Core Rule

```text
Think before reading.
Read before planning.
Plan before coding.
Validate before committing.
```

## Workflow

```text
User Task
  -> Task Analyzer
    -> Decision Freeze
      -> Context Planner
        -> Token Budget
          -> Load Minimum Context
            -> Context Stop Rules
              -> Orchestrator Plan
```

## File Index

- `TaskAnalyzer.md` - classify the task before loading files.
- `DecisionFreeze.md` - prevent repeated re-analysis after task classification.
- `ContextPlanner.md` - choose only the needed context.
- `ContextBudget.md` - manage token limits.
- `ContextStopRules.md` - stop loading when enough context exists.
- `ArchitectureTaskScope.md` - keep large architecture tasks focused.
- `DocumentPriority.md` - rank documents by value.
- `DependencyResolver.md` - load related systems only when needed.
- `ContextEscalation.md` - know when to expand context.
- `CachePolicy.md` - reuse summaries when safe.
- `SmartLoading.md` - lazy-load documents and source files.
- `ForbiddenLoading.md` - what not to load by default.
- `Examples.md` - practical context plans by task type.

## Maximum Documents Rule

Never load more than 12 documents initially.

If more context is required:

1. Summarize current understanding.
2. Identify the next most useful document.
3. Load only that document or section.
4. Repeat only if needed.

## Efficiency Rule

After task classification is frozen, move to planning and implementation.

Do not repeatedly reconsider the same task type, risk level, or context level unless new evidence appears.
