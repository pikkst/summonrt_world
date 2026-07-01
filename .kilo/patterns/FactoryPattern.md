# Factory Pattern

## Purpose

Use the Factory Pattern when object creation requires rules, defaults, validation, or deterministic inputs.

## Fits

Use for:

- Action creation
- Report creation
- Creature creation
- Dungeon floor creation
- Quest instance creation
- Save slot creation
- Event creation

## Shape

A Factory should define:

- required inputs
- defaults
- validation rules
- generated ids
- deterministic seed use when needed
- returned object shape

## Rules

- Keep creation rules in one place.
- Use factories when defaults are important.
- Use factories when generated state must be valid from the beginning.
- Test factories with normal and edge inputs.

## Avoid

- Repeating object construction across many files.
- Creating partially invalid objects.
- Hiding random generation without seed control.
