# Kilo Patterns

This folder defines preferred architecture patterns for SummonerWorld AI-assisted development.

Patterns describe reusable solution shapes. They are not mandatory code templates, but AI agents should prefer them over one-off systems.

## Required Reading

Before using these patterns, read:

1. `DESIGN_CONSTITUTION.md`
2. `.kilo/philosophy/README.md`
3. Relevant `.kilo/rules` files
4. The pattern file that matches the task

## Pattern Index

- `ActionPattern.md` - long-running gameplay work units.
- `CommandPattern.md` - player or system intent before validation.
- `EventPattern.md` - cross-system gameplay facts.
- `ReportPattern.md` - player-facing outcome summaries.
- `SimulationPattern.md` - deterministic execution between decision and report.
- `QueuePattern.md` - ordered pending work.
- `TimerPattern.md` - duration and progress handling.
- `StateMachinePattern.md` - controlled lifecycle states.
- `ValidationPattern.md` - input and rule validation.
- `SavePattern.md` - persistence and migration-safe structures.
- `RepositoryPattern.md` - future persistence abstraction.
- `AggregatePattern.md` - ownership boundaries.
- `StrategyPattern.md` - interchangeable gameplay strategies.
- `FactoryPattern.md` - controlled object creation.
- `MemoryPattern.md` - world/player/NPC memory updates.
- `WorldGenerationPattern.md` - deterministic procedural generation.

## Rule

Before creating a new architecture shape, check whether an existing pattern fits.
