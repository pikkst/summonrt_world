# 20 - Combat Rules

## Combat Philosophy

Combat should be fast to read and deep to master.

Combat must support player decisions, creature strategy, elemental mastery, dungeon pressure, boss mechanics, PvP expansion, and future MMO validation.

## Combat Flow

The core combat flow should remain understandable:

```text
Encounter
  -> Initiative
  -> Skill / Command Selection
  -> Creature Actions
  -> Damage and Status Resolution
  -> Rewards / Consequences
```

## Player Command Rule

The player is the summoner and should express tactical intent.

Creatures execute actions based on:

- Command
- Skill availability
- Loyalty
- Training
- Personality
- Current state
- Enemy state
- Environmental hazards

## Damage Formula Rule

Combat formulas must be explicit, testable, and documented.

Current Sprint 6 damage direction:

```text
damage = (ATK - DEF * 0.5) * elementalFactor + random(-2..+2)
```

Do not change formulas silently.

If formula behavior changes, update tests and documentation.

## Damage Types

Combat may support:

- Physical
- Magical
- Elemental
- True Damage

Damage type behavior should be data-driven when practical.

## Status Effects

Status effects may include:

- Burn
- Freeze
- Poison
- Shock
- Blind
- Silence
- Fear
- Bleeding

Status effects should have clear duration, stacking rules, and save/load behavior when persistent across turns or missions.

## Element Rule

Elements affect combat.

Elemental interactions should be consistent with the element system and not duplicated in unrelated files.

## Boss Rule

Boss mechanics should support:

- HP threshold phases
- Elemental shifts
- Environmental hazards
- Signature abilities
- Weakness discovery
- Scan ability
- Wrong-guess damage penalties
- Career and summoner bonuses when implemented

## Scan Rule

Boss weakness discovery should be meaningful.

The Scan ability should reveal or validate weaknesses according to documented rules.

Wrong guesses may apply penalties such as reduced damage for a limited duration.

## Automated Combat Rule

Automated combat must be deterministic when used for timed missions or offline catch-up.

Automated combat should produce:

- Victory/defeat result
- Turn-by-turn battle log
- Rewards
- XP
- State changes

## PvP Rule

Future PvP combat must be server-authoritative.

Client-side combat previews may exist, but authoritative PvP results must be validated by the server.

## Testing Requirements

Combat features should test:

- Damage formula
- Elemental modifiers
- Status effects
- Boss phases
- Scan effects
- Automated combat victory/defeat
- Reward calculation
- Deterministic mission combat where required

## Forbidden

- Do not hide combat formulas in UI components.
- Do not change core formulas without tests.
- Do not make PvP client-authoritative.
- Do not make boss weaknesses meaningless.
- Do not bypass creature command/contract logic in creature combat behavior.
