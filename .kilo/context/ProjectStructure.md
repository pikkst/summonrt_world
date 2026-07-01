# Project Structure

## High-Level Layout

```text
summoner-world/
  src/
    core/
    modules/
    stores/
    data/
    types/
```

## Main Purpose

The project is a React, TypeScript, Vite Summoner RPG prototype with an offline-first foundation and future MMO compatibility.

## Key Areas

### `src/core`

Pure or mostly pure gameplay logic.

Best for:

- deterministic generation
- formulas
- validation helpers
- graph/path utilities
- simulation helpers

### `src/modules`

Feature/system modules.

Best for:

- combat
- creatures
- dungeon
- save
- economy
- quests
- player systems

### `src/stores`

Client state and actions.

Best for:

- current player state
- UI-driven gameplay state
- action coordination

### `src/data`

Static data and configuration.

Best for:

- constants
- element data
- rarity data
- class data
- tables and weights

### `src/types`

Shared domain types.

Best for:

- player types
- creature types
- dungeon types
- world types
- event types

## Rule

Before creating a new file, search for the existing owner module first.
