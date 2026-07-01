# Architecture Rules

## Root Architecture

All major systems must support this dependency direction:

```text
Player Core
  -> Creature Core
    -> World Core
      -> NPC Core
        -> Economy Core
```

This does not mean lower systems are unimportant. It means every system should answer what it enables the player to do, become, own, command, remember, trade, build, or overcome.

## Mandatory Rules

1. Never duplicate an existing system.
2. Always search for existing implementations before adding new code.
3. Prefer composition over inheritance.
4. Keep modules independently testable.
5. Avoid circular dependencies.
6. Do not create direct cross-system coupling when an event-driven approach is more appropriate.
7. Keep deterministic systems deterministic.
8. Keep offline-first logic compatible with future server authority.
9. Keep save/load compatibility in mind for every gameplay change.
10. Keep MMO compatibility in mind for every persistent gameplay rule.

## Event-Driven Direction

Future and new systems should prefer event-driven boundaries.

Example:

```text
PlayerDefeatedBoss
  -> QuestSystem
  -> WorldMemory
  -> Achievements
  -> Reputation
  -> Economy
  -> DungeonHistory
```

Systems should react to events instead of directly reaching into each other whenever possible.

## Player-First Rule

Before implementing any feature, answer:

```text
What does this enable the player to do, become, own, command, remember, trade, build, or overcome?
```

If the answer is unclear, the implementation is probably not aligned with SummonerWorld.
