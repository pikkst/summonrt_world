# Player Flow

## Core Flow

```text
Character Creation
  -> Element Identity
  -> Summoner Class
  -> First Creature Contract
  -> Exploration
  -> Progression
  -> Dungeons
  -> World Unlocks
  -> Guild / Economy / Housing
  -> Demonlord Challenge
```

## Player-Owned State

Player Core should own or reference:

- identity
- stats
- XP and level
- class
- elements
- inventory
- equipment
- skills
- talents
- titles
- achievements
- reputation
- creature contracts
- quest history
- world unlocks
- save metadata

## Design Rule

When adding a feature, ask:

```text
What does this allow the player to do, become, own, command, remember, trade, build, or overcome?
```

If the answer is unclear, the feature needs more design work.
