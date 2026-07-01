# 12 - React Rules

## React Role

React components should render game state and collect player intent.

Core gameplay logic should live outside React components whenever practical.

Preferred locations for gameplay logic:

- `src/core`
- `src/modules`
- `src/services`
- `src/stores`
- `src/data`

## Component Responsibility

Components should be small and focused.

A component should not own complex rules for:

- Combat formulas
- Dungeon generation
- Economy simulation
- World generation
- Save migration
- Creature fusion rules
- Quest generation

Move those rules into testable functions.

## State Selection

Use focused selectors when reading store state.

Avoid causing large unnecessary re-renders by selecting entire stores when only a small field is needed.

## Derived UI Data

If derived data is expensive or reused, compute it outside render or memoize it.

Do not run large dungeon/world/economy simulations during render.

## Accessibility

UI work must consider:

- Keyboard navigation
- Clear focus states
- ARIA live regions for logs and combat/system messages
- Font scaling
- High contrast mode where relevant

## Error Display

Player-facing errors should be clear and actionable.

Do not expose raw internal stack traces in normal gameplay UI.

## UI and Gameplay Separation

UI may dispatch intent:

```text
Player clicked Capture
```

Core systems should resolve rules:

```text
Capture chance
Affinity bonus
Rarity penalty
Failure consequences
```

## Styling Rule

Follow the existing styling approach.

Do not introduce a new UI framework unless the task explicitly requires it.

## Testing React Components

For UI tasks, add tests when practical for:

- Rendering key state
- User interactions
- Accessibility-critical behavior
- Regression bugs

## Forbidden React Patterns

Avoid:

- Business logic embedded in JSX.
- Large useEffect chains controlling gameplay rules.
- Direct mutation of store state.
- Network calls inside components without a service abstraction.
- Hard-coded gameplay constants in components.
