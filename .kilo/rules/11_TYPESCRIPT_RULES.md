# 11 - TypeScript Rules

## Strict Mode

SummonerWorld uses strict TypeScript expectations.

Do not weaken TypeScript settings to make code compile.

Forbidden unless explicitly approved:

- Disabling strict mode
- Suppressing errors with broad ignores
- Adding global `any` escape hatches
- Removing useful type checks

## `any` Rule

Avoid `any`.

If `any` is unavoidable:

- Keep it local.
- Add a short explanation.
- Prefer narrowing it immediately.
- Do not export it as part of public types.

Preferred alternatives:

- `unknown` with validation
- Discriminated unions
- Domain interfaces
- Generic constraints
- Explicit mapped types

## Exported Function Rule

Exported functions should have clear parameter and return types.

Good:

```ts
export function calculateBossScaling(worldIndex: number): DungeonBossScaling {
  // ...
}
```

Avoid unclear exported inference when the function is part of a public module contract.

## Domain Type Rule

Prefer domain types from `src/types` or relevant local modules.

Do not redefine the same concept in multiple files.

Before creating a type, search for an existing one.

## Discriminated Union Rule

Use discriminated unions for gameplay state where practical.

Examples:

```ts
type MissionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type RoomType = 'entrance' | 'combat' | 'trap' | 'puzzle' | 'treasure' | 'rest' | 'elite' | 'vendor' | 'boss';
```

## Null and Undefined Rule

Be explicit about nullable state.

Use `null` when representing intentionally absent state.
Use `undefined` for optional properties.

Avoid ambiguous chains that hide invalid gameplay state.

## Type Guards

Use type guards when parsing external or untrusted data, especially:

- Imported saves
- JSON data files
- Future server payloads
- Marketplace data
- User command input

## Constants and Literal Types

For gameplay enums and constants:

- Prefer `as const` arrays or typed objects.
- Export derived union types when useful.
- Avoid stringly-typed duplicated literals.

## Build Rule

Do not consider work complete until:

```bash
npm run typecheck
```

passes, unless the PR clearly states why validation could not be run.
