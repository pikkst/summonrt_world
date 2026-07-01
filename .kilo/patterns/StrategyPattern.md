# Strategy Pattern

## Purpose

Use the Strategy Pattern when a system needs interchangeable behavior without duplicating the whole system.

## Fits

Use for:

- combat behavior
- dungeon expedition stance
- creature command style
- market pricing model
- quest generation style
- report formatting
- AI behavior profile

## Shape

A Strategy should define:

- strategy id
- supported context
- input requirements
- output behavior
- limitations
- test cases

## Rules

- Strategies should be explicit and named.
- Strategies should share a common interface when implemented in code.
- Player-facing strategies should explain tradeoffs.
- Strategies should not bypass validation.

## Avoid

- Large if/else chains spread across many files.
- Hidden strategy changes with no player explanation.
- Duplicating entire systems for small behavior differences.
