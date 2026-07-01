# Coding Rules

## TypeScript Rules

- Use TypeScript strict mode.
- Avoid `any` unless there is no reasonable alternative and the reason is documented.
- Prefer explicit domain types from `src/types`.
- Prefer immutable data structures where practical.
- Prefer pure functions for deterministic gameplay logic.
- Keep functions under 100 lines where possible.
- Split large files when a file starts mixing unrelated responsibilities.

## Comment Rules

- Code comments must be written in English.
- Comments should explain why, not repeat what the code already says.
- Public exported helpers should have clear names and simple contracts.

## Naming Rules

- Classes and React components: `PascalCase`.
- Functions and variables: `camelCase`.
- Constants: `UPPER_CASE`.
- File names should follow the existing project convention.

## Gameplay Logic Rules

- Deterministic generation must remain deterministic for the same inputs.
- Randomness must use existing seeded random utilities when gameplay state must sync offline or online.
- Do not use `Math.random()` for deterministic gameplay systems.
- Avoid magic numbers; use named constants.
- Save/load compatibility must be considered before adding persistent fields.

## Refactor Rules

- Do not refactor unrelated code inside feature tasks.
- If a refactor is required, keep it minimal and explain it in the PR.
- For large refactors, create a dedicated refactor task and PR.
