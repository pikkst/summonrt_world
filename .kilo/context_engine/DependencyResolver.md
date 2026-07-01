# Dependency Resolver

## Purpose

Load related systems only when the task shows a real dependency.

## Primary and Secondary Systems

Every task should identify:

- primary system
- secondary systems
- persistence impact
- UI impact
- test impact

## Example

Task:

```text
Fix dungeon rewards.
```

Primary system:

```text
Dungeon
```

Likely secondary systems:

```text
Rewards
Inventory
Economy only if prices/currency are involved
Save only if reward state is persistent
```

## Dependency Loading Rule

Load primary system context first.

Load secondary system context only when:

- source code imports it
- task mentions it
- tests fail around it
- implementation needs its rules
- persistence or ownership crosses system boundaries

## Avoid

- Loading all neighboring systems by default.
- Loading economy for every reward unless currency/market logic is involved.
- Loading world context for every dungeon task unless world progression is affected.
