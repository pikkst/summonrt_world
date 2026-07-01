# Project Identity

## Project Name

SummonerWorld

## Core Genre

Browser-based Summoner RPG with creature collection, world shaping, dungeon progression, economy systems, and a long-term path toward MMORPG infrastructure.

## Core Identity

SummonerWorld is a player-first Summoner RPG.

It is not a standalone creature simulator.
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
