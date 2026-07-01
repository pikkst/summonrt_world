# Gameplay Decisions

## Purpose

This file summarizes important gameplay direction for AI agents.

Use it as a quick memory aid, but verify implementation details in the main design documents.

## Player-First Game Identity

SummonerWorld is centered on the player as a Summoner.

Creatures, dungeons, worlds, NPCs, quests, and economy systems should all support player agency and long-term progression.

## Creature Contracts

Creature ownership should move toward contracts rather than simple possession.

Contracts support future systems such as:

- Bond
- Loyalty
- Trust
- Contract stability
- Trade permission
- PvP eligibility
- Breeding/fusion permissions

## Dungeon Progression

Dungeons are world progression structures, not random side content only.

Dungeon towers support:

- Progression gates
- Boss milestones
- Rare rewards
- Safe floors
- Dungeon history
- Demonlord throne loop

## Demonlord End Game

The Demonlord system is a player-facing end-game cycle.

The player can defeat the Demonlord, become Demonlord, manage influenced floors, and later be challenged by others.

## World Memory

Worlds should remember player actions and use that memory to affect future gameplay.

Examples:

- Boss defeated
- Dungeon cleared
- Forest damaged
- Creature protected
- Economy changed
- Settlement grown
- Reputation gained

## Economy Direction

The economy should eventually become supply/demand driven and connected to players, NPCs, settlements, crafting, housing, travel, and marketplace systems.

## MMO Direction

Offline prototype first.

MMO compatibility always.

Future server-authoritative systems should validate:

- Currency
- Inventory
- Trades
- Marketplace
- PvP
- Guild bank
- Demonlord challenges
