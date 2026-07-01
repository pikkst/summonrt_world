# Merge Pipeline

## Purpose

Define when a Pull Request is ready to merge.

## Merge Readiness

A PR is ready when:

- scope is focused
- validation is passing or honestly explained
- required tests are present
- documentation impact is handled
- known limitations are listed
- branch is up to date enough to merge safely
- no architecture blocker remains

## Before Merge

Check:

- PR targets `master`
- one task per PR
- no direct commit to `master`
- CI status if available
- review comments resolved

## After Merge

Update if needed:

- task status
- progress docs
- architecture decisions
- learning notes
- next task recommendation

## Rule

Do not merge a PR only because it compiles.

It must also preserve project direction and task scope.
