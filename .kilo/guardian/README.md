# Kilo Guardian Layer

This folder defines final safety and quality gates for SummonerWorld AI-assisted development.

Guardian roles do not implement features. They protect project direction before a Pull Request is considered ready.

## Purpose

The Guardian layer checks for blockers that may have been missed by implementation agents, council roles, or normal review.

## File Index

- `GuardianGate.md` - overall guardian flow and blocker levels.
- `ArchitectureGuardian.md` - architecture and ownership protection.
- `GameplayGuardian.md` - player value and Design Constitution protection.
- `SaveGuardian.md` - save/load and persistence protection.
- `QualityGuardian.md` - tests, validation, and documentation protection.
- `MergeGuardian.md` - final merge readiness protection.

## Use With Existing Layers

```text
Orchestrator
  -> Context Engine
    -> Council
      -> Checklists
        -> Guardian
          -> PR Ready
```

## Rule

Guardian checks should block only concrete risks.

Do not block for vague preferences or unrelated improvements.
