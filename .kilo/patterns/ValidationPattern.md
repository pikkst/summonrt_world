# Validation Pattern

## Purpose

Use the Validation Pattern before accepting Commands, starting Actions, importing data, or applying persistent changes.

## Fits

Use for:

- action requirements
- save import
- creature fusion
- crafting recipes
- trade listing
- dungeon entry
- quest acceptance
- player progression changes

## Shape

Validation should return:

- valid or invalid
- reason codes
- user-facing message
- blocking issues
- warnings
- normalized input when appropriate

## Rules

- Validate before state changes.
- Use clear failure reasons.
- Keep player-facing messages readable.
- Treat imported data as untrusted.
- Future online validation should be server-compatible.

## Avoid

- Throwing generic errors for normal invalid input.
- Letting UI validation replace domain validation.
- Silent correction of important gameplay state.
