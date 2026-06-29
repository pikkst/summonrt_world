# Creature AI Bible
## Part 1 — AI Philosophy & Architecture
**Version:** 1.0
**Status:** Draft
**Project:** SummonerWorld

---

# 1. Purpose

The Creature AI system is designed to create living creatures instead of scripted enemies.

Every creature should:
- survive
- reproduce
- defend territory
- cooperate
- learn
- remember
- evolve

The player should feel that every creature exists even when it is not visible.

---

# 2. Design Goals

1. Offline-first.
2. MMO-ready.
3. Fully deterministic.
4. Data-driven.
5. Easy to extend.
6. Modular.

---

# 3. AI Layers

Layer 1
- Basic survival

Layer 2
- Needs

Layer 3
- Personality

Layer 4
- Social behaviour

Layer 5
- Tactical combat

Layer 6
- Learning

Layer 7
- World interaction

---

# 4. Core Principles

## Living World

Creatures continue living even when the player leaves.

## Local Simulation

Only nearby creatures are fully simulated.

Distant creatures use statistical simulation.

---

# 5. State Machine

Possible states

- Idle
- Roaming
- Searching
- Hunting
- Eating
- Drinking
- Sleeping
- Escaping
- Defending
- Attacking
- Socializing
- Breeding
- Migrating
- Dead

Allowed transitions must be defined through a centralized transition table.

---

# 6. AI Update Model

Priority order

1. Immediate danger
2. Health
3. Hunger
4. Thirst
5. Sleep
6. Territory
7. Social
8. Curiosity
9. Exploration

---

# 7. Data Model (TypeScript)

```ts
interface CreatureAIState {
    currentState: AIState;
    hunger: number;
    thirst: number;
    fatigue: number;
    fear: number;
    aggression: number;
    curiosity: number;
    loyalty: number;
    territoryId?: string;
}
```

---

# 8. Acceptance Criteria

- Every creature always has exactly one active AI state.
- State transitions are deterministic.
- AI runs offline and online.
- All AI parameters are configurable.
- No hardcoded creature-specific logic.

---

# 9. Current Integration

This Bible must integrate with:

- Game Design Document
- Technical Specification
- Master Roadmap

Current implementation progress:
- Sprint 6 active
- Current task: T6.4.4 Dungeon Room Assignment System

End of Part 1.
