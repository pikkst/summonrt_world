# Kilo System Map

This file is the central map for the SummonerWorld AI framework.

It explains how existing `.kilo` layers work together without creating duplicate routing systems.

## Core Workflow

```text
User Task
  -> Context Engine
    -> Orchestrator
      -> Council when needed
        -> Patterns and Rules
          -> Implementation
            -> Checklists
              -> Guardian
                -> Pull Request
```

## Layer Responsibilities

### Context Engine

Location:

```text
.kilo/context_engine/
```

Responsibility:

- classify the task
- choose context level
- control token usage
- avoid loading the full project
- escalate context only when needed

The Context Engine decides what to read.

### Orchestrator

Location:

```text
.kilo/orchestrator/
```

Responsibility:

- manage task lifecycle
- select agents
- select context using Context Engine rules
- create the execution plan
- run review and completion criteria

The Orchestrator decides how to execute the task.

### Council

Location:

```text
.kilo/council/
```

Responsibility:

- provide expert viewpoints only when needed
- use `Council.index.md` before opening individual role files
- route to only relevant roles
- identify blockers and recommendations

The Council advises on risky or cross-system decisions.

### Patterns

Location:

```text
.kilo/patterns/
```

Responsibility:

- provide preferred architecture shapes
- reduce one-off systems
- keep Actions, Events, Reports, Save, Simulation, and World Memory consistent

Patterns define how solutions should be shaped.

### Rules

Location:

```text
.kilo/rules/
```

Responsibility:

- define mandatory project constraints
- protect coding, architecture, gameplay, git, testing, and workflow rules

Rules define what must not be violated.

### Philosophy

Location:

```text
.kilo/philosophy/
```

Responsibility:

- explain why the game and systems are designed this way
- preserve Player First, Commander RPG, Decision Over Clicking, Time as Gameplay, Reports, and World Memory principles

Philosophy explains why the design direction exists.

### Checklists

Location:

```text
.kilo/checklists/
```

Responsibility:

- provide practical review checks
- verify feature, bugfix, architecture, PR, testing, documentation, save, and performance readiness

Checklists verify work before Guardian review.

### Guardian

Location:

```text
.kilo/guardian/
```

Responsibility:

- act as the final quality gate
- block only concrete risks
- protect architecture, gameplay, save compatibility, quality, and merge readiness

Guardian decides whether the task is PR-ready.

## Standard Task Flow

For most tasks:

1. Read this file.
2. Use `.kilo/context_engine/TaskAnalyzer.md`.
3. Use `.kilo/orchestrator/TaskLifecycle.md`.
4. Select only the relevant agent/rule/pattern files.
5. Use council only if the task is risky or cross-system.
6. Implement the smallest safe change.
7. Run the relevant checklist.
8. Run Guardian only before PR readiness.

## No Duplication Rule

Do not create new layers that duplicate these responsibilities.

If a proposed new document is about choosing context, update `context_engine`.

If it is about task flow, update `orchestrator`.

If it is about expert review, update `council`.

If it is about review checks, update `checklists`.

If it is about final blocking risks, update `guardian`.

## Token Rule

Start from index and map files.

Load deeper files only when the task requires them.

Never load the full `.kilo` folder by default.
