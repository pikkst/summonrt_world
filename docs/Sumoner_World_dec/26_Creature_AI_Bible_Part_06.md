# Creature AI Bible
## Part 06 — Personality System (Extended Engineering Specification)

Version: 1.0 Draft

---

# 1. Purpose

The Personality System gives every creature a persistent identity that influences
decision making throughout its lifetime. Personality is not cosmetic—it changes
combat, exploration, social behaviour, breeding, learning, migration and
resource gathering.

---

# 2. Design Objectives

- Deterministic
- Data-driven
- Persistent across saves
- Evolves through gameplay
- Compatible with offline simulation
- MMO-ready

---

# 3. Personality Architecture

```
Genetics
     |
Environment
     |
Life Events
     |
Memory
     |
Mood
     |
Personality
     |
Decision Engine
     |
Behaviour Tree
```

---

# 4. Core Traits

| Trait | Range | Description |
|-------|------:|-------------|
| Aggression | 0-100 | Likelihood of initiating combat |
| Courage | 0-100 | Ability to resist fear |
| Curiosity | 0-100 | Desire to investigate |
| Loyalty | 0-100 | Commitment to pack |
| Intelligence | 0-100 | Planning quality |
| Patience | 0-100 | Ability to wait |
| Discipline | 0-100 | Goal consistency |
| Greed | 0-100 | Loot preference |
| Compassion | 0-100 | Helps allies |
| Dominance | 0-100 | Alpha potential |

---

# 5. Trait Sources

## Genetics
40%

## Environment
20%

## Learning
20%

## Major Life Events
20%

Example:
Winning many battles slowly increases Courage.
Repeated starvation reduces Patience.

---

# 6. Mood vs Personality

Personality is stable.

Mood is temporary.

Mood examples:
- Happy
- Angry
- Scared
- Tired
- Excited
- Lonely

Mood modifies personality rather than replacing it.

Example:

Aggression 60

Angry +20

Final Combat Aggression = 80

---

# 7. Relationship Matrix

Every creature stores relationship values.

Friend ........ +100
Neutral ......... 0
Enemy ........ -100

Relationship categories:
- Parent
- Offspring
- Alpha
- Rival
- Mate
- Ally
- Stranger

---

# 8. Decision Modifiers

Aggressive:
- prefers attack
- explores dangerous areas

Cowardly:
- avoids unknown zones
- retreats earlier

Curious:
- investigates sounds
- discovers hidden locations

Loyal:
- protects pack
- shares food

---

# 9. Data Flow

Perception
↓
Memory Update
↓
Mood Update
↓
Trait Modifiers
↓
Need Evaluation
↓
Utility AI
↓
Behaviour Tree
↓
Action

---

# 10. Configuration Example

```json
{
  "species":"Fire Wolf",
  "personality":{
    "aggression":62,
    "curiosity":38,
    "loyalty":77,
    "discipline":54,
    "courage":71
  }
}
```

---

# 11. TypeScript Model

```ts
interface PersonalityProfile{
    aggression:number;
    courage:number;
    curiosity:number;
    loyalty:number;
    intelligence:number;
    patience:number;
    discipline:number;
    greed:number;
    compassion:number;
    dominance:number;
}
```

---

# 12. Balancing Rules

- No single trait guarantees victory.
- Traits must create behavioural diversity.
- Species defaults are configurable.
- Individual variation is mandatory.

---

# 13. Debug Overlay

Display:
- Current Mood
- Active Goal
- Trait Scores
- Current Utility Score
- Current Behaviour Tree
- Last Decision
- Memory Count

---

# 14. Performance Budget

Nearby creatures:
Full personality simulation.

Far creatures:
Statistical updates every few simulation ticks.

---

# 15. Unit Tests

- Trait generation deterministic.
- Mood decay verified.
- Relationship updates deterministic.
- Save/Load preserves personality.
- Multiplayer synchronization stable.

---

# 16. Acceptance Criteria

✓ Every creature owns a persistent personality profile.
✓ Personality affects every major AI subsystem.
✓ Traits configurable from external JSON.
✓ No hard-coded species behaviour.
✓ Fully compatible with future MMO architecture.

End of Part 06.
