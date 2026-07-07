# Important Files

## Purpose

This file helps AI agents quickly locate important project files.

Always verify paths with repository search before editing.

## Project Root Documents

- `SummonerWorld_Tasks.md` - active implementation checklist and source of truth for task sequence.
- `SummonerWorld_GDD.md` - game design document.
- `SummonerWorld_TechnicalSpec.md` - technical architecture and implementation direction.

## AI Framework

- `.kilo/brain/README.md` - AI brain reading order.
- `.kilo/rules/00_AI_CONSTITUTION.md` - highest-level AI rules.
- `.kilo/rules/01_GIT_RULES.md` - branch and PR workflow.
- `.kilo/rules/23_MMO_RULES.md` - MMO direction and server-authority rules.
- `.kilo/rules/24_ONLINE_IMPLEMENTATION_CONTRACT.md` - concrete online implementation contract.
- `.kilo/rules/99_FINAL_CHECKLIST.md` - final validation checklist.
- `.kilo/agents/workflow.md` - workflow compliance steward for Kilo Evidence, context routing, checklist, Guardian, and PR gates.
- `.kilo/prompts/README.md` - reusable workflow prompts.
- `.kilo/memory/README.md` - working memory guide.

## Source Code Areas

Likely important source folders:

- `summoner-world/src/core/` - core pure gameplay logic.
- `summoner-world/src/modules/` - system modules.
- `summoner-world/src/stores/` - Zustand state stores.
- `summoner-world/src/data/` - game data and constants.
- `summoner-world/src/types/` - shared TypeScript domain types.
- `summoner-world/src/tests/` or existing test folders - tests.

## Dungeon System

Important current file:

- `summoner-world/src/core/dungeonGenerator.ts`

Known responsibilities:

- Dungeon seeds
- Maze generation
- Floor graph
- Room assignment
- Treasure rooms
- Boss floors
- Environmental hazards
- Boss scaling
- Tower generation
- Safe floors
- Pathfinding

## Combat System

Likely source area:

- `summoner-world/src/modules/combat/`

## Creature System

Likely source areas:

- `summoner-world/src/modules/creatures/`
- `summoner-world/src/data/traitSynergy.ts`
- `summoner-world/src/data/constants.ts`

## Save System

Likely source area:

- `summoner-world/src/modules/save/`

## Online / Server Prototype

Current online-related areas:

- `summoner-world/server/` - current Express/Mongo prototype server.
- `summoner-world/src/stores/game/modules/playerModule.ts` - current login/register/sync calls.
- `summoner-world/src/stores/game/modules/economyModule.ts` - current community/social/trade/guild client calls.

Before expanding online behavior, read:

- `.kilo/rules/24_ONLINE_IMPLEMENTATION_CONTRACT.md`
- `.kilo/checklists/OnlineImplementationChecklist.md`
- `SummonerWorld_TechnicalSpec.md` targeted online section

## Package Commands

Project commands are run from:

```text
summoner-world/
```

Common commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
