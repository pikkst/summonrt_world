# Random Without Seed

## Risk

Persistent or testable systems use unseeded randomness.

## Signs

- `Math.random()` appears in generation or simulation.
- Same world seed produces different results.
- Tests fail unpredictably.
- Offline catch-up cannot be replayed.

## Why It Hurts

- Determinism breaks.
- Save/load can drift.
- Future online validation becomes difficult.

## Preferred Direction

Use:

- seeded random utilities
- `SimulationPattern.md`
- `WorldGenerationPattern.md`

## Rule

Persistent generation and important simulations must use deterministic inputs.
