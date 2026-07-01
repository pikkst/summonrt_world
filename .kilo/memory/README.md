# Kilo Memory

This folder contains working memory for AI coding agents working on SummonerWorld.

Unlike `.kilo/brain`, which describes the stable project identity, and `.kilo/rules`, which defines behavior rules, this folder tracks project state that changes over time.

## Purpose

Use this folder to help agents understand:

- Current sprint
- Current task
- Completed work
- Known issues
- Architecture decisions
- Important files
- Terminology
- Coding patterns
- Gameplay decisions
- Future ideas
- AI work history

## Reading Order

Before starting a new task, read:

1. `.kilo/brain/README.md`
2. Relevant `.kilo/rules` files
3. `.kilo/memory/CurrentSprint.md`
4. `.kilo/memory/CurrentTask.md`
5. `.kilo/memory/CompletedTasks.md`
6. `.kilo/memory/KnownIssues.md`
7. `.kilo/memory/ArchitectureDecisions.md`
8. `.kilo/memory/ImportantFiles.md`
9. Relevant prompt from `.kilo/prompts`
10. `SummonerWorld_Tasks.md`

## Maintenance Rule

Memory files must remain short, useful, and truthful.

Do not use memory files as a replacement for proper documentation.

If a memory entry becomes permanent architecture, move or copy it into the correct documentation file.
