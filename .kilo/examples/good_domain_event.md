# Good Domain Event Example

## Purpose

Domain events should describe meaningful gameplay facts.

## Recommended Shape

A good event should:

- Use a clear past-tense name.
- Include typed payload fields.
- Include relevant entity ids.
- Avoid sending entire unrelated objects.
- Be replayable in tests when important.

## Example

Event name:

DungeonFloorCleared

Payload fields:

- playerId
- worldIndex
- floorIndex
- dungeonRunId
- clearedRoomCount
- gameTime

## Good Consumers

Systems that may react:

- quest system
- achievements
- world memory
- reputation
- statistics

## Why This Is Good

- The event is a gameplay fact.
- The payload is compact.
- Other systems can react without direct coupling.
