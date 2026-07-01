# Report Pattern

## Purpose

Use the Report Pattern to return meaningful outcomes to the player after Actions, simulations, or important events.

Reports are player-facing summaries, not raw logs.

## Fits

Use for:

- dungeon expedition result
- combat summary
- quest completion
- crafting result
- research completion
- travel outcome
- fusion result
- settlement update
- world event result

## Shape

A Report should define:

- report id
- report type
- owner id
- title
- summary
- timeline
- important events
- rewards
- losses
- statistics
- unlocked options
- recommended next actions
- created time
- read/unread state

## Rules

- Reports should explain what happened and why it matters.
- Reports should be readable and concise.
- Reports should not expose raw internal state unless useful.
- Reports may reference Events.
- Reports should support an inbox or archive.

## Avoid

- Endless modal interruptions.
- Raw debug logs as player-facing reports.
- Reward popups with no context.
