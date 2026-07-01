# Long Functions

## Risk

A single function handles many steps, branches, validations, side effects, and result formatting.

## Signs

- Function is hard to name clearly.
- Many nested conditions.
- Validation, simulation, event creation, and reporting are mixed.
- Tests need many unrelated assertions.

## Preferred Direction

Split by responsibility:

- validate
- simulate
- emit events
- create report
- persist result

## Rule

A function should usually have one clear reason to change.
