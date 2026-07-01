# Project Identity

## Project Name

SummonerWorld

## Core Genre

Strategic Commander Browser RPG with creature contracts, world shaping, dungeon progression, economy systems, time-based Actions, simulation Reports, and a long-term path toward MMORPG infrastructure.

## Highest Design Source

`DESIGN_CONSTITUTION.md` defines the highest-level design identity of SummonerWorld.

## Core Identity

SummonerWorld is a player-first Strategic Commander Browser RPG.

It is not a standalone creature simulator.
It is not an action RPG.
It is not a clicker.
It is not a passive idle game.

The player is a Summoner who makes meaningful strategic decisions.
Creatures execute commands.
The world simulates outcomes.
Reports return results to the player.
World Memory preserves consequences.

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

## Architectural Center

Creatures are important, but the player journey is the center of the architecture.

```text
Player
  -> Summoner
    -> Creatures
      -> World
```

## Long-Term Game Goal

The player creates a permanent Summoner, grows across 100 worlds, forms creature contracts, builds wealth and reputation, clears dungeon towers, and eventually reaches Floor 100 to challenge the Demonlord.

If the player defeats the Demonlord, the player becomes the new Demonlord and gains floor manager powers until another eligible challenger defeats them.

## Technical Stack

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- Vitest
- Offline-first prototype
- Future online architecture with server authority

## Current Development Philosophy

Build the offline prototype correctly first.
Keep all systems MMO-compatible.
Prefer deterministic simulation and auditable state changes.
Keep the player as the root aggregate for future save/load and online synchronization.
Prefer meaningful decisions over repetitive clicking.
Use Actions, Events, Reports, and World Memory as recurring design concepts.
