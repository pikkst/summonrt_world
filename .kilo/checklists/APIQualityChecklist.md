# API Quality Checklist

Use this checklist when adding or changing exported modules, public helpers, data modules, stores, or shared TypeScript types.

## Type Safety

- [ ] Use the strongest available type for public constants.
- [ ] Do not use `Record<string, ...>` when a known union type exists.
- [ ] Do not loosen public parameters to `string` when a narrower domain type exists.
- [ ] Avoid `any` in public APIs unless there is a documented boundary reason.
- [ ] Remove unnecessary casts after improving input types.

## Public Return Types

- [ ] Export reusable return types for public helper functions when consumers may need them.
- [ ] Prefer named types or `Pick<ExistingType, ...>` over long anonymous inline return types.
- [ ] Keep helper return types consistent with related helpers.

## Module Boundaries

- [ ] Data modules should expose data and access helpers without importing heavy runtime logic.
- [ ] Core modules should not be imported only to access static data.
- [ ] Shared data should have one source of truth.
- [ ] Public exports should be intentional and documented by usage.

## Imports and Exports

- [ ] Remove unused imports.
- [ ] Remove unused exports unless they are intentionally reserved and documented.
- [ ] Prefer importing types from the owning module.
- [ ] Avoid re-export chains that hide ownership.

## Tests

- [ ] Test names match their actual assertions.
- [ ] Assertions verify behavior or structure, not only existence.
- [ ] Type-sensitive helpers have tests for valid and invalid lookups when practical.
- [ ] Data modules have tests for required entries and stable accessors.

## PR Review Prompt

Before marking a PR ready, ask:

```text
Did this change weaken any public type, helper signature, data key, or exported API surface?
```

If yes, fix it or document why the weaker type is necessary.
