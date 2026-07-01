# Kilo Review Checklists

This folder contains practical quality-control checklists for Kilo Code and other AI coding agents working on SummonerWorld.

Use these checklists before completing work, opening a Pull Request, or reviewing code.

## Framework Position

Read `.kilo/SYSTEM_MAP.md` first.

Checklists own practical review criteria.

Do not create another checklist or review-criteria layer. Update this folder if review checks need to improve.

## Checklist Index

Existing task checklists:

- `feature_checklist.md` - use before completing a feature task.
- `bugfix_checklist.md` - use before completing a bug fix.
- `refactor_checklist.md` - use before completing a refactor.
- `review_checklist.md` - use when reviewing code or a PR.
- `documentation_checklist.md` - use when updating docs.
- `release_checklist.md` - use before sprint/milestone release.
- `pr_final_checklist.md` - use immediately before opening or updating a PR.

Review-layer checklists:

- `ArchitectureChecklist.md` - ownership, dependencies, patterns, and design direction.
- `FeatureChecklist.md` - new gameplay or technical features.
- `BugfixChecklist.md` - bug fixes and regression protection.
- `PRChecklist.md` - Pull Request readiness.
- `TestingChecklist.md` - validation and test coverage.
- `DocumentationChecklist.md` - documentation accuracy.
- `SaveSystemChecklist.md` - persistence and migration safety.
- `PerformanceChecklist.md` - scaling and responsiveness.

## Prime Rule

A checklist item should not be checked unless it is actually true.

If a checklist item cannot be completed, explain why in the Pull Request notes.

Use the smallest checklist set that fits the task.

Do not run every checklist for a tiny documentation fix.
