# Good Test Example

## Purpose

Tests should protect meaningful gameplay behavior.

## Recommended Shape

A good test should:

- Use clear setup.
- Assert gameplay invariants.
- Avoid fragile implementation details.
- Use fixed seeds for deterministic systems.
- Explain what behavior is protected.

## Example Scenario

Test name:

World 10 dungeon tower has a reachable final boss floor

Setup:

- generate World 10 tower
- start from first floor entrance
- follow vertical links

Expected result:

- every floor is reachable
- each floor has an entrance-to-boss path
- final boss floor is reachable

## Why This Is Good

- It protects the player progression path.
- It validates multiple systems together.
- It is more useful than checking only that an object exists.
