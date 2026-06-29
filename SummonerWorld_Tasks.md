# SummonerWorld – Sprint Task Breakdown

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
- [ ] T6.4.1 – Create generateDungeonFloor(worldIndex, floorIndex) function

Implement recursive backtracking maze generation

Produce a connected room graph with entrance and boss/exit rooms

Ensure deterministic generation using world seed + floor seed

- [ ] T6.4.2 – Add multi‑path guarantee (ensureMultipleShortestPaths)

Compute shortest path entrance → boss using BFS

Inject controlled shortcut edges until ≥ 3 distinct shortest paths exist

Re‑validate path uniqueness after each added edge

- [ ] T6.4.3 – Add treasure room placement logic

Each floor must contain ≥ 1 treasure room

Treasure room must be located far from entrance

Add optional secondary treasure rooms for large floors

- [ ] T6.4.4 – Implement room type assignment system

Assign room types: combat, trap, puzzle, treasure, rest, elite, vendor

Ensure biome/tier‑themed consistency

Guarantee at least 1 rest room every 10 floors

- [ ] T6.4.5 – Create generateDungeonTower(worldIndex) (Sword Art Online–style central tower)

Build continuous vertical tower

Floor count = BaseFloors + WorldIndex

Link floors vertically (exit → next entrance)

Mark safe floors (every 10th): rest area + vendor + teleport unlock

- [ ] T6.4.6 – Add boss floor generation rules

Final floor of each world contains a boss arena

Arena layout must be open, non‑maze

Add environmental hazards based on world element

Integrate boss scaling formula from GDD

- [ ] T6.4.7 – Add deterministic floor seed system (FLOOR_SEEDS)

Each floor uses hash(worldIndex, floorIndex, globalSeed)

Guarantee identical dungeon layout for all players

Add unit test: same seed → identical floor graph

- [ ] T6.4.8 – Add dungeon metadata export

Store floor graph, room types, treasure locations, boss room ID

Save into DungeonRun.state for persistence

Required for online synchronization and party dungeon runs

- [ ] T6.4.9 – Add pathfinding utilities

findShortestPath()

findAllShortestPaths()

calculateRoomDistanceMap()

Used for treasure placement, shortcut injection, boss logic.

- [ ] T6.4.10 – Add dungeon generation tests

100 generated floors → no disconnected rooms

≥ 3 shortest paths validated

≥ 1 treasure room per floor

Deterministic seed test

Boss floor always reachable.

- [ ] T6.5 – Add combat phase boss mechanics

Boss phases at HP thresholds 75%, 50%, 25%

Elemental shift per phase

Add environmental hazard rotation (lava bursts, frost spikes, storm pulses)

Integrate Summoner career bonuses into boss phase calculations

- [ ] T6.6 – Implement “Scan” ability for boss weakness discovery

Add SCAN skill to creature ability pool

Correct guess → reveal elemental weakness

Wrong guess → −70% damage penalty for 3 turns

Add UI feedback: “Weakness Identified” overlay..

- [ ] T6.7 – Add dungeon room types (trap, puzzle, treasure, elite, vendor)

Trap rooms: text‑based minigame (avoid, disarm, endure)

Puzzle rooms: logic riddles, pattern matching, rune alignment

Elite rooms: mini‑boss encounters with rare drops

Vendor rooms: temporary merchant with dungeon‑specific items

Treasure rooms: guaranteed loot chest + rare chance for mythical egg

- [ ] T6.8 – Implement dungeon floor count & progression rules

Floor count = BaseFloors + WorldIndex

World 1 → 3 floors + boss

World 50 → 100 floors + boss

Ascending requires defeating floor guardian or using rare teleport item

Dungeon exit scales player to minimum viable level (per GDD)
- [ ] T6.9 – Add "ascending requires defeating floor guardian" rule (or rare teleport item)
- [ ] T6.10 – Verify dungeon exit scales player to minimum viable level
- [ ] T6.11 – Add trap/puzzle minigame UI (text-based choices)
- [ ] T6.12 – Test full clear World 10 dungeon simulation (integration test)
- [ ] T6.13 – Integrate automated combat engine with timed missions: dungeon scouting and wild encounters resolved via `resolveAutomatedCombat()`
- [ ] T6.14 – Integrate career passives into combat: Summoner path `capture_bonus_pct`, Warrior path `damage_dealt_pct`, Guardian path `damage_taken_pct`

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

## Sprint 10 – Save System, Testing & Polish (Month 10)
Sprint goal: save system, testing, accessibility, performance, bugs and Three Clean Panels UI.

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
