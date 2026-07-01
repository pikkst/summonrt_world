# Boolean Explosion

## Risk

Many boolean flags represent hidden lifecycle states.

## Signs

- `isStarted`, `isRunning`, `isComplete`, `isFailed`, `isArchived` appear together.
- Invalid combinations are possible.
- UI has to guess the real state.

## Preferred Direction

Use:

- `StateMachinePattern.md`
- explicit state enums
- transition validation

## Rule

Use one clear lifecycle state instead of many conflicting booleans.
