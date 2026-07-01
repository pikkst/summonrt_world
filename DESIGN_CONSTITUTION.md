# SummonerWorld Design Constitution

Version: 1.0

Status: Active

This document defines the highest-level design philosophy of SummonerWorld.

Every gameplay system, AI-agent change, feature, refactor, and future expansion must follow these principles.

---

## Article I - Player First

The player is the center of the game.

Every system exists to improve the player's long-term journey.

No feature should exist only because it is technically interesting.

Always ask:

```text
What meaningful choice does this give the player?
```

---

## Article II - Commander RPG

The player is a Summoner.

The player commands.

Creatures execute.

The world reacts.

The player should spend time making strategic decisions instead of repeating manual actions.

---

## Article III - Decision Over Clicking

Meaningful decisions are preferred over repetitive interaction.

Prefer this loop:

```text
Decision
  -> Simulation
    -> Report
```

Avoid this loop when it adds no meaningful strategy:

```text
Click
  -> Click
    -> Click
      -> Click
```

If a gameplay problem can be solved by meaningful player decisions instead of repetitive clicking, prefer the decision-based solution.

---

## Article IV - Time Is Gameplay

Time is a core gameplay mechanic.

Actions may take seconds, minutes, hours, or days.

Waiting is acceptable when:

- anticipation grows
- planning matters
- progress continues
- risk is understandable
- rewards are meaningful

Timers must never exist only to slow players down.

---

## Article V - Everything Is An Action

The game is built around Actions.

Examples:

- Quest
- Dungeon Expedition
- Training
- Research
- Crafting
- Fusion
- Evolution
- Trading
- Travel
- Building
- Settlement Upgrade
- Guild Mission
- World Event

Actions should share a common conceptual model:

- owner
- participants
- location
- requirements
- duration
- risk
- progress
- result
- rewards
- failure consequences
- report

---

## Article VI - Actions Produce Events

Actions create Events.

Events update systems.

Systems react independently.

Avoid hidden cross-system dependencies when an Event boundary would be clearer.

---

## Article VII - Reports Instead Of Interruptions

The player should receive meaningful Reports instead of endless interruptions.

Reports should:

- summarize what happened
- explain rewards and losses
- show important decisions and consequences
- tell a short story when appropriate
- preserve useful history

A report inbox is preferred over constant modal interruption.

---

## Article VIII - The World Remembers

The world remembers important events.

NPCs remember.

Settlements remember.

Creatures remember.

Guilds remember.

Dungeon history remembers.

The player's actions permanently shape world state, reputation, economy, ecology, and future opportunities.

---

## Article IX - Living Simulation

The world continues existing while the player is doing something else.

NPCs work.

Merchants trade.

Creatures migrate.

Settlements grow.

Research continues.

Construction progresses.

The player is part of the world, not the entire world.

---

## Article X - Offline First

Core gameplay must function without internet access.

Networking must never become a requirement for core progression, save/load, combat, dungeon traversal, creature management, or world simulation.

---

## Article XI - MMO Ready

Architecture must support future multiplayer.

Do not design systems that require complete rewrites before multiplayer becomes possible.

Important future online state must be designed with validation, auditability, and authority boundaries in mind.

---

## Article XII - Single Source Of Truth

Every system owns its own data.

Avoid duplicated ownership.

Avoid duplicated gameplay rules.

Avoid duplicated progression state.

If two systems need the same fact, use a shared source, a derived value, or an event-driven update.

---

## Article XIII - Event Driven

When multiple systems need to react to the same gameplay fact, prefer Events over direct coupling.

Example:

```text
DungeonBossDefeated
  -> Quest progress
  -> Achievement check
  -> Reputation update
  -> World memory update
  -> Statistics update
```

---

## Article XIV - AI Design Rule

When implementing or reviewing a feature, AI agents must ask:

```text
Is this increasing player decisions, or only increasing player clicks?
```

Choose the solution with more meaningful decisions.

---

## Article XV - Long-Term Progression

SummonerWorld is designed to be played for months or years.

Progression should feel meaningful over long periods.

Short-term excitement must never damage long-term depth.

---

## Final Principle

SummonerWorld is not an Action RPG.

SummonerWorld is not a Clicker.

SummonerWorld is not a passive Idle Game.

SummonerWorld is a Strategic Commander Browser RPG where the player shapes a living world through meaningful decisions, while simulation, time, creatures, and world systems execute those decisions and return meaningful reports.
