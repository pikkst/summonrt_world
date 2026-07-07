# Context Bundles

Use these bundles to select context quickly. Pick one primary bundle and add only what the task proves is needed.

## Core Bundle

Use for any implementation task:

- `AGENTS.md`
- `.kilo/START_HERE.md`
- `.kilo/SYSTEM_MAP.md`
- `SummonerWorld_Tasks.md` task entry

## Docs or Kilo Workflow

Use for `.md`, `.kilo`, prompt, checklist, or agent-rule updates:

- `.kilo/README.md`
- `.kilo/SYSTEM_MAP.md`
- `.kilo/context_engine/ContextBudget.md`
- `.kilo/context_engine/ContextStopRules.md`
- `.kilo/agents/workflow.md`
- target `.kilo` files

Usually Lean Mode.

## World

- `.kilo/agents/world.md`
- `.kilo/rules/18_WORLD_RULES.md`
- `.kilo/context/WorldFlow.md`
- `.kilo/patterns/WorldGenerationPattern.md`
- related `summoner-world/src/core` and tests

## Dungeon

- `.kilo/agents/dungeon.md`
- `.kilo/rules/21_DUNGEON_RULES.md`
- `.kilo/context/DungeonFlow.md`
- `.kilo/patterns/WorldGenerationPattern.md`
- `summoner-world/src/core/dungeonGenerator.ts`
- related dungeon tests

## Combat

- `.kilo/agents/combat.md`
- `.kilo/rules/20_COMBAT_RULES.md`
- `.kilo/context/CombatFlow.md`
- related combat core/modules/tests

## Player

- `.kilo/agents/player.md`
- `.kilo/rules/17_PLAYER_RULES.md`
- `.kilo/context/PlayerFlow.md`
- `.kilo/patterns/AggregatePattern.md`
- related player store/types/tests

## Creature

- `.kilo/agents/creature.md`
- `.kilo/rules/16_CREATURE_RULES.md`
- `.kilo/context/CreatureFlow.md`
- related creature data/core/tests

## Event System

- `.kilo/rules/15_EVENT_SYSTEM_RULES.md`
- `.kilo/context/EventFlow.md`
- `.kilo/patterns/EventPattern.md`
- `.kilo/philosophy/10_Event_Driven.md` only when design reasoning is needed

## Save or Persistence

- `.kilo/rules/22_SAVE_SYSTEM_RULES.md`
- `.kilo/context/SaveFlow.md`
- `.kilo/patterns/SavePattern.md`
- `.kilo/checklists/SaveSystemChecklist.md`
- TechnicalSpec section found by targeted search

Usually Deep Mode.

## Online or MMO

Use for online, account, cloud save, social, trade, party, guild, PvP, marketplace, dungeon party sync, or server-authoritative work:

- `.kilo/rules/23_MMO_RULES.md`
- `.kilo/rules/24_ONLINE_IMPLEMENTATION_CONTRACT.md`
- `.kilo/rules/08_SECURITY_RULES.md`
- `.kilo/rules/14_DATABASE_RULES.md`
- `.kilo/checklists/OnlineImplementationChecklist.md`
- `.kilo/agents/backend.md`
- `SummonerWorld_TechnicalSpec.md` section found by targeted search
- related server, service, store, and test files

Always Deep Mode.

## Frontend

- `.kilo/agents/frontend.md`
- `.kilo/rules/12_REACT_RULES.md`
- relevant UI source files
- relevant tests

## Testing

- `.kilo/agents/qa.md`
- `.kilo/rules/04_TESTING_RULES.md`
- `.kilo/checklists/TestingChecklist.md`
- existing related tests

## PR Review

- `.kilo/orchestrator/ReviewPipeline.md`
- relevant checklist
- `.kilo/rules/99_FINAL_CHECKLIST.md`
- `.kilo/guardian/GuardianGate.md`
- `.kilo/agents/workflow.md`

Use only before PR readiness or when explicitly reviewing work.
