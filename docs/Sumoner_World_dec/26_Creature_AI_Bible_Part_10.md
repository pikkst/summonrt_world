# Creature AI Bible
## Part 10 — Predator AI (Engineering Specification)

Version: 1.0 Draft

---

# 1. Purpose

Predator AI governs hunting species. The objective is maximizing survival while minimizing unnecessary energy expenditure.

---

# 2. Predator Lifecycle

```text
Rest
 ↓
Patrol
 ↓
Detect Prey
 ↓
Evaluate
 ↓
Approach
 ↓
Ambush
 ↓
Attack
 ↓
Consume
 ↓
Recover
```

---

# 3. Hunting Philosophy

Predators should avoid fair fights.

Preferred order:

1. Weak prey
2. Isolated prey
3. Injured prey
4. Young prey
5. Elder prey

Healthy adult prey becomes the last option.

---

# 4. Target Scoring

```
TargetScore =
FoodValue
+ InjuryModifier
+ DistanceModifier
- ThreatModifier
- EnergyCost
```

Highest score becomes current target.

---

# 5. Detection System

Inputs:

- Vision
- Hearing
- Smell
- Recent tracks
- Shared pack knowledge

Detection confidence increases when multiple senses confirm the same target.

---

# 6. Ambush Behaviour

Requirements

- Cover available
- Wind favourable
- Escape route
- Sufficient stamina

Failure immediately triggers re-evaluation.

---

# 7. Chase Algorithm

Stages

Search

↓

Track

↓

Sprint

↓

Maintain Pressure

↓

Capture

↓

Abort

Abort conditions:

- Stamina exhausted
- Target enters safe zone
- Stronger predator appears

---

# 8. Energy Economy

Every action consumes energy.

Priority:

Preserve energy >

Win fight >

Acquire food

Starving predators accept higher risks.

---

# 9. Cooperation

Pack predators share:

- Target
- Position
- Attack timing
- Retreat signal

Only Alpha may cancel a coordinated hunt.

---

# 10. Injured Behaviour

Below configurable health thresholds:

- Avoid unnecessary combat
- Prefer scavenging
- Stay near shelter
- Reduce patrol distance

---

# 11. JSON Configuration

```json
{
  "predator":{
    "preferredPrey":"herbivore",
    "attackRange":4,
    "staminaReserve":20,
    "abortThreshold":15
  }
}
```

---

# 12. TypeScript

```ts
interface PredatorState{
  targetId?:string;
  energy:number;
  confidence:number;
  huntStage:string;
  stamina:number;
}
```

---

# 13. Debug Overlay

Display:

- Current prey
- Target score
- Hunt stage
- Energy
- Confidence
- Abort reason

---

# 14. Test Matrix

✓ Injured prey selected first

✓ Starving predators accept greater risk

✓ Hunts abort correctly

✓ Pack synchronization deterministic

✓ Save/load preserves hunt state

---

# 15. Acceptance Criteria

- Deterministic target selection.
- Configurable scoring.
- Integrates with Memory, Learning, Pack AI and Territory.
- Offline compatible.
- MMO-ready.

End of Part 10.
