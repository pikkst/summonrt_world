# SummonerWorld – Sprint Task Breakdown

## Documentation Alignment Notes

Current documentation lives under `docs/`: task reports are in `docs/`, and design-source volumes are in `docs/Sumoner_World_dec/`.

Current alignment state:
- The project is now documented as a player-first Summoner RPG.
- The core architecture is Player Core -> Creature Core -> World Core -> NPC Core -> Economy Core.
- Creature AI remains valuable, but it is treated as a Creature Bible technical appendix.
- Sprint 0-5 are complete.
- Sprint 6 sequential implementation is complete through T6.4.6.
- T6.4.7 and T6.4.9 are also complete ahead of sequence.
- T6.4.10 is partially complete: current unit tests cover connectivity, multi-paths, treasure rooms, deterministic seeds, and room types; 100-floor simulation and boss-floor reachability remain.
- The next implementation task is T6.4.8.
- T6.5, T6.6, and T6.7 overlap earlier completed tasks and should be read as extension tasks, not fresh duplicates.
- New missing backlog added from the design-source volumes in `docs/Sumoner_World_dec/`: Player Core alignment, event-driven architecture, documentation volume completion, reputation, titles, achievements, statistics, contracts, commands, and end-game structure.
- T6P.1, T6P.2, T6P.3, T6P.4, T6P.5, T6P.6, T6P.7, and T6P.8 are complete (PlayerCoreState, Character Creation, Summoner Classes, Element Identity, Player Statistics, Inventory Core, Equipment Core, Creature Slot System).

## Sprint 0 – Foundation & Tech Debt (Month 0)
Sprint goal: stabilize prototype, find and fix all technical issues, set up testing and linting foundation.

- [x] T0.1 – Run `npm run lint` and `npm run typecheck` across the project, fix all TypeScript errors
- [x] T0.2 – Add `vitest` test runner and `@testing-library/react` as dev dependencies
- [x] T0.3 – Create `vitest.config.ts` configuration (aliases, test environment)
- [x] T0.4 – Create project linting/scripts: `npm run lint:fix`, `npm run test:watch`
- [x] T0.5 – Fix `src/stores/gameStore.ts` import type mismatches (all `any` casts, missing types)
- [x] T0.6 – Remove duplicate functions in `src/stores/gameStore.ts` (`movePlayer` vs `finishMovement`), unify API
- [x] T0.7 – Enable `tsconfig.json` strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- [x] T0.8 – Remove duplicate `LogEntry` type (exists in both `GameState` and separately exported)
- [x] T0.9 – Standardize all log messages to English (remove Estonian in `gameEngine.ts` loot_description)
- [x] T0.10 – Add `.env.example` and document dotenv usage for server
- [x] T0.11 – Add `.gitignore` entries (`dist/`, `*.log`, `.env.local`)
- [x] T0.12 – Verify `npm run build` produces 0 errors and `dist/` is ready for deploy
- [x] T0.13 – Refactor src/stores/gameStore.ts into a Decoupled Core ArchitectureCreate /src/stores/game/ subfolder structureCreate types.ts for global types (PlayerState, MissionObject, etc.)Create modules/playerModule.ts (manages character stats, level, and resource pools)Create modules/careerModule.ts (manages passive career tree unlocks and point spending)Create modules/missionModule.ts (manages active timer queues and time adjustments)Create modules/combatModule.ts (manages the automated combat loop simulation)Create modules/economyModule.ts (manages shop traffic, smelting, and caravans)Rewrite src/stores/gameStore.ts to act strictly as an initialization/composition entry point


## Sprint 1 – Career Tree Foundation: Data Layer (Month 1)
Sprint goal: build flexible career passive tree data architecture enabling easy changes without engine modifications.

- [x] T1.1 – Create `src/data/careerTree/nodes.json` schema: 6 major sectors (Blacksmith, Explorer, Official, Shopkeeper, Broker, Summoner), each with at least 1 minor + 1 notable + 1 keystone node
- [x] T1.2 – Standardize node structure: `id`, `name`, `type` (minor/notable/keystone), `career_category`, `connections[]`, `stats{}` (decoupled key-value map)
- [x] T1.3 – Create `src/data/careerTree/index.ts` loader exporting the full tree graph with TypeScript type access
- [x] T1.4 – Extend `PlayerState`: `unspent_passive_points: number` and `unlocked_node_ids: string[]`
- [x] T1.5 – Initialize `unlocked_node_ids` on character creation with default `["root_hub"]`
- [x] T1.6 – Implement `canUnlockNode(playerState, targetNodeId, treeData)` function:
   - Rule A: `unspent_passive_points >= 1`
   - Rule B: target not already in `unlocked_node_ids`
   - Rule C: at least 1 `connections` ID matches `unlocked_node_ids`
- [x] T1.7 – Implement `getAggregateStats(playerState, treeData)` aggregator: reads all unlocked nodes and sums `stats` into dictionary
- [x] T1.8 – Implement `respecAllNodes(playerState)` function: refunds points, resets `unlocked_node_ids` → `["root_hub"]`
- [x] T1.9 – Create `careerTree.test.ts`: test all 3 rules for canUnlockNode, test aggregator summation, test respec returns points
- [x] T1.10 – Remove old `MASTER_SKILL_TREE.ts` structure, replace with new JSON-based system foundation
- [x] T1.11 – Add career_category filter UI component (show only node category relevant to player)

## Sprint 2 – Idle/Management Architecture & Execution Engine (Month 2)
Sprint goal: build time-based execution engine replacing immediate tick-based mechanics with strategic missions. All player actions go into Active Mission Queue.

- [x] T2.1 – Create `src/core/missionQueue.ts`: `ActiveMission` schema (mission_id, type, assigned_creatures[], world_layer, start_time, duration_seconds, end_time, status, modifiers{})
- [x] T2.2 – Add `MissionType` enum: EXPLORE_TIER_1, SCOUT_DUNGEON, SMELT_ORE, CRAFT_ITEM, STORE_VISIT, TAX_EDICT, CARAVAN_ROUTE
- [x] T2.3 – Implement `ActiveMissionQueue` Zustand slice or integrate into `GameEngine`: `missions[]`, `addMission()`, `completeMission()`, `failMission()`
- [x] T2.4 – Create `src/core/heartbeat.ts`: 1-second interval loop checking `CurrentServerTime >= Mission.endTime` and triggering `resolveMission()`
- [x] T2.5 – Implement offline catch-up: login timestamp vs logout timestamp, batch resolve all completed missions
- [x] T2.6 – Write timer compression formula: `FinalDuration = BaseDuration × (1 − (TreeSpeedMod + CreatureAgilityMod) / 100)`
- [x] T2.7 – Add career_tree stat -> mission modifier mapping (Explorer `speed_multiplier`, Broker `caravan_speed_pct`, etc.)
- [x] T2.8 – Implement automated combat engine `resolveAutomatedCombat(teamA, teamB)`: 30-turn max loop, turn-by-turn log generation, victory/defeat/rewards
- [x] T2.9 – Create `MissionResult` schema: `victory: boolean`, `battle_log: string[]`, `rewards: ItemStack[]`, `xp: number`
- [x] T2.10 – Test mission queue property-based: 1000 random missions -> end_time >= start_time, status = IN_PROGRESS → COMPLETED/FAILED
- [x] T2.11 – Test offline catch-up: 8h pause → resolve 8h worth of missions, verify rewards accumulate correctly
- [x] T2.12 – Add mission progress UI: real-time countdown, remaining time, status badge

## Sprint 3 – Core Gameplay Loop & XP (Month 3)
Sprint goal: refine core loop to explore → gather → summon → combat → quest, now through time-based mission system.

- [x] T3.1 – Convert `movePlayer` to non-immediate: register "Explore Sector" mission (duration = worldId × 30s), send to Queue, on completion add tile discovery + encounter roll
- [x] T3.2 – Convert `searchArea`/`gatherResource` to missions (15–45s timer), not immediate actions
- [x] T3.3 – Convert `captureCreature` to timed mission (60s capture attempt, success = roll + affinity check)
- [x] T3.4 – Implement `xpCurve.ts`: `XP_Base = 100 × (1.15)^(Level-1)`, test Level 1–1000
- [x] T3.5 – Add World modifier XP: `WorldMod = 1 + (WorldIndex × 0.05)`
- [x] T3.6 – Implement Affinity bonus XP (1.15 same element, 0.85 opposing)
- [x] T3.7 – Unify `GameEngine.tickCreatures()` XP granting for entire party on mission completion
- [x] T3.8 – Fix `getLevelThreshold()` to use GDD formula
- [x] T3.9 – Add level-up visual feedback (log + overlay) in mission completion callback
- [x] T3.10 – Implement real-time `energy`/`nerve`/`happy`/`life` regeneration (offline mode) - The    names on UI may be different at the moment. Please align them.
- [x] T3.11 – Add turn-count based world-tick (1 turn = X minutes game-time), triggered in mission queue heartbeat
- [x] T3.12 – Standardize `Encounter XP` formula: `(MonsterBaseXP × MonsterLevel) × WorldMod × AffinityBonus`
- [x] T3.13 – Add experience display (progress bar) to ResourcePanel
- [x] T3.14 – Verify level 1000 achievable without overflow (use BigInt for XP fields)

## Sprint 4 – Elemental Affinity & Creature System (Month 4)
Sprint goal: refine elemental system, creature generation, mutations and capture mechanics per GDD.

- [x] T4.1 – **Update Element constants**: Consolidate `ELEMENTS` to 10 elements only (remove void/starlight/chaos from starter pool; they are quest-only unlocks)
- [x] T4.2 – Remove duplicate `getTileKey`/`getNeighbors` functions (consolidate to constants.ts) if they haven't been fixed already.
- [x] T4.3 – Remove `void`, `starlight`, `chaos` from starter element roll pool (available via quests only) player creation
- [x] T4.4 – Implement dual-element roll: 1/1000 probability, weighted synergistic/neutral/opposing pairs player creation
- [x] T4.5 – Implement triple-element roll: 1/1,000,000, "Primordial" trait (+20% all elemental damage) player creation
- [x] T4.6 – Add "All Element" (Omni) quest-chain lock — not rollable, only via Convergence quest
- [x] T4.7 – Fix `generateCreatureTemplate()` to use GDD rarity weights (Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 0.9%, Mythical 0.1%)
- [x] T4.8 – Implement creature XP formula: `XP_Required(Level) = 50 × (1.12)^(Level − 1)` with evolution triggers
- [x] T4.9 – Implement mutation system on level-up: `BaseChance = 0.02 + (Tier × 0.01)`, types: stat shift, new skill, passive trait, elemental drift
- [x] T4.10 – Implement exact capture formula: `P_capture = (1 − (MonsterHP / MaxHP)) × AffinityWeight × RarityPenalty × (1 − (LevelDiff × 0.02))`
- [x] T4.11 – Add `AffinityWeight` values (1.0 same element, 0.3 neutral, 0.1 opposing)
- [x] T4.12 – Add `RarityPenalty` values (Common 1.0 … Mythical 0.15)
- [x] T4.13 – Failed capture → aggressive encounter or persistent territorial hostility
- [x] T4.14 – Add creature affection system (level, training effect)
- [x] T4.15 – Add creature evolution paths (template-level `evolvesFromId`/`evolvesIntoId`)

## Sprint 5 – Fusion Logic & Skill Inheritance (Month 5)
Sprint goal: implement complete fusion system, trait synergies, procedural identity and skill inheritance.

- [x] T5.1 – Create `fusionMatrix.ts`: 10x10 element combination matrix (Fire+Air=Storm, Water+Ice=Glacier, etc.)
- [x] T5.2 – Implement Light+Darkness → Aether (5% chance) or unstable Void creature
- [x] T5.3 – Implement skill inheritance: up to 3 skills from parents, highest-tier skills prioritized
- [x] T5.4 – Create `traitSynergy.ts`: 50+ documented trait combinations (Regeneration+Poison → Acidic Recovery, etc.)
- [x] T5.5 – Implement procedural identity: head/body/limb variations, elemental FX, color palette interpolation
- [x] T5.6 – Add `Soul Crystal` tier-matching (consumed matching highest creature tier)
- [x] T5.7 – Verify fusion result has correct rarity (weighted average, capped at Legendary without special conditions)
- [x] T5.8 – Add `capturePool` and `fusionRecipe` auto-generation for new creatures
- [x] T5.9 – Test 1000+ random pairings in fusionMatrix (property-based)
- [x] T5.10 – Add fusion feedback UI: show parent stats, expected child properties
- [x] T5.11 – Integrate all career passives into fusion and the entire game loop: create 50+ nodes for 6 careers with cross-career synergies, map each node `stats{}` modifier to specific game systems (fusion timer, crafting speed, capture rate, dungeon timer, store traffic etc), add `careerTreeIntegration.ts` which contains all node->system mappings and executes `getAggregateStats()` returned bonuses on every game tick

## Sprint 6 – Combat & Dungeon System (Month 6)
Sprint goal: refine combat system, dungeon generation, boss mechanics and automated combat integration.

- [x] T6.0 – Integrate the Final Boss. Demonlord who rules floors 100+ to 50+ in sync with player activity. The fewer players on the floor and the lower the activity, the more influence the Demonlord AI has. If a player defeats the Demonlord, he becomes the new Demonlord and the new player can issue him a challenge that he must accept. The Demonlord must have his own skillset and floor manager functions.
    - [x] T6.0.1 – Add DemonlordState and DemonlordSkill types to src/types/game.ts
    - [x] T6.0.2 – Create src/core/demonlord.ts with AI logic for activity-based influence
    - [x] T6.0.3 – Add DEMONLORD_ENCOUNTER mission type to missionQueue.ts
    - [x] T6.0.4 – Create src/stores/game/modules/demonlordModule.ts with store actions
    - [x] T6.0.5 – Implement demonlordFloor range (50-100) in dungeon system
    - [x] T6.0.6 – Add player defeat transition to Demonlord status in combatModule.ts
    - [x] T6.0.7 – Implement challenge issuance and acceptance system
    - [x] T6.0.8 – Add Demonlord skillset (signature abilities, elemental shifts)
    - [x] T6.0.9 – Add career tree bonuses for Demonlord-related combat stats
    - [x] T6.0.10 – Create demonlord.test.ts with unit tests
- [x] T6.1 – Fix combat damage formula: `damage = (ATK − DEF × 0.5) × elementalFactor + random(−2…+2)`
- [x] T6.2 – Add combat phase boss mechanics (HP thresholds 75/50/25%, elemental shift, environmental hazards)
- [x] T6.3 – Implement "Scan" ability for boss weakness discovery (wrong guess = −70% damage)
- [x] T6.4.1 – Create generateDungeonFloor(worldIndex, floorIndex) function

* Implement recursive backtracking maze generation
* Produce a connected room graph with entrance and boss/exit rooms
* Ensure deterministic generation using world seed + floor seed

- [x] T6.4.2 – Add multi‑path guarantee (ensureMultipleShortestPaths)

* Compute shortest path entrance → boss using BFS
* Inject controlled shortcut edges until ≥ 3 distinct shortest paths exist
* Re‑validate path uniqueness after each added edge

- [x] T6.4.3 – Add treasure room placement logic

* Each floor must contain ≥ 1 treasure room
* Treasure room must be located far from entrance
* Add optional secondary treasure rooms for large floors

- [x] T6.4.4 – Implement room type assignment system

* Assign room types: combat, trap, puzzle, treasure, rest, elite, vendor
* Ensure biome/tier‑themed consistency
* Guarantee at least 1 rest room

- [x] T6.4.5 – Create generateDungeonTower(worldIndex) (Sword Art Online–style central tower)

* Build continuous vertical tower
* Floor count = BaseFloors + WorldIndex
* Link floors vertically (exit → next entrance)
* Mark safe floors (every 10th): rest area + vendor + teleport unlock

- [x] T6.4.6 – Add boss floor generation rules

* Final floor of each world contains a boss arena
* Arena layout must be open, non‑maze
* Add environmental hazards based on world element
* Integrate boss scaling formula from GDD

- [x] T6.4.7 – Add deterministic floor seed system (FLOOR_SEEDS)

* Each floor uses hash(worldIndex, floorIndex, globalSeed)
* Guarantee identical dungeon layout for all players
* Add unit test: same seed → identical floor graph

- [x] T6.4.8 – Add dungeon metadata export

* Store floor graph, room types, treasure locations, boss room ID
* Save into DungeonRun.state for persistence
* Required for online synchronization and party dungeon runs

- [x] T6.4.9 – Add pathfinding utilities

* findShortestPath()
* findAllShortestPaths()
* calculateRoomDistanceMap()
* Used for treasure placement, shortcut injection, boss logic.

- [x] T6.4.10 – Add dungeon generation tests

* [x] 100 generated floors → no disconnected rooms
* [x] ≥ 3 shortest paths validated
* [x] ≥ 1 treasure room per floor
* [x] Deterministic seed test
* [x] Boss floor always reachable.

- [x] T6.5 – Extend completed combat phase boss mechanics

* T6.2 already completed base boss phases at HP thresholds 75%, 50%, 25%
* T6.2 already completed elemental shift per phase
* Add environmental hazard rotation (lava bursts, frost spikes, storm pulses)
* Integrate Summoner career bonuses into boss phase calculations

- [x] T6.6 – Extend completed “Scan” ability for boss weakness discovery

* T6.3 already completed the base Scan ability and wrong-guess damage penalty
* Add SCAN skill to creature ability pool
* Correct guess → reveal elemental weakness
* Wrong guess → −70% damage penalty for 3 turns
* Add UI feedback: "Weakness Identified" overlay

- [x] T6.7 – Add dungeon room type interactions and UI

* T6.4.4 already completed room type assignment for trap, puzzle, treasure, rest, elite, and vendor
* Trap rooms: text‑based minigame (avoid, disarm, endure)
* Puzzle rooms: logic riddles, pattern matching, rune alignment
* Elite rooms: mini‑boss encounters with rare drops
* Vendor rooms: temporary merchant with dungeon‑specific items
* Treasure rooms: guaranteed loot chest + rare chance for mythical egg

- [x] T6.8 – Implement dungeon floor count & progression rules

* Floor count = BaseFloors + WorldIndex
* World 1 → 3 floors + boss
* World 50 → 100 floors + boss
* Ascending requires defeating floor guardian or using rare teleport item
* Dungeon exit scales player to minimum viable level (per GDD)

- [x] T6.9 – Add "ascending requires defeating floor guardian" rule (or rare teleport item)
- [x] T6.10 – Verify dungeon exit scales player to minimum viable level
- [x] T6.11 – Add trap/puzzle minigame UI (text-based choices)
- [x] T6.12 – Test full clear World 10 dungeon simulation (integration test)
- [x] T6.13 – Integrate automated combat engine with timed missions: dungeon scouting and wild encounters resolved via `resolveAutomatedCombat()`
- [ ] T6.14 – Integrate career passives into combat: Summoner path `capture_bonus_pct`, Warrior path `damage_dealt_pct`, Guardian path `damage_taken_pct`

## Sprint 6.5 – Player Core Architecture Alignment (Pre-World Refactor)
Sprint goal: align implementation with the new Player Core Bible before expanding world, economy, NPC, and MMO systems. Player must become the root aggregate for progression, inventory, equipment, contracts, statistics, reputation, and save/load.

- [x] T6P.1 – Create `PlayerCoreState` root aggregate

* Include identity, summoner profile, level, XP, elements, class, inventory, equipment, skills, talents, titles, achievements, statistics, reputation, quest history, creature contracts, housing references, world unlocks, and save metadata
* Ensure existing player state migrates without losing completed Sprint 0-6 data

- [x] T6P.2 – Implement full Character Creation flow from Player Core Bible

* Player name
* Appearance placeholder/model
* Starting element
* Summoner class
* Starting world
* Initial attribute bias
* First creature contract path

- [x] T6P.3 – Add Summoner Class system

  * Beast Binder
  * Elementalist
  * Warden
  * Ritualist
  * Tactician
  * Alchemist
  * Pathfinder
  * Duelist
  * Add class modifiers as data, not hard-coded branching

- [x] T6P.4 – Refactor element selection to be a player identity decision

 * Preserve existing 10-element starter pool
 * Keep void/starlight/chaos quest-only
 * Keep Omni quest-chain locked
 * Link element to player skills, creature affinity, contract stability, equipment scaling, crafting recipes, dungeon modifiers, NPC reactions, world travel, and PvP identity

- [x] T6P.5 – Implement Player Statistics model
 
 * Primary: Strength, Vitality, Intelligence, Dexterity, Wisdom, Luck
 * Secondary: Health, Mana, Stamina, Movement, Critical Chance, Elemental Mastery, Contract Capacity, Command Speed, Creature Bond Power, Inventory Capacity, Crafting Efficiency, Trade Influence, Reputation Gain
 * Add deterministic stat recalculation tests

- [x] T6P.6 – Implement Inventory Core

* Equipment
* Consumables
* Materials
* Quest items
* Creature items
* Contract items
* Crafting tools
* Housing items
* Marketplace goods
* Dungeon keys
* Sorting, filtering, stacking, rarity, ownership, binding, trading rules, and save/load stability

- [x] T6P.7 – Implement Equipment Core

* Slots: weapon, offhand, head, chest, hands, legs, feet, amulet, ring 1, ring 2, summoner focus, creature command artifact
* Equipment modifies player stats, elemental mastery, creature bond power, contract capacity, command speed, summoning cost, crafting efficiency, and travel utility

- [x] T6P.8 – Implement Creature Slot system

* Active combat slots
* Reserve slots
* Utility slots
* Housing slots
* Marketplace listing slots
* Breeding slots
* Slot expansion through level, equipment, housing, guild bonuses, and end-game unlocks

- [x] T6P.9 – Implement Creature Contract system

* Creature ID
* Player ID
* Bond level
* Trust
* Loyalty
* Contract stability
* Element compatibility
* Command permissions
* Trade status
* Breeding rights
* PvP eligibility
* Attach player-owned contract state to PlayerCoreState

- [x] T6P.10 – Implement Summoning rules

* Mana/resource cost - `calculateSummonManaCost()` uses summoningCost stat and element compatibility
* Cooldown - `getSummonCooldown()` based on contract stability (30s base, increases for unstable contracts)
* Location restrictions - `canSummonAtLocation()` allows world/safe_zone, restricts active dungeons/non-PvP arenas
* Dungeon restrictions - Safe floors allowed via `safeFloor` property on DungeonState
* PvP restrictions - Only allowed in active PvP arenas
* Creature mood - `getAffectionSummonBoost()` provides 20% boost for affection >= 50
* Contract stability - `CONTRACT_STABILITY_MIN_FOR_SUMMON` (20) required for summoning
* Element compatibility - Affects mana cost modifier and success chance via `getSummonSuccessModifiers()`

- [x] T6P.11 – Implement Creature Command interface

* Follow, Stay, Guard, Attack, Defend, Retreat, Scout, Gather, Track, Interact, Use Ability, Protect Ally, Avoid Combat
* Commands express player intent; Creature AI resolves execution using state, personality, training, loyalty, and world conditions

- [x] T6P.12 – Add Player Skills and Talent Tree categories

* Direct combat
* Summoner commands
* Elemental skills
* Crafting
* Travel
* Social
* Economy
* Housing
* PvP
* Guild leadership

- [ ] T6P.13 – Add Titles and Achievements systems

* Exploration
* Creature collection
* Crafting
* Economy
* Housing
* Dungeons
* PvP
* Guilds
* World completion
* Rare events

- [x] T6P.14 – Add Player Statistics tracking

* Worlds unlocked
* Creatures contracted
* Dungeons cleared
* Items crafted
* Trades completed
* Gold earned
* Bosses defeated
* PvP wins
* Housing value
* Guild contributions
* Quests completed

- [ ] T6P.15 – Add Player Reputation foundation

* world_rep
* faction_rep
* settlement_rep
* creature_rep
* Reputation affects merchant prices, creature capture chance, settlement growth, dungeon difficulty, and NPC reactions

- [x] T6P.16 – Refactor save/load so PlayerCoreState is the root save aggregate

* Player-owned contracts remain attached to player save data
* Creature AI state remains creature/world state
* Quest history, housing, economy state, reputation, achievements, statistics, and world unlocks persist under Player Core

- [ ] T6P.17 – Add Player Core tests

* Character creation creates valid PlayerCoreState
* Element/class decisions produce deterministic modifiers
* Inventory/equipment round-trip through save/load
* Creature contract cannot exist without player ownership
* Statistics and achievements update from events

## Sprint 7 – World Generation & Navigation (Month 7)
Sprint goal: expand world generation with weather, fast travel, biomes and settlements.

- [ ] T7.1 – Implement full Perlin/Voronoi biome generation (not just gradient)
- [ ] T7.2 – Add 5-8 major biomes per world (per GDD)
- [ ] T7.3 – Implement weather system (Clear, Cloudy, Rainy, Stormy, Foggy, Hail, Blizzard)
- [ ] T7.4 – Add weather effects: encounter tables, resource yield, elemental affinity bonus
- [ ] T7.5 – Implement fast travel: unlocked via discovered settlements, roads or creature-mounted traversal
- [ ] T7.6 – Add settlement placement (cities near rivers, forts on ridges, biased by biome)
- [ ] T7.7 – Implement `getBiomeForCoords` fully (not just dist-based gradient)
- [ ] T7.8 – Add resource respawn logic: plants 30 days, ore 90 days (game-time based)
- [ ] T7.9 – Implement world boundary handling (edge movement blocked, thematic message)
- [ ] T7.10 – Add minimap/radar expansion (radius configurable, fog-of-war render)
- [ ] T7.11 – Implement 100 floor seed system (`FLOOR_SEEDS` 1–100, deterministic PRNG)
- [ ] T7.12 – Verify same seed + coords gives identical tile for all players (determinism test)
- [ ] T7.13 – Add World Travel system from Player Core Bible
  - [ ] T7.13.1 – Walking travel
  - [ ] T7.13.2 – Mount creature travel
  - [ ] T7.13.3 – Road travel bonuses
  - [ ] T7.13.4 – Boat travel
  - [ ] T7.13.5 – Portal travel
  - [ ] T7.13.6 – Air travel
  - [ ] T7.13.7 – World gates
- [ ] T7.14 – Publish world travel events
  - [ ] T7.14.1 – PlayerEnteredWorld
  - [ ] T7.14.2 – PlayerEnteredBiome
  - [ ] T7.14.3 – BiomeEntered
  - [ ] T7.14.4 – WeatherChanged
  - [ ] T7.14.5 – ResourceSpawned
  - [ ] T7.14.6 – DungeonDiscovered
- [ ] T7.15 – Add World 100 progression map
  - [ ] T7.15.1 – Define unlock rules per world tier
  - [ ] T7.15.2 – Define world completion criteria
  - [ ] T7.15.3 – Connect completion to PlayerCoreState world unlocks

## Sprint 8 – Economy, Housing & Crafting (Month 8)
Sprint goal: implement full economic, housing and crafting system with career-based timers.

- [ ] T8.1 – Extend `ItemTemplate`: crafting tiers (basic, intermediate, advanced, artifact)
- [ ] T8.2 – Implement basic crafting: wood/stone/simple tools, workshop free
- [ ] T8.3 – Implement intermediate crafting: ore/herbs/elemental catalysts, workshop required
- [ ] T8.4 – Implement advanced crafting: crystals/essence/legendary parts, city-level infrastructure
- [ ] T8.5 – Add artifact system: unique recipes, exploration/quest unlock, 1-per-world restriction
- [ ] T8.6 – Create `Structure` model and placement system (house, farm, workshop, manor, castle, town)
- [ ] T8.7 – Implement housing economic impact: passive income (NPC taxes, resource refinement)
- [ ] T8.8 – Add town hall upgrade + regional policies (trade tariffs, creature protection, festival bonuses)
- [ ] T8.9 – Implement town founding: ≥5 buildings + World 15
- [ ] T8.10 – Create settlement economic simulation: goods ledger, supply/demand curves
- [ ] T8.11 – Implement price formula: `Price(i) = BasePrice × (1 + k × (Demand − Supply))`
- [ ] T8.12 – Add NPC merchant logic: cash reserves, inventory limits, restock, player undercut reaction
- [ ] T8.13 – Implement inflation sinks: housing taxes, repair costs, fusion material decay
- [ ] T8.14 – Add trade caravan system (inter-world, World 1 raw → World 50 refined arbitrage)
- [ ] T8.15 – Integrate career passives into economy: Shopkeeper `selling_price_pct`/`store_traffic_pct`, Broker `caravan_speed_pct`/`tariff_discount_pct`, Official `settlement_tax_revenue_pct`
- [ ] T8.16 – Implement non-combat career timers:
  - [ ] T8.16.1 – Shopkeeper: storefront customer arrival timer (base 5min reduced by tree modifier), bulk purchase chance
  - [ ] T8.16.2 – Blacksmith: smelting queue (30s per bar, background process), "Blast Furnace Mastery" speed boost
  - [ ] T8.16.3 – Broker: trade route timer, arbitrage opportunity detection, caravan departure scheduling
- [ ] T8.17 – Add Profession system
  - [ ] T8.17.1 – Blacksmith profession progression
  - [ ] T8.17.2 – Explorer profession progression
  - [ ] T8.17.3 – Shopkeeper profession progression
  - [ ] T8.17.4 – Broker profession progression
  - [ ] T8.17.5 – Official profession progression
  - [ ] T8.17.6 – Summoner profession progression
- [ ] T8.18 – Add Marketplace rules from Player Core Bible
  - [ ] T8.18.1 – Binding restrictions
  - [ ] T8.18.2 – Rarity restrictions
  - [ ] T8.18.3 – Listing fees
  - [ ] T8.18.4 – Trade taxes
  - [ ] T8.18.5 – Fraud prevention checks
  - [ ] T8.18.6 – Contract listing rules for eligible creatures
- [ ] T8.19 – Publish economy events
  - [ ] T8.19.1 – ItemCrafted
  - [ ] T8.19.2 – ItemTraded
  - [ ] T8.19.3 – MarketListingCreated
  - [ ] T8.19.4 – MarketListingPurchased
  - [ ] T8.19.5 – CurrencyChanged
  - [ ] T8.19.6 – SettlementDemandChanged

## Sprint 9 – NPCs, Quests & Ecosystem (Month 9)
Sprint goal: NPC AI, quest generation, ecosystem simulation, ecological balance and career-based event timers.

- [ ] T9.1 – Create `NamePool` system: culture-themed dictionary, seeded by world biome
- [ ] T9.2 – Implement NPC schedule: hourly routines (sleep, work, travel, market, tavern)
- [ ] T9.3 – Add NPC relationships: affinity values (friendship, rivalry, romance)
- [ ] T9.4 – Implement NPC travel: walk between settlements, carry goods, robbery/monster interrupts
- [ ] T9.5 – Add marriage/inheritance: NPC families pass property/wealth, demographic shifts
- [ ] T9.6 – Implement faction AI: NPC alignments, faction power shifts from quest outcomes
- [ ] T9.7 – Create rumor system: NPCs share world-state info (boss weakness, hidden quests) based on trust
- [ ] T9.8 – Enhance quest generation: templated (story/legendary) + procedural (faction/exploration/crafting)
- [ ] T9.9 – Add quest parameter pull from world state (available monsters, missing resources, NPC needs)
- [ ] T9.10 – Implement ecosystem simulation algorithm (per World Tick):
  - [ ] T9.10.1 – Resource regeneration (plants 30 days, ore 90 days)
  - [ ] T9.10.2 – Population dynamics (birth, death, migration)
  - [ ] T9.10.3 – Player impact (overhunting 60 day penalty, deforestation → herbivore carrying capacity, pollution)
- [ ] T9.11 – Add ecological balance compensator: <10% baseline triggers Sanctuary event for 3 days
- [ ] T9.12 – Implement keystone species loss → biome shift (forest → barren, 30 days unresolved)
- [ ] T9.13 – Test 1000-tick ecosystem simulation (overhunting crash + recovery)
- [ ] T9.14 – Integrate career passives into ecosystem: Explorer `weather_penalty_reduction_pct`, Official `public_order_pct`/`settlement_upgrade_cost_pct`
- [ ] T9.15 – Implement Official bureaucracy timers: Tax Edict 1h game-time delay, Civil Unrest accumulator, policy effect tick
- [ ] T9.16 – Publish NPC and quest events
  - [ ] T9.16.1 – NPCMetPlayer
  - [ ] T9.16.2 – NPCReputationChanged
  - [ ] T9.16.3 – NPCQuestOffered
  - [ ] T9.16.4 – NPCShopInventoryChanged
  - [ ] T9.16.5 – FactionStandingChanged
  - [ ] T9.16.6 – PlayerStartedQuest
  - [ ] T9.16.7 – PlayerCompletedQuest
- [ ] T9.17 – Connect Player Reputation to NPC, faction, settlement, and creature systems
  - [ ] T9.17.1 – Reputation affects merchant prices
  - [ ] T9.17.2 – Reputation affects creature capture chance
  - [ ] T9.17.3 – Reputation affects settlement growth
  - [ ] T9.17.4 – Reputation affects dungeon difficulty
  - [ ] T9.17.5 – Reputation affects NPC dialogue and quest access

## Sprint 10 – Save System, Testing & Polish (Month 10)
Sprint goal: save system, testing, accessibility, performance, bugs and Three Clean Panels UI.

- [ ] T10.0 – Add local typed EventBus foundation before save/load work
  - [ ] T10.0.1 – Define typed event names
  - [ ] T10.0.2 – Define payload schemas
  - [ ] T10.0.3 – Add deterministic handler ordering
  - [ ] T10.0.4 – Add priority support where needed
  - [ ] T10.0.5 – Add debug logging
  - [ ] T10.0.6 – Add event replay for tests
  - [ ] T10.0.7 – Add offline event queue
  - [ ] T10.0.8 – Add idempotent handler guidance
- [ ] T10.1 – Implement 3 manual save slots + 1 auto-slot (5 min real-time interval)
- [ ] T10.2 – Add save/load slot selection UI (in StartScreen)
- [ ] T10.3 – Implement JSON export/import (challenge runs, new game+ seeds)
- [ ] T10.4 – Add optimistic concurrency: `version` field per entity, delta patch sync (future MMO)
- [ ] T10.5 – Create SemVer migration script structure `/migrations/sqlite-to-postgres/`
- [ ] T10.6 – Write `xpCurve.test.ts`: verify Level 1–1000 XP thresholds match spec
- [ ] T10.7 – Write `fusionMatrix.test.ts`: 1000 random pairings → expected elements
- [ ] T10.8 – Write `economySim.test.ts`: 1000-tick simulation → price bounds check
- [ ] T10.9 – Write `ecosystemSim.test.ts`: overhunting crash + recovery
- [ ] T10.10 – Write `generateWorld.test.ts`: `generateWorld(seed) => validBiomeMap` (no NaN, no empty tiles)
- [ ] T10.11 – Write `fuse.test.ts`: `fuse(a, b) => result has valid skills list`
- [ ] T10.12 – Write `levelUp.test.ts`: `levelUp(creature) => XP never decreases`
- [ ] T10.13 – Add accessibility: ARIA live regions for log, font scaling (12–24px), high contrast toggle, keyboard-only navigation
- [ ] T10.14 – Add tab-completion command history (arrow keys)
- [ ] T10.15 – Performance: lazy-load creature sprites, chunk world tile data, initial bundle < 400 KB gzipped
- [ ] T10.16 – Verify all colored log thresholds (warning/error/success/combat/system)
- [ ] T10.17 – Add `careerTree.test.ts`: `getAggregateStats` sums correctly, `respecAllNodes` returns points and resets tree
- [ ] T10.18 – Create career tree respec UI (button in SkillTreePanel that triggers `respecAllNodes` and updates PlayerState)
- [ ] T10.19 – Restructure UI into three panels (Left: Status Board, Center: Operations Desk, Right: Dynamic Activity Monitor)
- [ ] T10.20 – Add mission queue persistence to save/load system (missions saved in state)
- [ ] T10.21 – Add mission completion log: collapsible battle log history, reward preview, XP gain animation
- [ ] T10.22 – Add event replay test suite
  - [ ] T10.22.1 – Replay PlayerEnteredBiome and verify Spawn Manager, Quest System, Weather, and Economy reactions
  - [ ] T10.22.2 – Replay PlayerCraftedItem and verify inventory, statistics, achievements, and economy updates
  - [ ] T10.22.3 – Replay PlayerSummonedCreature and verify contract, cooldown, and creature state updates
- [ ] T10.23 – Add Player Core UI panels
  - [ ] T10.23.1 – Character profile
  - [ ] T10.23.2 – Inventory
  - [ ] T10.23.3 – Equipment
  - [ ] T10.23.4 – Creature contracts
  - [ ] T10.23.5 – Titles
  - [ ] T10.23.6 – Achievements
  - [ ] T10.23.7 – Statistics
  - [ ] T10.23.8 – Reputation

## Sprint 11 – Online Infrastructure (Month 11)
Sprint goal: server-authoritative architecture, database migration, account system.

- [ ] T11.1 – Create `services/IGameService.ts` interface (abstraction layer for backend swap)
- [ ] T11.2 – Implement `OfflineGameService` (SQLite/sql.js) and `OnlineGameService` (fetch/WebSocket)
- [ ] T11.3 – Set up Prisma + PostgreSQL (`schema.prisma` per TechnicalSpec)
- [ ] T11.4 – Create all 12 Prisma models: Player, World, Tile, CreatureTemplate, Creature, ItemTemplate, InventoryItem, Structure, Settlement, QuestInstance, NPC, DungeonRun
- [ ] T11.5 – Write SQLite → PostgreSQL migration script (`/migrations/sqlite-to-postgres/`)
- [ ] T11.6 – Add Express + Socket.IO server base structure
- [ ] T11.7 – Implement account system: email + password, bcrypt hash, registration/login
- [ ] T11.8 – Add JWT session management or session cookie
- [ ] T11.9 – Replace localStorage with cloud save (server-authoritative state)
- [ ] T11.10 – Implement deterministic seed sync (server sends seed, client generates same world)
- [ ] T11.11 – Add event sourcing pattern for all state changes (planned backend)
- [ ] T11.12 – Implement client-side state prediction + server reconciliation (minimize perceived latency)
- [ ] T11.13 – Add server-authoritative event validation
  - [ ] T11.13.1 – CurrencyChanged
  - [ ] T11.13.2 – ItemTraded
  - [ ] T11.13.3 – MarketListingPurchased
  - [ ] T11.13.4 – PlayerLevelChanged
  - [ ] T11.13.5 – CreatureContracted
  - [ ] T11.13.6 – CreatureFused
  - [ ] T11.13.7 – PvPMatchResult
  - [ ] T11.13.8 – GuildBankChanged
- [ ] T11.14 – Add event stream audit tooling
  - [ ] T11.14.1 – Event source
  - [ ] T11.14.2 – Payload summary
  - [ ] T11.14.3 – Handler count
  - [ ] T11.14.4 – Processing time
  - [ ] T11.14.5 – Failed handlers
  - [ ] T11.14.6 – Replay controls

## Sprint 12 – MMO Alpha Features (Month 12)
Sprint goal: first MMO-connected features.

- [ ] T12.1 – Implement global chat (instanced channels per world)
- [ ] T12.2 – Implement mail system (player-to-player, attachment support)
- [ ] T12.3 – Add party system: create/join/leave, dungeon matchmaking
- [ ] T12.4 – Implement dungeon party sync (real-time state via WebSocket)
- [ ] T12.5 – Create guild CRUD (create, invite, accept, leave, disband)
- [ ] T12.6 – Implement guild hall + shared vault (item storage)
- [ ] T12.7 – Add nearby players radar (server-side proximity query)
- [ ] T12.8 – Implement location broadcast (WebSocket, 5-tile proximity)
- [ ] T12.9 – Create chat message filtering + report system
- [ ] T12.10 – Add friend list + block list
- [ ] T12.11 – Implement cross-world player search (global leaderboard)
- [ ] T12.12 – Test 50+ concurrent player load (stress test)

## Sprint 13 – MMO Beta: Economy & PvP (Month 13)
Sprint goal: complete economy, PvP and world events.

- [ ] T13.1 – Implement player-driven market (auction house, regional pricing)
- [ ] T13.2 – Add listing + bidding logic, expiry + auto-return
- [ ] T13.3 – Implement PvP arena (ranked seasons, matchmaking, bounties)
- [ ] T13.4 – Add open-world PvP (consent-based zones, faction wars)
- [ ] T13.5 – Implement server-wide world events (raid bosses, server participation)
- [ ] T13.6 – Create world boss schedule (calendar, notifications, scaling to participant count)
- [ ] T13.7 – Implement guild vs guild territory control (persistent territories)
- [ ] T13.8 – Add territory taxation + resource income for controlling guild
- [ ] T13.9 – Implement inter-world trade routes (World 1 cheap raw → World 50 expensive refined)
- [ ] T13.10 – Create caravan escort PvE/PvP content (interceptable by other players/monsters)
- [ ] T13.11 – Implement dynamic event loot scaling (legendary items never trivial)
- [ ] T13.12 – Add economy health monitoring (price deviation < 5% between regions)

## Sprint 14 – Launch & Operations (Month 14)
Sprint goal: deployment, CI/CD, analytics, monetization, launch.

- [ ] T14.1 – Create Terraform infrastructure (AWS/GCP, auto-scaling game servers)
- [ ] T14.2 – Set up CDN for static assets (sprites, map tiles, creature spritesheets)
- [ ] T14.3 – Integrate Elasticsearch quest log search + codex lookup
- [ ] T14.4 – Set up analytics pipeline (event streaming → ClickHouse / DataDog)
- [ ] T14.5 – Add monetization layer: cosmetic skins, QoL items, expansion passes
- [ ] T14.6 – Implement pay-to-win safeguard (all gameplay items craftable/obtainable in-game)
- [ ] T14.7 – Create automated price floor/ceiling monitoring + dev-tool scenario testing
- [ ] T14.8 – Write CI pipeline (lint, typecheck, test, build, deploy)
- [ ] T14.9 – Set up monitoring + alerting (server health, DB latency, player count)
- [ ] T14.10 – Add mod support framework (JSON data mods, optional Lua scripting)
- [ ] T14.11 – Test full regression (100 world progression simulation, economy stability 30 days)
- [ ] T14.12 – Prepare launch checklist, beta signup, marketing site integration

## Sprint 15 – Player-First World Systems Expansion

Sprint goal: extend the player-first architecture with world memory, creature social simulation, dynamic dungeon history, reputation, threats, genealogy, and player-driven world shaping.

These tasks should be implemented through the Event-Driven Architecture document where possible.

T15.1 – World Identity Memory System
- [ ] T15.1.1 – Create WorldIdentityState model
* aggression_score
* ecology_score
* trade_score
* exploration_score
* dungeon_activity_score
- [ ] T15.1.2 – Add world personality modifiers
* aggressive worlds → more elite encounters
* ecological worlds → more Sanctuary events
* trade worlds → more merchant spawns
- [ ] T15.1.3 – Add world memory update rules
* hunting, crafting, trading, dungeon clearing
* [ ] T15.1.4 – Add world personality UI indicator
* “World Mood” panel in Status Board

T15.2 – Creature Social Ecosystem (Pack, Herd, Territory AI)
- [ ] T15.2.1 – Add CreatureBehaviorProfile
* pack_behavior
* herd_behavior
* territorial_behavior
- [ ] T15.2.2 – Implement pack AI
* wolves, raptors, thunder hawks
* pack retaliation on capture
- [ ] T15.2.3 – Implement herd AI
* herbivores migrate together
* panic events when attacked
- [ ] T15.2.4 – Implement territory AI
* rare creatures claim tiles
* entering territory triggers special encounter
- [ ] T15.2.5 – Add ecosystem tick integration
* pack/herd migration
* territory expansion/decline

T15.3 – Dynamic Dungeon Difficulty (Activity‑Based Scaling)
- [ ] T15.3.1 – Add DungeonActivityState
* clear_count
* death_count
* idle_time
- [ ] T15.3.2 – Add scaling rules
* high activity → stronger monsters
* low activity → calmer floors
- [ ] T15.3.3 – Add elite spawn probability modifier
- [ ] T15.3.4 – Add boss adaptive ability unlocks
* boss gains new ability if defeated > X times
- [ ] T15.3.5 – Add dungeon activity UI indicator

T15.4 – Career Tree Synergy Events
- [ ] T15.4.1 – Add cross‑career synergy matrix
* Explorer + Summoner
* Blacksmith + Shopkeeper
* Broker + Official
- [ ] T15.4.2 – Add synergy event triggers
* exploration streak
* crafting streak
* trade route completion
- [ ] T15.4.3 – Add synergy bonuses
* creature loyalty boost
* masterwork crafting buff
* settlement tax bonus
- [ ] T15.4.4 – Add synergy event UI popups

T15.5 – Global World Threats (Procedural Catastrophes)
- [ ] T15.5.1 – Add WorldThreatEvent model
* Elemental Storm
* Crystal Bloom
* Ecosystem Collapse
- [ ] T15.5.2 – Add threat generation rules
* triggered by world personality
* triggered by ecosystem imbalance
- [ ] T15.5.3 – Add threat effects
* encounter tables
* resource yield
* creature affinity bonuses
- [ ] T15.5.4 – Add threat resolution quests
- [ ] T15.5.5 – Add threat UI banner (global alert)

T15.6 – Creature Personality System
- [ ] T15.6.1 – Add CreaturePersonality traits
* Brave
* Cowardly
* Curious
* Lazy
* Loyal
- [ ] T15.6.2 – Add personality roll on creature creation
- [ ] T15.6.3 – Add personality effects
* flee chance
* loot discovery
* XP gain
* capture synergy
- [ ] T15.6.4 – Add personality UI in creature panel

T15.7 – Player Reputation System
- [ ] T15.7.1 – Add ReputationState
* world_rep
* faction_rep
* settlement_rep
* creature_rep
- [ ] T15.7.2 – Add reputation gain/loss rules
* quests
* trading
* ecosystem impact
* dungeon clearing
- [ ] T15.7.3 – Add reputation effects
* merchant prices
* creature capture chance
* settlement growth
* dungeon difficulty
- [ ] T15.7.4 – Add reputation UI panel

T15.8 – Dungeon Lore Memory (Tower History System)
- [ ] T15.8.1 – Add DungeonHistoryState
* player deaths
* boss kills
* puzzle solves
- [ ] T15.8.2 – Add persistent floor markers
* Echo of Defeat
* Champion’s Mark
* Solved Puzzle Seal
- [ ] T15.8.3 – Add lore events
* special encounters based on history
- [ ] T15.8.4 – Add tower history UI timeline

T15.9 – Creature Fusion Genealogy
- [ ] T15.9.1 – Add FusionLineage model
* parentA
* parentB
* lineageDepth
- [ ] T15.9.2 – Add lineage inheritance rules
* trait inheritance
* mutation inheritance
- [ ] T15.9.3 – Add lineage bonuses
* rare lineage → cosmetic
* mythical lineage → stat bonus
- [ ] T15.9.4 – Add lineage viewer UI

T15.10 – Player‑Driven World Shaping
- [ ] T15.10.1 – Add buildable world structures
* roads
* watchtowers
* shrines
* guild fortresses
- [ ] T15.10.2 – Add structure effects
* fast travel unlock
* reduced monster spawns
* elemental buffs
* territory control
- [ ] T15.10.3 – Add world‑shaping missions
* build road
* build shrine
* fortify settlement
- [ ] T15.10.4 – Add world map visual updates

T15.11 – End Game: Floor 100 Demonlord Throne Cycle
- [ ] T15.11.1 – Define Floor 100 Demonlord victory condition
* player reaches Floor 100 dungeon
* player challenges the active Demonlord
* player defeats the Demonlord in boss combat
* victory publishes DemonlordDefeated and DemonlordThroneClaimed events
- [ ] T15.11.2 – Promote victorious player into Demonlord state
* set player as active Demonlord
* unlock Demonlord title
* unlock Demonlord floor manager interface
* preserve player history, achievements, reputation, statistics, and legacy records
* mark Demonlord reign start timestamp
- [ ] T15.11.3 – Implement Demonlord Floor Manager powers
* configure floor themes within allowed rules
* assign or bias room types
* place elite encounters within budget
* choose boss modifiers
* set floor policies for rest/vendor/trap frequency
* manage Demonlord influence on floors 50-100
* publish auditable floor manager events
- [ ] T15.11.4 – Implement mandatory challenger acceptance rule
* any eligible player may issue a Demonlord challenge
* active Demonlord must accept the challenge
* challenge cannot be ignored indefinitely
* refusal timer auto-accepts when expired
* challenge result updates world and dungeon history
- [ ] T15.11.5 – Implement Demonlord defeat reset
* defeated Demonlord loses active Demonlord status
* defeated Demonlord restarts from Floor 1
* preserve achievements
* preserve reputation
* preserve history and titles as legacy records
* preserve account/player identity
* clear only active tower position, active reign powers, and current Demonlord authority
- [ ] T15.11.6 – Implement failed challenger respawn
* challenger who fails to defeat Demonlord respawns normally
* challenger does not become Demonlord
* challenger keeps normal progression according to existing death/respawn rules
* dungeon history records failed challenge
- [ ] T15.11.7 – Add Demonlord reign history
* previous Demonlord list
* reign duration
* challengers defeated
* floor changes made
* final defeat record
* public tower history timeline
- [ ] T15.11.8 – Add end-game activity loops around Demonlord reign
* guild support for Demonlord challenges
* PvP seasons around tower control
* high-tier crafting for challenge preparation
* marketplace demand spikes before challenges
* world threats influenced by long Demonlord reigns

T15.12 – Creature Bible Integration
- [ ] T15.12.1 – Create Creature Bible wrapper document
* Position Creature AI Bible as Technical Appendix A
* Define creatures as player tools, companions, combat units, economy objects, world inhabitants, and simulation entities
- [ ] T15.12.2 – Connect Creature AI to Player Commands
* Player intent
* Creature command
* Creature AI decision
* World event result
* Player progression consequence
- [ ] T15.12.3 – Add contract-aware Creature AI rules
* loyalty
* trust
* command permissions
* refusal cases
* training impact
- [ ] T15.12.4 – Add creature economy rules
* trade status
* breeding rights
* marketplace listing slots
* PvP eligibility

## Sprint 16 – Documentation Volume Completion

Sprint goal: complete the documentation structure defined under `docs/`, with design-source volumes in `docs/Sumoner_World_dec/`, so future implementation work has one coherent player-first design source.

- [ ] T16.1 – Create `30_Creature_Bible.md`
  - [ ] T16.1.1 – Define creature role as player tool and companion
  - [ ] T16.1.2 – Link existing Creature AI Bible parts as technical appendices
  - [ ] T16.1.3 – Document contracts, slots, summoning, commands, training, evolution, fusion, genetics, mutation, behavior, and ecology
- [ ] T16.2 – Create `31_World_Bible.md`
  - [ ] T16.2.1 – Document 100-world structure
  - [ ] T16.2.2 – Document world travel and gates
  - [ ] T16.2.3 – Document biomes, weather, seasons, settlements, roads, memory, threats, and player shaping
- [ ] T16.3 – Create `32_Economy_Bible.md`
  - [ ] T16.3.1 – Document inventory economy
  - [ ] T16.3.2 – Document crafting tiers
  - [ ] T16.3.3 – Document housing and building economy
  - [ ] T16.3.4 – Document trade, marketplace, taxes, fees, sinks, professions, and settlement demand
- [ ] T16.4 – Create `33_NPC_Bible.md`
  - [ ] T16.4.1 – Document NPC identity, schedules, relationships, factions, rumors, quest hooks, trainers, merchants, and reputation
- [ ] T16.5 – Create `34_MMORPG_Bible.md`
  - [ ] T16.5.1 – Document accounts, friends, guilds, chat, parties, PvP, shared marketplace, server authority, moderation, live operations, and scaling
- [ ] T16.6 – Split Player Core Bible into chapter files if it exceeds maintainable size
  - [ ] T16.6.1 – Character Creation
  - [ ] T16.6.2 – Summoner Classes
  - [ ] T16.6.3 – Elements
  - [ ] T16.6.4 – Inventory and Equipment
  - [ ] T16.6.5 – Creature Contracts and Commands
  - [ ] T16.6.6 – Skills and Talents
  - [ ] T16.6.7 – Housing, Economy, Guilds, PvP, Achievements, Statistics, Save System, End Game
- [ ] T16.7 – Update `29_Task_Alignment_Matrix.md` after each major task-file change
- [ ] T16.8 – Add documentation consistency check
  - [ ] T16.8.1 – Every active sprint maps to a documentation volume
  - [ ] T16.8.2 – Every documentation volume maps to at least one sprint/task group
  - [ ] T16.8.3 – Completed tasks have implementation notes or verification references
