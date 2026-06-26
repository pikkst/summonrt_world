# SummonerWorld – Game Design Document
**Version:** 1.0.0 (Prototype)  
**Platform:** Browser (Windows, macOS, Linux)  
**Genre:** Text-Based RPG / Creature Collection / World-Shaping MMORPG  
**Initial Scope:** Offline Single-Player Prototype  
**Long-Term Goal:** Persistent Online MMORPG with player-driven world-shaping  

---

## 1. Executive Summary

SummonerWorld is a browser-based, text-driven creature-collection MMORPG designed for deep, long-term play. Players explore 100 distinct worlds, each stacked above the last, summoning creatures, forging alliances, and shaping settlements through systemic economic and ecological simulation. The game emphasizes player agency, mathematical depth, and procedural richness, transitioning seamlessly from a local JSON-saved prototype to a full online experience.

---

## 2. Core Pillars

1. **Systemic Depth** – Simulation-driven ecosystems and economies that react meaningfully to player actions.
2. **Long-Term Progression** – Level curves designed for hundreds of hours of play across 100 worlds (Level 1–1000).
3. **Player Agency** – From elemental affinity to settlement governance, players leave lasting marks on worlds.
4. **Procedural Uniqueness** – No two worlds feel identical; procedural generation ensures replayability and shared discovery.
5. **Transition-Ready Architecture** – Local-first prototype built to migrate cleanly to online infrastructure.

---

## 3. Core Gameplay Loop

```
EXPLORE → GATHER → SUMMON/TRAIN → CRAFT/BUILD → QUEST/DUNGEON → WORLD ADVANCE
   ↑                                                                      |
   └──────────────── REPEAT (with increasing systemic complexity) ────────┘
```

**Turn Structure:** Discrete text-command turns. Each turn consumes time (minutes–hours) and triggers:
- World-state tick (ecosystem, economy, NPC schedules)
- Creature growth / cooldowns
- Encounter resolution
- UI refresh

---

## 4. World Structure & Navigation

### 4.1 World Layers
- **Worlds 1–100**, each a unique procedural instance.
- World *N* is accessible only after defeating the World Boss of World *N−1*.
- Each world has a **danger gradient**: periphery (safe) → mid-regions (moderate) → center (extreme).
- The central dungeon tower contains *F* floors (procedurally scaled) culminating in the **World Boss**.

### 4.2 Navigation Model
- Tile-based coordinates (X, Y) within procedural biome maps.
- Movement executes a world-tick; encounters, weather, and resource nodes update.
- **Fast travel** unlocks via discovered settlements, roads, or creature-mounted traversal.
- **Weather** affects encounter tables, resource yield, and elemental affinity bonuses.

---

## 5. System Specifications

### 5.1 Leveling & Difficulty Scaling

#### Player Progression
| World | Level Range | XP Curve (Cumulative) | Key Unlocks |
|-------|-------------|----------------------|-------------|
| 1 | 1–10 | 100 base × 1.15^L | Basic capture, housing plots |
| 2 | 11–20 | 1,200 base × 1.18^L | Fusion tier 1, trade caravans |
| ... | ... | ... | ... |
| 100 | 991–1000 | 9.8 × 10^15 base × 1.25^L | All-element unlock, city founding |

**Formula:**
- Base XP per level: `XP_Base = 100 × (1.15)^(Level - 1)`
- World modifier: `WorldMod = 1 + (WorldIndex × 0.05)`
- Encounter XP: `XP_Reward = (MonsterBaseXP × MonsterLevel) × WorldMod × AffinityBonus`
- AffinityBonus: `1.15` if player and creature share primary element; `0.85` if opposing.

#### Difficulty Scaling
- **Monster Stats:** `Stat = BaseStat × (1 + (WorldIndex × 0.10)) × Random(0.9, 1.1)`
- **Dungeon Floor Scaling:** Each floor adds `+5%` to monster health/damage and `+2%` trap density.
- **Boss Scaling:** Boss HP = `BaseBossHP × (1 + (WorldIndex − 1) × 0.25)`. Bosses gain one new signature ability every 10 worlds.

#### Level Cap Gate
- To enter the World Dungeon, player must be `≥ WorldMaxLevel` (e.g., World 1 requires Level 10).
- Dungeon exits scale player down to minimum viable level for progression fairness in repeat runs.

---

### 5.2 Elemental Affinity System

#### Standard Roll (1 element)
- Uniform distribution across 10 elements: Fire, Water, Earth, Air, Lightning, Iron, Nature, Ice, Light, Darkness.
- **Probability:** 1 / 10 per element.

#### Rare Rolls
| Affinity | Probability | Implied Odds |
|----------|-------------|--------------|
| Dual Element | 1 / 1,000 | 0.10% |
| Triple Element | 1 / 1,000,000 | 0.0001% |
| Quadruple+ | Not rollable | Quest unlock only |

**Dual Element Generation:**
- Primary element determined first.
- Secondary drawn from weighted pool:
  - Synergistic elements (e.g., Fire + Air → Storm) have weight 2.
  - Neutral pairs have weight 1.
  - Opposing elements (Fire + Ice) have weight 0.5.
- Resulting pair has combined capture pools, fusion recipes, and synergy bonuses.

**Triple Element:**
- Requires two dual-roll successes × element compatibility matrix pass.
- Grants “Primordial” trait: +20% to all elemental damage, unlocks hidden evolution paths.

**All Element:**
- Cannot be rolled. Must be earned via “Convergence” quest chain spanning all 100 worlds.
- Grants “Omni” status: creature fusion ignores affinity restrictions.

---

### 5.3 Creature System

#### Classification Tiers
| Tier | Rarity Weight | Max Skills | Traits | Mutations |
|------|--------------|------------|--------|-----------|
| Common | 60 | 2 | 0 | 0 |
| Uncommon | 25 | 3 | 1 | 0 |
| Rare | 10 | 4 | 1 | 1 |
| Epic | 4 | 5 | 2 | 2 |
| Legendary | 0.9 | 6 | 3 | 3 |
| Mythical | 0.1 | 8 | 4 | 4 |

#### Experience Curve
- `XP_Required(Level) = 50 × (1.12)^(Level − 1)`
- Evolution triggers at specific levels or item usage.
- Mutation chance on level-up: `BaseChance = 0.02 + (Tier × 0.01)`. Mutation types: stat shift, new skill, passive trait, elemental drift.

#### Capture Mechanics
- Capture chance: `P_capture = (1 − (MonsterHP / MaxHP)) × AffinityWeight × RarityPenalty × (1 − (LevelDiff × 0.02))`
- AffinityWeight: 1.0 for shared element, 0.3 for neutral, 0.1 for opposing.
- RarityPenalty: Common 1.0, Mythical 0.15.
- Failed captures may trigger aggressive encounters or permanent territory hostility.

---

### 5.4 Fusion Logic

#### Rules
1. Both creatures must be ≥ Level 5.
2. Fusion consumes a **Soul Crystal** (tier-matched to highest creature).
3. Resulting rarity = weighted average of inputs (capped at Legendary for non-special inputs).
4. **Element Combination Matrix** determines offspring element(s):
   - Fire + Air = Storm
   - Water + Ice = Glacier
   - Earth + Iron = Magma
   - Light + Darkness = Aether (chance 0.05; otherwise results in unstable Void creature)
5. **Skill Inheritance:** Offspring inherits up to 3 skills from parents (highest-tier skills prioritized).
6. **Trait Fusion:** Parents’ traits combine; synergistic traits may activate hidden effects (e.g., “Regeneration” + “Poison” → “Acidic Recovery”).

#### Procedural Identity Generation
- Base appearance drawn from parent visual parts (head, body, limbs, elemental FX).
- Color palette interpolated between parent palettes.
- Scale determined by max(parent sizes) × mutation factor.

#### Complexity Target
- **Theoretical combinations:** 1,000+ unique elemental pairings.
- **Skill cross-products:** 500 × 500 = 250,000 possible skill inheritance sets.
- **Trait synergies:** 50+ documented interactions.

---

### 5.5 Ecosystem Simulation

#### Entity Types
- **Fauna:** Wolves, deer, herbivores, predators.
- **Flora:** Trees, herbs, crystals, magical plants.
- **NPCs:** Humanoids with schedules and professions.
- **Player Creatures:** Integrated into ecosystem with predator/prey flags.

#### Simulation Algorithm (per World Tick, ~1 game-hour)

```pseudocode
For Each Tile in World:
  1. Resource Regeneration:
     - Plants: regrow if harvested < 30 days ago.
     - Ore: respawn after 90 days or player mining action reset.
  2. Population Dynamics:
     - Birth: if Population < Cap and FoodAvailable > Threshold.
     - Death: if Starving or PredationPressure > SafetyMargin.
     - Migration: creatures move toward Food / Water / Away from Threat.
  3. Player Impact:
     - Overhunting reduces local population for 60 days.
     - Deforestation affects herbivore carrying capacity.
     - Pollution (from crafting/industry) reduces spawn quality.
```

#### Ecological Balance Compensator
- If a species drops below 10% of baseline, spawn a “Sanctuary” event for 3 in-game days.
- Keystone species loss triggers biome shift (e.g., forest → barren) if unresolved for 30 days.

---

### 5.6 Economic Simulation

#### Market Model
- Each settlement maintains a **goods ledger** with supply/demand curves.
- **Price(i) = BasePrice × (1 + k × (Demand − Supply))**
  - k = 0.15 for staples (wood, stone), 0.40 for luxuries (artifacts, crystals).
- NPC merchants have **cash reserves** and **inventory limits**; they restock based on world-tick production.
- **Player crafters** can undercut NPC prices, causing NPC merchants to stop selling that good temporarily.

#### Global Trade (Future MMORPG)
- Inter-world trade routes connect settlements.
- Price arbitrage opportunities between World 1 (cheap raw materials) and World 50 (expensive refined goods).
- Guild-controlled caravans can be intercepted by PvP or monster events.

#### Inflation Control
- “Sink” systems: housing taxes, repair costs, fusion material decay.
- Dynamic event loot scaling ensures legendary items never become trivial.

---

### 5.7 Procedural Generation Framework

#### World Generation Pipeline
1. **Seed Derivation:** World index + player ID hash (or random seed for offline) → deterministic PRNG.
2. **Biome Placement:** Perlin noise + Voronoi regions → 5–8 major biomes per world.
3. **Settlement Placement:** Biased by biome (cities near rivers, forts on ridges).
4. **Dungeon Layout:** BSP tree or recursive backtracking maze, themed per world aesthetic.
5. **Creature Distribution:** Weighted by biome affinity and world tier.

#### Dungeon Procedural Content
- **Floor count:** `BaseFloors + WorldIndex` (e.g., World 1 has 3 floors + 1 boss; World 100 has 102 floors + 1 boss).
- **Room Types:** Combat, trap, puzzle, treasure, rest, elite encounter, vendor (rare).
- **Themed Decor:** World aesthetic (volcanic, frozen, mechanized, fungal) applied to room descriptions and hazard types.

---

### 5.8 Crafting & Housing

#### Crafting Tiers
- **Basic:** Wood, stone, simple tools. No rare materials required.
- **Intermediate:** Ore, herbs, elemental catalysts. Requires workshop.
- **Advanced:** Crystals, essence, legendary monster parts. Requires city-level infrastructure.
- **Artifacts:** Unique recipes discovered via exploration or quest chains. One-per-world or -per-player restrictions.

#### Housing Economic Impact
- Structures produce **passive income** (taxes from NPC residents, resource refinement).
- Town hall upgrade unlocks **regional policies**: trade tariffs, creature protection laws, festival bonuses.
- Player can found a **town** once owning ≥ 5 buildings and reaching World 15.

---

### 5.9 Quest System

#### Quest Taxonomy
| Type | Frequency | Reward Focus | Example Objective |
|------|-----------|--------------|-------------------|
| Story | 1 per world | Lore, unique creatures | Defeat the World Boss |
| Faction | 3–5 per world | Reputation, crafting schematics | Supply iron to the Ironclad Legion |
| Creature | 10+ per world | Eggs, bonding items | Capture 5 Thunder Hawks |
| Exploration | 5 per world | Coordinates, map fog removal | Chart the northern glacier |
| Crafting | 5 per world | Recipes, rare materials | Forge a Flame-infused Sword |
| World | 1 per region | Settlement buffs | Clear the bandit camp |
| Hidden | Rare | Massive XP, mythical eggs | Find the secret druid circle |
| Legendary Chain | 1 per game | All-element affinity, world title | Converge the elemental pillars |

#### Quest Generation
- **Templated** for story/legendary quests.
- **Procedural** for faction/exploration/crafting quests: parameters pulled from world state (available monsters, missing resources, NPC needs).

---

### 5.10 NPC System

#### NPC Attributes
- **NamePool** = culture-themed dictionary seeded by world biome.
- **Schedule:** hourly routines (sleep, work, travel, market, tavern).
- **Relationships:** affinity values toward player and other NPCs (friendship, rivalry, romance).
- **Profession:** determines buy/sell lists and time-of-day availability.
- **Rumor System:** NPCs share world-state information (boss weakness, hidden quests) based on trust level.

#### Advanced NPC Behaviors
- **Travel:** NPCs walk between settlements, carrying goods. Robberies or monster attacks interrupt trade.
- **Marriage / Inheritance:** NPC families pass down property and wealth, altering regional demographics.
- **Faction AI:** NPCs align with factions; faction power shifts based on player quest outcomes.

---

### 5.11 Dungeon System

#### Structure
- World Dungeon: 1 tower per world.
- **Progression:** Floors 1–N are randomly generated; Floor N+1 is the **World Boss Arena**.
- **Quick-Travel:** Players can descend only; ascending requires defeating the floor guardian or using rare teleport items.

#### Boss Mechanics
- Phases triggered at HP thresholds (e.g., 75%, 50%, 25%).
- Elemental shift on phase change.
- Environmental hazards appear/rotate.
- **Weakness Discovery:** Players must use “Scan” or creature abilities to identify elemental weakness; guessing wrong reduces damage by 70%.

---

## 6. Command-Driven UX & Navigational Flow

### 6.1 Interface Philosophy
- **Keyboard-first, mouse-optional.**
- **Context-sensitive action list** dynamically generated per location.
- **Command history** with arrow-key navigation.
- **Tab-completion** for locations, creatures, and items.

### 6.2 Screen States
```
┌──────────────────────────────────────────────────┐
│ SUMMONERWORLD  [World 1]  [Day 14 / Rain]        │
├──────────────────────────────────────────────────┤
│ Location: Northern Forest (X:124 Y:88)           │
│                                                  │
│ Nearby: Forest Spirit, Young Fire Wolf, Caravan   │
│                                                  │
│ 1. Travel North   6. Hunt                         │
│ 2. Travel South   7. Gather                       │
│ 3. Travel East    8. Inventory                    │
│ 4. Travel West    9. Creatures                    │
│ 5. Search        10. World Map                   │
│                                                  │
│ >                                                 │
└──────────────────────────────────────────────────┘
```

### 6.3 Input Grammar
- **Verbs:** `travel [direction]`, `search`, `hunt [target]`, `gather [resource]`, `capture [creature]`, `fuse [creature1] [creature2]`, `craft [item]`, `build [structure]`, `talk [npc]`, `trade`, `quest`, `map`.
- **Shortcuts:** Number keys for visible actions, `i` for inventory, `c` for creatures, `m` for map.
- **Contextual synonyms:** `north` = `travel north`, `0` or `back` = return to previous screen.

### 6.4 Feedback Loop
- **Combat log:** scrolling text with timestamp and color-coded damage numbers.
- **System messages:** yellow for rare events, red for danger, green for success.
- **Modal overlays:** inventory, creature stats, world map.
- **Auto-scroll:** combat log auto-scrolls unless user pauses (Spacebar).

### 6.5 Accessibility
- Screen-reader compatible (ARIA live regions for log updates).
- Font scaling.
- High-contrast text theme.
- Keyboard-only account creation and settings.

---

## 7. Online Expansion Preparation

### 7.1 Designed-for-Multiplayer Safeguards
- **Deterministic seed systems** ensure identical world generation for all players on the same server.
- **Event sourcing pattern** applied to all state changes (planned for backend).
- **Client predicts state locally** while server reconciles, minimizing perceived latency.

### 7.2 Planned Online Features (Post-Prototype)
| Feature | Release Milestone | Notes |
|---------|-------------------|-------|
| Accounts & Cloud Saves | MMO Alpha | Replaces JSON with database |
| Global Chat / Mail | MMO Alpha | Instanced channels per world |
| Guilds | MMO Beta | Persistent guild halls, shared vaults |
| Player-driven Market | MMO Beta | Auction house with regional pricing |
| PvP (Arena / Open World) | MMO Launch | Ranked seasons, bounties |
| World Events (Raid Bosses) | MMO Launch | Server-wide participation |
| Persistent Territories | MMO Launch | Guild vs. guild world control |

---

## 8. Monetization (Online Phase)

- **Cosmetic:** Creature skins, UI themes, summon animations.
- **Quality-of-Life:** Extra creature storage, faster travel, inventory slots (not pay-to-win).
- **Expansion Passes:** New world themes, creature packs (balanced—all content obtainable in-game).
- **No pay-to-win:** All gameplay-affecting items craftable or obtainable via gameplay.

---

## 9. Success Metrics

- **Retention:** Day-1 > 40%, Day-30 > 15% (target for online launch).
- **Engagement:** Average session > 45 minutes (text RPG depth supports long engagement).
- **Progression:** 5% of players reach World 10 within first month (indicates curve accessibility).
- **Social:** 60% of online players join or interact with guilds within 30 days.
- **Economy Health:** < 5% price deviation between regional markets (stable simulated economy).

---

## 10. Risk Register & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Complex math alienates casual players | Medium | High | Optional “guided mode” with simplified display; maintain vanilla math underneath |
| Text-only limiting mass appeal | High | Medium | Rich sound design (future), atmospheric writing, frequent reader rewards |
| Procedural generation identity crisis | Medium | Medium | Strong biome/world themes; hand-crafted story beats anchor randomness |
| Database migration pain | Low | High | Abstract data layer from Day 1; repository pattern for all data access |
| Economy exploits | Medium | High | Automated price floor/ceiling monitoring; dev-tool scenario testing |

---

## 11. Art Direction & Narrative Tone

- **Tone:** Gritty fantasy with moments of wonder. Think *Darkest Dungeon* meets *Silicon Dreams* (text depth) with *Final Fantasy* summoning grandeur.
- **Writing Style:** Concise, atmospheric prose. Combat descriptions visceral; worldbuilding delivered through discovered documents, NPC dialogue, and creature codex entries.
- **Visual Identity (Future):** Minimalist UI with glowing elemental accents. Creature silhouettes rendered in ASCII or stylized sprites toggleable by preference.

---

*End of Game Design Document v1.0.0*
