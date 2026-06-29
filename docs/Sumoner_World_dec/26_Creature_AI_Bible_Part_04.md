# Creature AI Bible
## Part 04 — Behaviour Tree Architecture

**Version:** 1.0 Draft

---

# 1. Purpose

Behaviour Trees (BT) define *how* a creature executes the goal selected by the Decision Engine.

The Decision Engine answers:

> "What should I do?"

The Behaviour Tree answers:

> "How should I do it?"

---

# 2. Design Principles

- Modular nodes
- Reusable behaviours
- Deterministic execution
- Interruptible
- Data-driven
- Debuggable

---

# 3. Architecture

```text
Decision Engine
        │
        ▼
 Selected Goal
        │
        ▼
 Behaviour Tree
        │
        ├── Sequence
        ├── Selector
        ├── Decorator
        ├── Condition
        └── Action
```

---

# 4. Node Types

## Root
Single entry point.

## Selector

Chooses the first successful child.

Example:

Enemy visible?

YES → Attack

NO → Continue patrol

---

## Sequence

Executes children in order.

Example

Locate Water

↓

Walk To Water

↓

Drink

↓

Return Success

---

## Decorator

Changes node behaviour.

Examples

- Repeat
- Cooldown
- Timeout
- Inverter
- Probability Gate

---

## Condition

Read-only checks.

Examples

- Hunger > 50
- Health < 30%
- Enemy Visible
- Territory Invaded
- Night Time

---

## Action

Performs work.

Examples

- Move
- Attack
- Sleep
- Eat
- Drink
- Call Pack
- Patrol

---

# 5. Execution Rules

Behaviour Trees execute from the Root every AI tick.

Only one Action node may execute at a time.

Conditions never modify world state.

Actions are the only nodes allowed to modify the simulation.

---

# 6. Example Tree

```text
ROOT
│
└── Selector
    ├── Escape Danger
    ├── Heal
    ├── Hunt Food
    ├── Drink
    ├── Defend Territory
    ├── Socialize
    └── Wander
```

---

# 7. Tick Scheduler

High Priority
- Combat
- Escape

Normal
- Hunting
- Patrol

Low
- Exploration
- Idle animations

Far-away creatures use simplified Behaviour Trees.

---

# 8. Debug Requirements

Every node must expose:

- Current Status
- Last Execution Time
- Execution Count
- Average Runtime
- Failure Reason

---

# 9. TypeScript Interfaces

```ts
interface BehaviourNode {
    id: string;
    type: string;
    tick(context: AIContext): NodeResult;
}

interface AIContext {
    creatureId: string;
    health: number;
    hunger: number;
    fear: number;
}
```

---

# 10. Acceptance Criteria

- Tree execution deterministic.
- No infinite loops.
- Maximum execution budget configurable.
- Trees reloadable from JSON.
- Multiplayer compatible.

End of Part 04.
