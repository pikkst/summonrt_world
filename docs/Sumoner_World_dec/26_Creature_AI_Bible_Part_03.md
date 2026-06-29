# Creature AI Bible
## Part 03 — Decision Engine (Utility AI + GOAP)

**Version:** 1.0 Draft

---

# 1. Purpose

The Decision Engine is responsible for selecting the most appropriate action every AI update cycle.

Unlike scripted NPCs, creatures evaluate their internal state, the surrounding environment, and long-term goals before acting.

---

# 2. Design Goals

- Fully deterministic
- Data-driven
- Offline compatible
- MMO compatible
- Extensible without engine changes

---

# 3. Decision Pipeline

```
Perception
    ↓
Memory Update
    ↓
Need Evaluation
    ↓
Goal Selection
    ↓
Action Planning
    ↓
Validation
    ↓
Execution
    ↓
Learning
```

---

# 4. Utility AI

Every possible action receives a score.

```
Score =
NeedWeight
× PersonalityModifier
× ContextModifier
× MemoryModifier
× RandomVariance
```

RandomVariance should remain low (±3%) to avoid chaotic behaviour.

---

# 5. Available Goals

## Survival
- Escape
- Heal
- Eat
- Drink

## Social
- Join Pack
- Protect Alpha
- Find Mate

## Territory
- Patrol
- Defend
- Expand

## Exploration
- Discover Area
- Investigate Noise
- Search Resources

## Combat
- Ambush
- Attack
- Retreat
- Call Allies

---

# 6. GOAP Planner

Every action declares:

- Preconditions
- Effects
- Cost
- Estimated Risk
- Estimated Reward

Example:

Action:
Hunt Deer

Preconditions
- Hunger > 40
- Deer Visible

Effects
- Hunger -60
- Risk +10

---

# 7. Blackboard System

Shared information available to all AI modules.

Stores:

- Last Enemy
- Last Food Source
- Territory Center
- Current Goal
- Current Target
- Pack Leader
- Safe Location

---

# 8. Interrupt Rules

Current actions may be interrupted when:

- Predator appears
- Health below threshold
- Pack leader calls
- World event begins

Interrupts always restart goal evaluation.

---

# 9. Performance Budget

Nearby creatures:
100% simulation.

Medium distance:
Simplified planning.

Far distance:
Statistical simulation only.

---

# 10. TypeScript Example

```ts
interface DecisionContext {
    visibleEnemies:number;
    visibleFood:number;
    hunger:number;
    health:number;
    fear:number;
    territoryThreat:number;
}
```

---

# 11. Acceptance Criteria

- Every decision reproducible from the same seed.
- Goal selection deterministic.
- Planner configurable using JSON.
- Supports future multiplayer synchronization.
- Average decision time < 1 ms.

End of Part 03.
