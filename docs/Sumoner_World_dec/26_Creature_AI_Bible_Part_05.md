# Creature AI Bible
## Part 05 — Memory System

**Version:** 1.0 Draft

---

# 1. Purpose

Memory allows creatures to adapt over time instead of reacting only to the current situation.

A creature remembers:
- places
- allies
- enemies
- food
- danger
- successful actions
- failed actions

Memory directly influences decision making, personality development, and long-term survival.

---

# 2. Memory Architecture

```text
Perception
    │
    ▼
Short-Term Memory
    │
    ▼
Evaluation
    │
    ├── Forget
    ├── Reinforce
    └── Promote
           │
           ▼
Long-Term Memory
```

---

# 3. Memory Categories

## Short-Term Memory
Duration: seconds to minutes.

Examples:
- Current target
- Last sound
- Nearby predator
- Recent damage

## Long-Term Memory
Duration: persistent across saves.

Examples:
- Home territory
- Safe watering holes
- Dangerous caves
- Trusted pack members

## Episodic Memory
Stores important events.

Examples:
- Defeated by player
- Lost offspring
- Survived wildfire
- Defeated alpha

## Semantic Memory
Knowledge accumulated over time.

Examples:
- Fire hurts
- Wolves hunt together
- River freezes in winter

---

# 4. Memory Reinforcement

Each memory has a strength value.

0.0 = forgotten

1.0 = permanent

Repeated experiences strengthen memories.

Positive outcomes increase confidence.

Negative outcomes increase caution.

---

# 5. Memory Decay

Memories decay over time.

Decay speed depends on:
- Importance
- Personality
- Species
- Repetition
- Emotional intensity

Traumatic memories decay slowly.

Routine memories decay quickly.

---

# 6. Emotional Memory

Every important event stores emotional metadata.

Examples:

- Fear
- Joy
- Anger
- Curiosity
- Trust

Future decisions receive modifiers based on these emotions.

---

# 7. Territory Memory

Creatures remember:

- Nest
- Home
- Food routes
- Water sources
- Predator locations
- Safe shelters

Migration updates territory memory dynamically.

---

# 8. Social Memory

Stores:

- Pack hierarchy
- Friends
- Rivals
- Mates
- Parents
- Offspring

Social memories influence cooperation and breeding.

---

# 9. Memory Sharing

Pack members may exchange memories.

Examples:

- Predator spotted
- Rich food source
- Safe migration route

Knowledge spreads naturally through the ecosystem.

---

# 10. Save Format

```json
{
  "memory":{
    "territories":[],
    "threats":[],
    "foodSources":[],
    "relationships":[],
    "episodes":[]
  }
}
```

---

# 11. TypeScript

```ts
interface MemoryRecord{
    id:string;
    type:string;
    importance:number;
    strength:number;
    created:number;
    lastAccess:number;
}
```

---

# 12. Acceptance Criteria

- Memories persist after saving.
- Reinforcement is deterministic.
- Memory sharing is configurable.
- Memory decay is data-driven.
- Maximum memory size configurable.
- Supports offline and future MMO synchronization.

End of Part 05.
