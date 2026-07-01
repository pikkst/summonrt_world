# Good Service Example

## Purpose

Services and core functions should be testable without rendering UI.

## Recommended Shape

A good service should:

- Accept typed inputs.
- Return typed outputs.
- Avoid hidden global state.
- Keep randomness seeded when deterministic behavior is required.
- Keep side effects explicit.

## Example

Service:

DungeonTraversalValidator

Inputs:

- tower metadata
- start floor
- target floor

Output:

- valid or invalid result
- reason when invalid
- reachable floor ids

## Why This Is Good

- The function can be unit tested.
- The UI does not need to know traversal rules.
- Simulation logic remains reusable.
