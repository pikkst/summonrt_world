# Document Priority

## Purpose

Rank documents by usefulness so the agent reads high-value context first.

## Priority 1 - Always Consider

- `DESIGN_CONSTITUTION.md`
- `.kilo/brain/README.md`
- `.kilo/memory/CurrentTask.md`
- current task or user request
- directly changed source files

## Priority 2 - Task Specific

- relevant `.kilo/agents/*`
- relevant `.kilo/rules/*`
- relevant `.kilo/context/*`
- relevant `.kilo/patterns/*`
- directly related tests

## Priority 3 - Supporting Context

- relevant `.kilo/philosophy/*`
- relevant `.kilo/examples/*`
- relevant `.kilo/checklists/*`
- relevant templates

## Priority 4 - Large Project Docs

Load only relevant sections when possible:

- `SummonerWorld_GDD.md`
- `SummonerWorld_TechnicalSpec.md`
- `SummonerWorld_Tasks.md`
- system bibles

## Priority 5 - Broad Search

Use only when the task remains unclear:

- wider source tree search
- broader documentation search
- older memory or journal files

## Rule

Priority 4 and 5 documents should not be loaded fully unless the task truly needs them.
