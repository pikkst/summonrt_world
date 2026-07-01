# Performance Checklist

Use this checklist for simulations, generators, large lists, UI-heavy screens, queues, and systems expected to scale.

## Runtime

- [ ] Expensive work is not repeated unnecessarily.
- [ ] Deterministic generation is not run during render.
- [ ] Large lists are filtered, paged, grouped, or virtualized when needed.
- [ ] Offline catch-up cost is considered.

## Simulation

- [ ] Simulation steps are bounded.
- [ ] Queue processing is predictable.
- [ ] Seeded generation can be tested with fixed inputs.
- [ ] Performance-sensitive loops are easy to profile.

## UI

- [ ] Components avoid heavy calculations in render.
- [ ] Store selectors avoid unnecessary broad updates.
- [ ] Reports or logs are displayed in manageable batches.

## Future Scale

- [ ] The design has a path to support many creatures, Actions, reports, or worlds.
- [ ] MMO compatibility is considered when relevant.
- [ ] Known performance risks are documented.
