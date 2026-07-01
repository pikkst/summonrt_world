# Architecture Checklist

Use this checklist for architecture changes, cross-system features, refactors, and new core modules.

## Design Direction

- [ ] `DESIGN_CONSTITUTION.md` is preserved.
- [ ] Player-first architecture is preserved.
- [ ] The change supports meaningful player decisions.
- [ ] The change does not add repetitive clicking without strategy.

## Ownership

- [ ] The owning module is clear.
- [ ] No duplicate system was created.
- [ ] No existing system was bypassed unnecessarily.
- [ ] Data ownership is clear.

## Patterns

- [ ] Relevant `.kilo/patterns` were considered.
- [ ] Action/Event/Report fit was considered.
- [ ] Save/load impact was considered.
- [ ] World Memory impact was considered when gameplay consequences matter.

## Dependencies

- [ ] Dependency direction is clear.
- [ ] No circular dependency was introduced.
- [ ] UI does not contain gameplay formulas.
- [ ] Cross-system reactions use events when appropriate.

## Review

- [ ] ChiefArchitect is invoked if system ownership is unclear.
- [ ] SystemIntegrator is invoked for cross-system changes.
- [ ] AIHistorian is invoked if an ADR or memory update is needed.
