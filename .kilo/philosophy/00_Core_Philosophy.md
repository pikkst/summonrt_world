# 00 - Core Philosophy

## Identity

SummonerWorld is a Strategic Commander Browser RPG.

The player shapes a living world through decisions, while systems execute those decisions through time, simulation, events, and reports.

## Core Loop

```text
Player
  -> Decision
    -> Command
      -> Action
        -> Simulation
          -> Event
            -> Report
              -> World Memory
                -> Player
```

## Design Meaning

The player should not need to manually repeat low-value actions.

The player should make meaningful choices about:

- goals
- priorities
- creatures
- resources
- risk
- time
- strategy
- consequences

## AI Rule

When designing or implementing gameplay, prefer systems that create meaningful decisions and readable outcomes.

Do not create systems that only add repeated clicking without strategy.
