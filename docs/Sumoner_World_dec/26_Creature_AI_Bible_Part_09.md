# Creature AI Bible
## Part 09 — Herd AI (Engineering Specification)

Version: 1.0 Draft

---

# 1. Purpose

Herd AI governs the behaviour of herbivores and non-aggressive social species.
The objective is survival through cooperation rather than combat.

---

# 2. Design Philosophy

A herd is not a pack.

Pack AI focuses on coordinated hunting.

Herd AI focuses on:

- survival
- early threat detection
- migration
- protection of juveniles
- resource optimization

---

# 3. Herd Structure

```text
              Elder
                │
      ┌─────────┴─────────┐
      │                   │
  Sentinels          Adult Members
      │                   │
  Juveniles         Mothers
      │
    Newborns
```

Leadership is experience-based rather than dominance-based.

---

# 4. Behaviour Cycle

```text
Graze
  ↓
Observe
  ↓
Drink
  ↓
Socialize
  ↓
Rest
  ↓
Move Herd
  ↓
Repeat
```

---

# 5. Threat Detection

Threat score is calculated from:

ThreatScore =
EnemyStrength
+ DistanceModifier
+ Visibility
+ WindDirection
+ PreviousAttacks

If the score exceeds the panic threshold, the herd immediately switches to Escape Mode.

---

# 6. Panic Propagation

```text
Predator Seen
      │
      ▼
Nearest Sentinel
      │
      ▼
Alarm Broadcast
      │
      ▼
Neighbouring Members
      │
      ▼
Entire Herd
```

Alarm propagation speed depends on species intelligence.

---

# 7. Escape Behaviour

Priority:

1. Protect offspring
2. Stay with herd
3. Avoid cliffs
4. Reach safe biome
5. Regroup

No member intentionally abandons offspring unless survival probability becomes critical.

---

# 8. Migration

Migration considers:

- Season
- Water availability
- Population density
- Food quality
- Temperature
- Predator pressure

Migration routes become reinforced through Memory System.

---

# 9. Herd Cohesion

Every member has a cohesion radius.

Leaving the radius increases stress.

Stress reduces:

- reproduction
- learning
- recovery

---

# 10. JSON Configuration

```json
{
  "herd":{
    "panicThreshold":65,
    "cohesionRadius":30,
    "migrationDistance":250,
    "sentinelCount":3
  }
}
```

---

# 11. TypeScript

```ts
interface HerdState{
  herdId:string;
  leaderId:string;
  cohesion:number;
  panic:number;
  migrationTarget?:string;
}
```

---

# 12. Performance

Near player:
Full simulation.

Far simulation:
Statistical movement and reproduction.

---

# 13. Test Matrix

✓ Panic spreads correctly

✓ Herd regroups after danger

✓ Seasonal migration reproducible

✓ Juveniles remain protected

✓ Save/load preserves herd state

---

# 14. Acceptance Criteria

- Deterministic behaviour
- Configurable thresholds
- Offline compatible
- MMO-ready
- Integrates with Memory, Weather, Territory and World Simulation

End of Part 09.
