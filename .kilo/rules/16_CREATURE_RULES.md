# 16 - Creature Rules

## Creature Role

Creatures are not standalone simulation objects.

In SummonerWorld, creatures are player-facing systems first and simulation entities second.

They are:

- Companions
- Tactical combat units
- Summoner tools
- Contracted beings
- Fusion inputs
- Genetic lineages
- Economy assets
- World inhabitants
- Ecology participants
- Story anchors

## Player-First Creature Rule

Every creature feature must answer:

```text
How does this help the player discover, contract, command, train, evolve, fuse, trade, remember, or build strategy around creatures?
```

If the answer is unclear, the feature is not ready.

## Creature Lifecycle

Creature systems should respect the long-term lifecycle:

```text
Discovery
  -> Encounter
  -> Capture / Contract
  -> Summoning
  -> Commands
  -> Training
  -> Leveling
  -> Mutation
  -> Evolution
  -> Fusion
  -> Genetics / Lineage
  -> Memory / Legacy
```

## Contract Rule

Future creature ownership should be represented through contracts, not only raw possession.

A contract should eventually support:

- Creature ID
- Player ID
- Bond level
- Trust
- Loyalty
- Contract stability
- Element compatibility
- Command permissions
- Trade status
- Breeding rights
- PvP eligibility

## Command Rule

Player commands express intent.

Creature AI resolves execution based on:

- Loyalty
- Trust
- Personality
- Training
- Mood
- Current danger
- World conditions
- Contract permissions

Examples:

```text
Follow
Stay
Guard
Attack
Defend
Retreat
Scout
Gather
Track
Interact
Use Ability
Protect Ally
Avoid Combat
```

## Element Rule

Creature systems must respect the element system.

Elements affect:

- Capture chance
- Fusion logic
- Combat
- Crafting
- Exploration
- Contract stability
- Evolution paths
- Dungeon advantages

Do not add new rollable starter elements unless the design docs allow it.

Void, starlight, chaos, and omni are special/quest/end-game concepts, not normal starter-pool elements.

## Fusion Rule

Fusion must remain a core progression system.

Fusion logic should consider:

- Parent validation
- Level requirements
- Soul Crystal requirements
- Element compatibility
- Rarity calculation
- Skill inheritance
- Trait synergy
- Procedural identity
- Genetic inheritance
- Lineage tracking

Do not implement fusion shortcuts that bypass the documented pipeline.

## Genetics Rule

Creature genetics should make two visually similar creatures develop differently over time.

Genetic systems may affect:

- Appearance
- Size
- Temperament
- Growth
- Mutation
- Hidden traits
- Elemental potential
- Rare bloodlines

## AI Behavior Rule

Creature AI should behave like living beings, not just combat stat blocks.

Creature AI layers may include:

- Survival
- Territory
- Pack behavior
- Personality
- Combat
- Learning

## Economy Rule

Creature economy features must respect ownership and contract rules.

Before allowing creature trade, breeding, marketplace listing, or PvP use, confirm the creature's contract state allows it.

## Testing Requirements

Creature features should test:

- Capture formulas
- Contract creation rules
- Command permission rules
- Fusion inheritance
- Mutation behavior
- Evolution triggers
- Deterministic generation where relevant

## Forbidden

- Do not make creatures the architectural center of the whole project.
- Do not bypass player ownership/contract logic.
- Do not duplicate element or fusion systems.
- Do not add non-deterministic creature generation where deterministic sync is required.
- Do not make creature AI ignore player commands without a documented reason.
