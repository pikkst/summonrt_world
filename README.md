# Summoner World

Summoner World is a browser-based, player-first Summoner RPG prototype built with React, TypeScript, Vite, Zustand, and Vitest.

The project focuses on a long-term RPG loop where the player develops a summoner identity, forms creature contracts, explores generated worlds, completes timed missions, grows through career and stat systems, and gradually unlocks deeper world, creature, dungeon, economy, housing, quest, reputation, achievement, and end-game systems.

## Current Project Status

The project is in active Sprint 6+ development.

Current documented alignment states that:

- Sprint 0-5 are complete.
- Sprint 6 implementation has progressed through the Player Core alignment tasks.
- The architecture direction is `Player Core -> Creature Core -> World Core -> NPC Core -> Economy Core`.
- Player Core work currently includes PlayerCoreState, Character Creation, Summoner Classes, Element Identity, and ongoing stat/statistics work.
- The active task list is maintained in `SummonerWorld_Tasks.md`.

## Tech Stack

The playable app lives in the `summoner-world/` folder.

- React 19
- TypeScript 6
- Vite 8
- Zustand 5
- Vitest 3
- Tailwind CSS 4
- ESLint 9
- Seeded generation utilities

## Repository Structure

```text
.
├── README.md
├── SummonerWorld_Tasks.md
├── docs/
│   ├── Sumoner_World_dec/
│   └── T6P.* implementation reports
├── .kilo/
│   ├── README.md
│   ├── SYSTEM_MAP.md
│   ├── context_engine/
│   ├── orchestrator/
│   ├── checklists/
│   ├── guardian/
│   ├── rules/
│   └── memory/
└── summoner-world/
    ├── package.json
    ├── src/
    │   ├── core/
    │   ├── data/
    │   ├── modules/
    │   ├── stores/
    │   ├── test/
    │   ├── types/
    │   ├── ui/
    │   └── utils/
    └── vite / tsconfig / vitest config files
```

## Main Systems

### Player Core

Player Core is the long-term root direction for player-owned state.

It includes identity, summoner profile, class, element identity, XP, inventory, equipment, skills, talents, titles, achievements, statistics, reputation, creature contracts, housing references, world unlocks, and save metadata.

Important files:

```text
summoner-world/src/types/playerCore.ts
summoner-world/src/core/playerCore/
summoner-world/src/data/summonerClasses/
summoner-world/src/data/playerElements/
```

### Game Store

The runtime store is built with Zustand and composed from focused modules.

Important files:

```text
summoner-world/src/stores/gameStore.ts
summoner-world/src/stores/game/types.ts
summoner-world/src/stores/game/modules/
```

Current store modules include player, combat, career, missions, economy, and demonlord logic.

### UI

The UI is React-based and centered around `GameShell` plus panels and modal-like screens.

Important files:

```text
summoner-world/src/ui/GameShell.tsx
summoner-world/src/ui/StartScreen.tsx
summoner-world/src/ui/LoginScreen.tsx
summoner-world/src/ui/ResourcePanel.tsx
summoner-world/src/ui/StatAllocationPanel.tsx
```

### World, Creatures, Combat, Missions

The game contains generated worlds, creature generation, automated combat, capture/fusion systems, mission queues, offline progression, dungeons, and activity timers.

Important areas:

```text
summoner-world/src/core/
summoner-world/src/modules/creatures/
summoner-world/src/data/
summoner-world/src/stores/game/modules/
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pikkst/summonrt_world.git
cd summonrt_world/summoner-world
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

The app runs through Vite. Open the local URL printed in the terminal, usually:

```text
http://localhost:5173
```

## Available Scripts

Run these inside `summoner-world/`.

```bash
npm run dev
```

Start the Vite development server.

```bash
npm run typecheck
```

Run TypeScript validation without emitting files.

```bash
npm run lint
```

Run ESLint.

```bash
npm run lint:fix
```

Run ESLint with automatic fixes.

```bash
npm run test
```

Run the Vitest test suite once.

```bash
npm run test:watch
```

Run Vitest in watch mode.

```bash
npm run build
```

Run TypeScript validation and build the production Vite bundle.

```bash
npm run preview
```

Preview the production build locally.

## Development Workflow

This repository uses a `.kilo` AI development framework for task planning, context selection, review, and PR quality.

Agent workflow:

```text
Task
  -> Context Engine
    -> Orchestrator
      -> Implementation
        -> Validation
          -> Final Review / Guardian Pass
            -> Pull Request
```

For each task:

1. Create a new branch.
2. Read `.kilo/README.md` and `.kilo/SYSTEM_MAP.md`.
3. Use Context Engine before loading large context.
4. Implement only the requested scope.
5. Run relevant validation.
6. Create or update task documentation when needed.
7. Complete the final review step before opening a PR.
8. Open one PR per task.

## Documentation

Main documentation areas:

```text
SummonerWorld_Tasks.md
```

Sprint and task breakdown.

```text
docs/Sumoner_World_dec/
```

Design and system documentation.

```text
docs/T6P.*.md
```

Implementation reports for Player Core alignment tasks.

```text
.kilo/
```

AI workflow, task lifecycle, checklists, rules, quality gates, and memory files.

## Validation Expectations

Before merging code changes, run relevant checks from `summoner-world/`:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If a command is not run, document why in the PR.

## AI / Kilo Notes

The `.kilo` framework is part of the repository and should be treated as project infrastructure.

Key expectations:

- Do not load the full project by default.
- Do not create duplicate systems.
- Keep one task per branch and PR.
- Add a final review todo item before PR creation.
- Check UI reachability for player-facing features.
- Check API quality when public types, helpers, data modules, or store signatures change.
- Preserve save/load compatibility when persistent state changes.

## Current Known Direction

Near-term work is focused on Sprint 6+ alignment tasks:

- Player Core completion
- Player statistics and stat allocation
- Skills, talents, titles, achievements, reputation
- Creature contracts and command permissions
- Save/load integration with PlayerCoreState
- Event-driven architecture
- Documentation expansion and quality improvement

## Notes

This repository is an active game prototype. Some legacy paths remain intentionally for backward compatibility while newer Player Core systems are introduced incrementally.

When modifying code, prefer bridge helpers, migration-safe defaults, and focused tests over broad rewrites.
