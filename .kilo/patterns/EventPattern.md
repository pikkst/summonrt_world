# Event Pattern

## Purpose

Use the Event Pattern when an important gameplay fact has happened and multiple systems may need to react.

Events describe facts, not wishes.

## Fits

Use for:

- quest completed
- dungeon floor cleared
- boss defeated
- creature contracted
- item crafted
- structure built
- reputation changed
- world memory changed

## Shape

An Event should define:

- event id
- event type
- source system
- actor id when relevant
- target ids when relevant
- world or location context
- game time
- compact payload

## Flow

```text
Action Result
  -> Event
    -> Subscribers React
      -> Memory / Progress / Report Updates
```

## Rules

- Events should use clear past-tense names.
- Events should be typed.
- Events should be replayable when important.
- Event payloads should be compact.
- Handler order should be explicit if order matters.

## Avoid

- Vague event names.
- Huge payloads with unrelated objects.
- Hidden cross-system mutation without an Event.
