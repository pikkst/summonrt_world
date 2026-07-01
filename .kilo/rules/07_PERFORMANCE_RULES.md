# 07 - Performance Rules

## Performance Philosophy

Performance work must protect gameplay clarity, determinism, and maintainability.

Do not optimize prematurely in ways that make systems harder to understand or test.

## Browser Performance

SummonerWorld targets modern browsers.

Code should avoid unnecessary work in render loops and UI updates.

Prefer:

- Memoized derived UI data when needed.
- Small store selectors.
- Lazy loading for heavy assets.
- Chunked world data.
- Deterministic cached generation when appropriate.

## Bundle Budget

The technical target is to keep the initial bundle small.

Avoid adding large dependencies without clear justification.

Before adding a dependency, check:

- Can existing code solve this?
- Is the dependency maintained?
- Is the bundle impact acceptable?
- Does it work offline?
- Does it fit future MMO architecture?

## Simulation Performance

Long-running simulations must be designed carefully.

For simulations such as ecosystem, economy, and offline catch-up:

- Avoid unbounded loops.
- Use clear tick limits.
- Batch work where practical.
- Use deterministic inputs.
- Add tests for large simulation counts.

## Dungeon and World Generation

Procedural generation should be deterministic and efficient.

Rules:

- Avoid regenerating the same floor/world repeatedly without need.
- Cache generated metadata when save/load requires persistence.
- Keep graph traversal algorithms bounded.
- Test large cases such as 100-floor towers.

## React Rendering Rules

Do not place heavy gameplay calculations directly inside React render bodies.

Move gameplay logic to:

- `src/core`
- `src/modules`
- `src/services`
- `src/stores`

React components should primarily render state and dispatch user intent.

## Performance PR Rule

Performance changes must include:

- What was slow or risky.
- What changed.
- How correctness was preserved.
- Any benchmark, test, or reasoning used.

## Forbidden Performance Shortcuts

Do not improve speed by:

- Removing validation.
- Removing tests.
- Breaking determinism.
- Skipping save/load compatibility.
- Hard-coding special cases that should be data-driven.
