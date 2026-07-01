# Forbidden Loading

## Purpose

Prevent unnecessary token usage.

## Do Not Load By Default

Do not load these fully at task start:

- entire `.kilo` folder
- entire source tree
- entire GDD
- entire Technical Spec
- entire task file
- all rules
- all patterns
- all agents
- all examples
- all memory files

## Preferred Alternative

Instead load:

- one relevant section
- one relevant rule
- one relevant agent
- one relevant pattern
- one relevant source folder
- one relevant test file

## Rule

Large documents are not forbidden forever.

They are forbidden as default initial context.

Load them only when the task requires broad design or architecture review.
