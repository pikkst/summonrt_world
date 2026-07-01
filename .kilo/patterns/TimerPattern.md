# Timer Pattern

## Purpose

Use the Timer Pattern when duration, waiting, scheduling, or progress over time matters.

Timers should create planning value, not empty delay.

## Fits

Use for:

- dungeon expeditions
- crafting
- research
- training
- travel
- construction
- settlement upgrades
- cooldowns

## Shape

A Timer should define:

- start time
- duration
- expected completion time
- pause rules
- acceleration rules
- cancellation rules
- completion event

## Rules

- Explain why the timer matters.
- Make timer state save/load compatible.
- Support offline progress when relevant.
- Avoid hidden timers inside UI only.
- Completion should usually create an Event and Report.

## Avoid

- Timers used only as friction.
- Timers that cannot survive reload.
- Timers detached from Action state.
