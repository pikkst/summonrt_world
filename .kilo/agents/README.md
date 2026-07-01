# Kilo Agents

This folder defines specialized AI-agent roles for SummonerWorld development.

Each agent role describes:

- responsibility area
- required reading
- allowed work
- forbidden work
- validation expectations
- when to hand work to another role

## Agent Index

- `architect.md` - architecture and system boundaries.
- `frontend.md` - React UI and accessibility.
- `backend.md` - future backend and server-authority concerns.
- `player.md` - Player Core and player-owned state.
- `creature.md` - creature, contracts, fusion, genetics.
- `combat.md` - combat formulas, boss mechanics, battle tests.
- `dungeon.md` - dungeon generation, tower flow, pathfinding.
- `world.md` - world generation, memory, ecology, travel.
- `npc.md` - NPC identity, schedules, shops, quests.
- `economy.md` - economy, markets, supply, demand.
- `qa.md` - tests, regression, validation.
- `reviewer.md` - PR and code review.
- `documentation.md` - docs, tasks, specs, memory.

## Prime Rule

Use one primary agent role per task.

If a task crosses many systems, start with the architect role and split work into smaller PRs.
