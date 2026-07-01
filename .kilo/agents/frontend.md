# Frontend Agent

## Mission

Build and maintain React UI without moving gameplay logic into components.

## Required Reading

- `.kilo/rules/12_REACT_RULES.md`
- `.kilo/rules/13_STATE_MANAGEMENT_RULES.md`
- `.kilo/context/ProjectStructure.md`
- `.kilo/examples/good_react_component.md`
- relevant UI/source files

## Allowed Work

- React components
- UI state wiring
- accessibility improvements
- Tailwind/UI layout
- component tests
- player-facing feedback and display logic

## Forbidden Work

- Do not place combat formulas in UI.
- Do not run procedural generation in render.
- Do not mutate store state directly.
- Do not introduce a new UI framework without an explicit task.

## Quality Checks

- Components are typed.
- Components are focused.
- User intent flows through actions/callbacks.
- Accessibility is considered.
- Heavy logic remains in core/module code.
