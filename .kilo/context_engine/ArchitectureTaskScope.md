# Architecture Task Scope

## Purpose

Keep large architecture tasks focused.

## Applies To

Use this guide when the task type is:

- architecture
- root aggregate
- persistence shape
- migration
- cross-system feature
- refactor

## Preferred Task Shape

For most architecture tasks, prefer:

- type definitions
- factory functions
- migration helpers
- adapter helpers
- focused tests
- focused documentation

## Out Of Scope By Default

Do not change unrelated systems unless the task explicitly requires it.

Normally avoid changing:

- stores
- save system
- combat system
- quest system
- creature system
- economy system
- UI screens
- world generation
- report inbox

## Scope Guard

Before implementation, state:

```text
In scope:
Out of scope:
Migration strategy:
Validation plan:
```

## Escalation Rule

If an unrelated system appears required:

1. Stop.
2. Document why it appears required.
3. Prefer a bridge or helper when safe.
4. Move extra work to a follow-up task when possible.

## Player Core Example

For `PlayerCoreState` root aggregate tasks:

In scope:

- define aggregate type
- include required owned state sections
- add migration-safe factory from existing player state
- preserve Sprint 0-6 data
- add focused tests
- add task report

Out of scope by default:

- changing all stores
- changing save/load engine
- changing creature contract systems
- changing quests
- changing inventory UI
- changing combat rules

## Rule

Architecture tasks should create a stable direction while keeping the current task reviewable.
