# Terminology

## Purpose

Use consistent SummonerWorld terms across code, docs, tasks, and AI-agent output.

## Core Terms

### Player

The human-controlled account/character owner and root actor of the game.

### Summoner

The player's in-world role/class identity as someone who contracts, commands, trains, and progresses with creatures.

### Creature

A living being that can be discovered, contracted, commanded, trained, evolved, fused, remembered, traded, or simulated in the world.

Use `Creature`, not `Monster`, for player-facing companion systems.

### Monster

A hostile or wild combat-facing creature concept.

Use only when the design explicitly means enemy or wild threat behavior.

### Contract

The persistent relationship between a player and a creature.

A contract is stronger and more meaningful than simple ownership.

### Capture

The gameplay action that creates or attempts to create a creature contract.

### Summon

The action of bringing a contracted creature into active gameplay space.

### Fusion

A progression system where eligible parent creatures produce a new offspring creature using documented fusion rules.

### Mutation

A change to an existing creature's traits, genetics, stats, appearance, or abilities.

Mutation is not the same as fusion.

### Evolution

A major progression transformation of a creature.

Evolution should preserve identity more than fusion does.

### World Memory

Persistent world state that records player actions and changes future gameplay.

### Dungeon Tower

The central dungeon structure inside a world.

### Safe Floor

A dungeon floor that supports rest/vendor/teleport utility, usually every 10th floor.

### Demonlord

An end-game title/role owned by the current Floor 100 throne holder.

The Demonlord is not merely an NPC boss; the player can become Demonlord.

### Player Core

The root gameplay aggregate for player-owned identity, progression, systems, and save data.

## Naming Caution

Do not casually rename domain terms.

Changing terms can confuse documentation, code, and AI-agent reasoning.
