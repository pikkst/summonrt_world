# 02 - Code Rules

## General Code Principles

All code must follow these principles:

- SOLID
- DRY
- KISS
- Data-driven design
- Event-driven architecture where appropriate
- Deterministic simulation where required
- Independent testability

## TypeScript Quality

- Use strict TypeScript.
- Avoid `any`.
- Prefer domain-specific types from `src/types`.
- Prefer explicit return types for exported functions.
- Prefer pure functions for core gameplay calculations.
- Avoid hidden mutation unless it is already part of an existing store or module pattern.

## File Responsibility

A file should have one clear responsibility.

If a file grows into multiple systems, split it during a dedicated refactor task, not during unrelated feature work.

Examples of separate responsibilities:

- Dungeon generation
- Boss arena generation
- Pathfinding
- Room assignment
- Save serialization
- Combat formula calculation
- Mission resolution

## Comments

- Comments must be written in English.
- Comments should explain why the code exists.
- Do not add noisy comments that simply repeat the code.
- Complex gameplay formulas should include short explanatory comments.

## Deterministic Gameplay

Do not use `Math.random()` in deterministic gameplay systems.

Use seeded randomness when output must be reproducible for:

- Dungeon generation
- World generation
- Creature generation
- Loot tables
- Offline catch-up
- Future MMO synchronization

## Magic Numbers

Avoid magic numbers.

Use named constants for:

- XP multipliers
- Capture rates
- Damage modifiers
- Dungeon floor counts
- Spawn weights
- Economy coefficients
- Timer durations

## Error Handling

- Fail clearly.
- Prefer explicit validation errors for invalid gameplay state.
- Do not silently ignore impossible states unless the current system already uses that pattern and changing it would be a larger refactor.

## Forbidden Code Patterns

Avoid:

- Duplicated functions with different names.
- Circular imports.
- Large unrelated changes in one file.
- New global state without clear ownership.
- Hard-coded gameplay values that belong in data/config files.
- Business logic embedded directly in React components when it belongs in core modules.

## Completion Rule

Code is not complete until it is type-safe, tested, and aligned with the project documentation.
