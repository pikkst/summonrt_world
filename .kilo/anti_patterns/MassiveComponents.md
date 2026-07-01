# Massive Components

## Risk

A UI component grows too large and handles rendering, state, validation, and gameplay coordination together.

## Signs

- Very long component file.
- Many unrelated local states.
- Complex effects and gameplay calculations.
- Hard to test one behavior.

## Preferred Direction

Split into:

- smaller components
- store actions
- hooks when useful
- core/module functions

## Rule

Components should render one clear UI responsibility and pass intent to actions.
