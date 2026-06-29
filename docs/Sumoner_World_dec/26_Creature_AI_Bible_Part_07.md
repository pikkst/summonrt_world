# Creature AI Bible
## Part 07 — Learning System (Engineering Specification)

Version: 1.0 Draft

---

# 1. Purpose

The Learning System allows creatures to improve decisions based on previous
outcomes without becoming unpredictable. Learning modifies behaviour weights,
not game rules.

Goals:

- Adapt to player strategies
- Improve survival
- Remember successful tactics
- Avoid repeated failures
- Preserve deterministic simulation

---

# 2. Learning Architecture

```text
Perception
      │
      ▼
 Action Executed
      │
      ▼
 Outcome Analysis
      │
      ├── Success
      ├── Failure
      ├── Neutral
      ▼
 Experience Record
      │
      ▼
 Learning Database
      │
      ▼
 Utility Modifier
      │
      ▼
 Future Decisions
```

---

# 3. Learning Categories

## Combat
- Best attack distance
- Effective abilities
- Dangerous opponents
- Retreat timing

## Exploration
- Safe paths
- Dangerous biomes
- Rich resource locations

## Social
- Trusted allies
- Reliable pack members
- Rival creatures

## Survival
- Food efficiency
- Water availability
- Shelter quality

---

# 4. Experience Record

Every meaningful event creates a learning record.

Fields:

- Timestamp
- Location
- Event Type
- Participants
- Result
- Emotional Weight
- Confidence Score

---

# 5. Confidence Model

Every learned behaviour stores confidence.

Range:

0.0 → Unknown

1.0 → Fully trusted

Example:

Hunting Rabbits

Attempt 1 Success

Confidence = 0.25

Attempt 20 Success

Confidence = 0.93

---

# 6. Failure Analysis

Failures generate corrective learning.

Example

Attack Bear

↓

Death

↓

Increase perceived threat

↓

Future avoidance probability +35%

---

# 7. Reinforcement

Positive outcomes increase:

- Confidence
- Preferred strategy score

Negative outcomes increase:

- Risk awareness
- Alternative strategy search

---

# 8. Forgetting

Old knowledge slowly decays.

Decay depends on:

- Time
- Repetition
- Emotional impact
- Species intelligence

Legendary events never fully disappear.

---

# 9. Learning Limits

Learning cannot create impossible behaviour.

Example:

A herbivore will never learn to eat rocks.

Species constraints always override learning.

---

# 10. TypeScript Model

```ts
interface LearningRecord{
    id:string;
    category:string;
    confidence:number;
    successCount:number;
    failureCount:number;
    lastUpdated:number;
}
```

---

# 11. JSON Example

```json
{
  "learning":{
    "combat":{
      "preferredDistance":4,
      "confidence":0.82
    },
    "exploration":{
      "avoidBiome":"Volcanic Plains"
    }
  }
}
```

---

# 12. Debug Overlay

Display:

- Active Strategy
- Confidence
- Recent Lessons
- Learning Queue
- Memory Links

---

# 13. Performance Rules

Nearby creatures:
Realtime learning.

Far creatures:
Learning batches every simulation cycle.

Maximum learning updates configurable.

---

# 14. Test Matrix

✓ Repeated success increases confidence

✓ Repeated failure decreases preference

✓ Save/Load preserves learned data

✓ Deterministic replay produces identical learning

✓ Multiplayer synchronization preserves confidence values

---

# 15. Acceptance Criteria

- Learning never breaks deterministic simulation.
- Learning data is externally configurable.
- Learning integrates with Memory and Personality.
- Species constraints remain respected.
- Future MMO synchronization supported.

End of Part 07.
