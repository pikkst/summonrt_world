# Creature AI Bible
## Part 08 — Pack AI (Engineering Specification)

Version: 1.0 Draft

---

# 1. Purpose

Pack AI enables intelligent group behaviour for social creatures. A pack behaves
as a coordinated organism rather than independent units.

Goals:

- Coordinated hunting
- Shared defense
- Shared knowledge
- Leadership hierarchy
- Adaptive teamwork

---

# 2. Pack Hierarchy

```
                Alpha
                  │
        ┌─────────┴─────────┐
        │                   │
     Beta Male         Beta Female
        │                   │
    Hunters          Protectors
        │                   │
     Adults            Juveniles
        │
      Scouts
```

Hierarchy is configurable per species.

---

# 3. Pack Roles

| Role | Responsibilities |
|------|------------------|
| Alpha | Strategic decisions |
| Beta | Execute and coordinate |
| Scout | Exploration & threat detection |
| Hunter | Capture prey |
| Protector | Defend young and weak |
| Juvenile | Learning behaviour |

---

# 4. Leadership Election

Alpha changes only if:

- Alpha dies
- Alpha becomes permanently weak
- Challenge succeeds
- Scripted species event

Election Score:

```
Dominance
+ Experience
+ Health
+ Confidence
+ Loyalty Support
```

---

# 5. Shared Blackboard

Each pack owns a shared blackboard.

Stores:

- Current target
- Pack objective
- Threat level
- Food locations
- Rally position
- Retreat position

Members may cache a local copy.

---

# 6. Communication

Communication events:

- Enemy spotted
- Food discovered
- Alpha command
- Retreat
- Regroup
- Mating season

Each event has:

- Sender
- Priority
- Radius
- Expiration time

---

# 7. Hunting Behaviour

Pipeline

```
Detect Prey
      ↓
Evaluate Risk
      ↓
Assign Roles
      ↓
Approach
      ↓
Ambush
      ↓
Attack
      ↓
Secure Kill
      ↓
Distribute Food
```

---

# 8. Formation System

Supported formations:

- Line
- Circle
- Wedge
- Encirclement
- Defensive Ring

Species choose preferred formations.

---

# 9. Threat Evaluation

Threat Score =

Enemy Level
+ Enemy Count
+ Terrain Modifier
+ Weather Modifier
- Pack Strength

If Threat Score exceeds Retreat Threshold,
the Alpha issues a retreat command.

---

# 10. TypeScript Model

```ts
interface PackState {
    packId: string;
    alphaId: string;
    members: string[];
    objective: string;
    threatLevel: number;
    rallyPoint?: string;
}
```

---

# 11. JSON Example

```json
{
  "pack": {
    "maxMembers": 12,
    "communicationRadius": 60,
    "retreatThreshold": 80,
    "formation": "encirclement"
  }
}
```

---

# 12. Performance Rules

Near player:
- Full coordination

Far away:
- Statistical simulation

Maximum decision interval configurable.

---

# 13. Debug Overlay

Display:

- Current Alpha
- Pack Size
- Objective
- Formation
- Threat Score
- Communication Queue

---

# 14. Test Matrix

✓ Alpha election deterministic

✓ Members follow commands

✓ Food distributed correctly

✓ Pack retreats consistently

✓ Blackboard synchronized

---

# 15. Acceptance Criteria

- Pack AI is deterministic.
- Leadership survives save/load.
- Species-specific configuration only.
- Supports future MMO synchronization.
- No hardcoded pack logic.

End of Part 08.
