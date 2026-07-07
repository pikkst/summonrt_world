# Agent Selection

## Purpose

Select the smallest useful set of specialist agents for a task.

## Rule

Use one primary agent.

Add supporting agents only when the task requires their expertise.

## Primary Agent Examples

```text
Combat task      -> combat agent
Dungeon task     -> dungeon agent
Player task      -> player agent
Creature task    -> creature agent
World task       -> world agent
Economy task     -> economy agent
UI task          -> frontend agent
Docs task        -> documentation agent
Architecture     -> architect agent
Testing task     -> qa agent
Review task      -> reviewer agent
Kilo workflow    -> workflow agent
```

## Supporting Agent Triggers

Add architect when:

- multiple systems are affected
- ownership is unclear
- save/load changes
- new core module is proposed

Add QA when:

- tests must be added or changed
- bug fix needs regression protection
- simulation or generation behavior changes

Add documentation when:

- GDD, TechnicalSpec, task status, or `.kilo` docs must change

Add backend when:

- persistence, database, online play, trade, or MMO compatibility is involved

Add workflow when:

- a task will be committed, pushed, or opened as a PR
- Kilo Workflow Evidence is missing or incomplete
- context loading looks too broad for the task
- `.kilo`, prompts, templates, rules, checklists, or agent files are changed
- ReviewPipeline, checklists, or GuardianGate status is uncertain

## Avoid

- Invoking every agent for small tasks.
- Using council-style review for a typo.
- Letting a support agent expand task scope.
- Letting workflow review replace domain review for architecture, gameplay, UI, backend, or testing concerns.
