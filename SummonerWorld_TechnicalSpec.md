# SummonerWorld – Technical Specification
**Stack:** React 18+ / TypeScript / TailwindCSS / Vite  
**Database (Prototype):** SQLite via `better-sqlite3` or `sql.js`  
**Database (Online):** PostgreSQL 15+ with JSONB, Prisma ORM  
**Target Platforms:** Modern browsers (Chrome, Firefox, Edge, Safari)  
**Offline Support:** Service Workers + IndexedDB for cached assets  

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   React UI  │  │ Game Engine  │  │ Save Manager  │ │
│  │  (TS/Tail)  │  │   (Core)     │  │  (JSON/SQLite)│ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘ │
│         │                │                  │         │
│         └────────────────┼──────────────────┘         │
│                          │                            │
│                  ┌───────┴────────┐                  │
│                  │ State Layer    │                  │
│                  │ (Zustand)      │                  │
│                  └───────────────┘                  │
└─────────────────────────────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
     Offline (Prototype)           Online (MMO)
           │                             │
     Local JSON / SQLite          Express + Socket.IO
     State: Zustand persist        State: Server-authoritative
     Assets: Static bundle         Assets: CDN + WS streaming
```

---

## 2. Database Schema (SQLite → PostgreSQL)

### 2.1 Entity Relationship Overview
- `Player` – character data (1:1 with `PlayerProgress` and `PlayerSettings`).
- `World` – procedural parameters and global world state.
- `Tile` – map data (X, Y, biome, resources, discovered flag).
- `Creature` – instance-level creature data (mutable template).
- `CreatureTemplate` – immutable base stats, sprites, fusion recipes.
- `Item` – item definitions (immutable templates).
- `Inventory` – player-item junction with quantity.
- `Structure` – placed buildings on tiles (housing system).
- `Settlement` – town/city summary tables derived from structures.
- `Quest` – active quest instances tied to player.
- `NPC` – simulation entities with schedules.
- `DungeonRun` – active dungeon session state.

### 2.2 Schema Definition (Prisma / PostgreSQL)

```prisma
// schema.prisma

model Player {
  id              String    @id @default(cuid())
  username        String    @unique
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Core progression
  name            String
  gender          String
  appearance      Json
  elementPrimary  String    // Fire, Water, Earth...
  elementSecondary String?
  elementTertiary  String?

  // Stats
  level           Int       @default(1)
  experience      BigInt    @default(0)
  health          Int
  maxHealth       Int
  mana            Int
  maxMana         Int

  // Position & world
  currentWorldId  Int
  tileX           Int
  tileY           Int
  dayCount        Int       @default(1)
  gameTimeMinutes Int       @default(420) // 07:00 start

  // Relations
  creatures       Creature[]
  inventory       InventoryItem[]
  structures      Structure[]
  quests          QuestInstance[]
  dungeonRuns     DungeonRun[]

  // Legacy JSON save flag
  migratedFromJson Boolean   @default(false)
}

model World {
  id              Int      @id
  seed            BigInt
  name            String
  tier            Int
  bossDefeated    Boolean  @default(false)
  dungeonFloors   Int
  ecosystemState  Json     // population matrices, global weather

  // Relations
  tiles           Tile[]
  settlements     Settlement[]
  npcs            NPC[]

  @@unique([seed, tier])
}

model Tile {
  id              String   @id @default(cuid())
  worldId         Int
  world           World    @relation(fields: [worldId], references: [id])

  x               Int
  y               Int
  biome           String   // forest, desert, tundra...
  discovered      Boolean  @default(false)

  // Resources
  resourceType    String?
  resourceQty     Int?
  resourceRespawn DateTime?

  // Structures (0 or 1 per tile for simplicity)
  structure       Structure?

  // Creature spawn seed
  spawnSeed       BigInt?

  @@unique([worldId, x, y])
}

model CreatureTemplate {
  id              String   @id @default(cuid())
  keyName         String   @unique // "fire_wolf", "stormfire_beast"
  displayName     String

  // Classification
  class           String   // Common, Uncommon, Rare, Epic, Legendary, Mythical
  elementPrimary  String
  elementSecondary String?

  // Base stats
  baseHealth      Int
  baseAttack      Int
  baseDefense     Int
  baseSpeed       Int
  baseMana        Int
  baseExpValue    Int

  // Mechanical
  maxSkills       Int
  evolvesFromId    String?  @unique
  evolvesIntoId    String?  @unique
  fusionRecipes   Json     // [{inputs: [keyA, keyB], outputKey, chance}]

  // Content
  spritePath      String?
  description     String
  flavorText      String?
}

model Creature {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  templateId      String
  template        CreatureTemplate @relation(fields: [templateId], references: [id])

  nickname        String?

  // Mutable instance state
  level           Int      @default(1)
  experience      BigInt   @default(0)
  currentHealth   Int
  currentMana     Int

  // Derived / rolled
  skills          Json     // [string]: learned skill keys
  traits          Json     // [string]: active trait keys
  mutations       Json     // [string]: applied mutation keys
  affection       Int      @default(0) // toward player

  createdAt       DateTime @default(now())
}

model ItemTemplate {
  id              String   @id @default(cuid())
  keyName         String   @unique
  name            String
  itemType        String   // material, equipment, consumable, special
  subtype         String?  // weapon, armor, herb, crystal...
  rarity          String
  stackable       Boolean  @default(true)
  maxStack        Int      @default(99)
  description     String
  iconPath        String?

  // JSON for variants
  stats           Json?    // { attack: 5, element: "fire" }
  requirements    Json?    // { level: 10, profession: "blacksmith" }
}

model InventoryItem {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  templateId      String
  template        ItemTemplate @relation(fields: [templateId], references: [id])

  quantity        Int
  durability      Int?    // for equipment
  modifiers       Json?   // random affixes

  @@unique([playerId, templateId])
}

model Structure {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  worldId         Int
  tileId          String   @unique
  tile            Tile     @relation(fields: [tileId], references: [id], onDelete: Cascade)

  type            String   // house, farm, workshop, manor, castle, town
  level           Int      @default(1)
  builtAt         DateTime @default(now())
  lastCollected   DateTime?

  // Economic output
  storageCapacity Int
  npcSlots        Int      @default(0)
  productionQueue Json?
}

model Settlement {
  id              String   @id @default(cuid())
  worldId         Int
  name            String
  x               Int
  y               Int
  population      Int      @default(0)
  faction         String?  // controlled by player / NPC faction
  treasury        BigInt   @default(0)
  tradeGoods      Json
  policies        Json?
}

model QuestInstance {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id], onDelete: Cascade])

  questKey        String   // references immutable QuestTemplate
  title           String
  description     String

  status          String   // active, completed, failed, hidden
  objectives      Json     // [{type, target, current, max}]
  rewards         Json

  startedAt       DateTime @default(now())
  completedAt     DateTime?
}

model NPC {
  id              String   @id @default(cuid())
  worldId         Int
  settlementId    String?

  name            String
  role            String   // merchant, blacksmith, guard, noble...

  // Schedule: hourly array of {x, y, action}
  scheduleJson    Json

  // Economy
  cash            BigInt
  inventory       Json     // [{itemKey, qty, price}]

  // Personality / relationships
  personality     String?
  playerAffection Int       @default(0)

  @@index([worldId, settlementId])
}

model DungeonRun {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  worldId         Int
  currentFloor    Int
  maxFloor        Int

  state           Json     // rooms explored, keys found, boss triggered
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  defeated        Boolean  @default(false)
}
```

---

## 3. React / TypeScript State Management

### 3.1 Architecture: Zustand + React Query + Context

```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  // Core
  playerId: string | null;
  currentWorld: number;
  currentTile: { x: number; y: number };
  gameTime: number; // minutes since start

  // Derived
  ui: {
    activeScreen: 'explore' | 'inventory' | 'creatures' | 'map' | 'dungeon';
    log: string[];
    notifications: Notification[];
  };

  // Actions
  move: (dx: number, dy: number) => Promise<void>;
  search: () => Promise<SearchResult>;
  capture: (creatureKey: string) => Promise<CaptureResult>;
  fuse: (idA: string, idB: string) => Promise<FusionResult>;
  travel: (target: string) => Promise<void>;

  // Optimistic UI
  setUiScreen: (screen: UiScreen) => void;
  appendLog: (msg: string, type: LogType) => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        playerId: null,
        currentWorld: 1,
        currentTile: { x: 250, y: 250 },
        gameTime: 420,
        ui: { activeScreen: 'explore', log: [], notifications: [] },

        move: async (dx, dy) => {
          const { currentTile } = get();
          // ...validation, encounter roll, state update
          set((state) => ({
            currentTile: { x: currentTile.x + dx, y: currentTile.y + dy },
            gameTime: state.gameTime + 15,
          }));
        },

        appendLog: (msg, type) =>
          set((state) => ({
            ui: {
              ...state.ui,
              log: [...state.ui.log, `[${type}] ${msg}`].slice(-200),
            },
          })),
      }),
      {
        name: 'summonerworld-save',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          player: state.player,
          worlds: state.worlds,
          creatures: state.creatures,
        }),
      }
    )
  )
);
```

### 3.2 Service Layer (Abstraction for Backend Swap)

```typescript
// services/GameService.ts
export interface IGameService {
  getWorldState(worldId: number): Promise<WorldState>;
  movePlayer(dx: number, dy: number): Promise<ActionResult>;
  executeCombat(encounterId: string): Promise<CombatResult>;
  captureCreature(instanceId: string): Promise<CaptureResult>;
  saveGame(slotId?: string): Promise<void>;
  loadGame(slotId: string): Promise<PlayerState>;
}

// Offline implementation uses SQLite
export class OfflineGameService implements IGameService {
  private db: Database;
  constructor(dbPath: string) { this.db = new Database(dbPath); }
  // ...
}

// Online implementation uses fetch/WebSocket
export class OnlineGameService implements IGameService {
  private ws: WebSocket;
  constructor(endpoint: string) { /* ... */ }
  // ...
}
```

---

## 4. Offline Data Persistence (Prototype)

### 4.1 SQLite Schema (Mirrors Prisma schema above)
- Use `better-sqlite3` for synchronous, simple local access in Electron/Vite plugin.
- Tables: `Player`, `World`, `Tile`, `CreatureInstance`, `ItemStack`, `Structure`, `QuestProgress`, `NPCSchedule`.

### 4.2 JSON Backup Format (for debug / manual transfer)
```json
{
  "version": "1.0.0",
  "saveDateIso": "2026-06-14T20:00:00Z",
  "player": { /* Player fields */ },
  "worlds": [
    {
      "id": 1,
      "seed": 123456789,
      "bosseDefeated": false,
      "tiles": { "250,250": { /* biome, resources, discovered */ } }
    }
  ],
  "creatures": [ /* ... */ ]
}
```

---

## 5. Backend & Multiplayer Roadmap

### 5.1 Phase 0 – Offline Prototype (Current)
- Local SQLite / JSON only.
- No server.
- Deterministic world generation from seed + player start config.
- Test core loop, math, and UI.

### 5.2 Phase 1 – Online Prototype (6–8 weeks)
- Express + Socket.IO server.
- Single shared world instance per room.
- JSON → PostgreSQL migration script.
- Basic account system (email + password, bcrypt).
- Cloud save replaces localStorage.

### 5.3 Phase 2 – MMORPG Beta (3–4 months)
- PostgreSQL sharding strategy: one DB per world (100 shards).
- Redis for session cache, pub/sub for world events.
- Node.js game servers + horizontal scaling.
- Matchmaking for dungeon parties and PvP.
- Guild database tables and web socket rooms.

### 5.4 Phase 3 – Persistent World (Launch)
- AWS / GCP deployment with Terraform.
- CDN for static assets (sprites, creature spritesheets, map tiles).
- Elasticsearch for quest log search and codex lookup.
- Analytics pipeline (event streaming to ClickHouse / DataDog).

---

## 6. Procedural Generation Implementation Details

### 6.1 Seeded PRNG
- Use `seedrandom` library (Alea or xor128).
- Seed = `hash(worldIndex, playerIdHash, worldSeed)`.
- Ensures all clients generate identical worlds from the same data.

### 6.2 Biome Generation
```typescript
interface BiomeConfig {
  moisture: number;
  temperature: number;
  elevation: number;
}

function generateBiomeMap(seed: number, width: number, height: number): BiomeConfig[][] {
  const noise = new SimplexNoise(seed);
  const map: BiomeConfig[][] = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = {
        moisture: noise.noise2D(x * 0.05, y * 0.05),
        temperature: noise.noise2D(x * 0.05 + 1000, y * 0.05),
        elevation: noise.noise2D(x * 0.05 + 2000, y * 0.05),
      };
    }
  }
  return map;
}
```

### 6.3 Dungeon Layout
- Recursive backtracking for room placement.
- Ensure ≥ 3 shortest paths from entrance to boss.
- Guarantee minimum 1 treasure room per 10 floors.
- Thematic room naming based on world tier.

---

## 7. Save System & Data Integrity

### 7.1 Save Slots
- **3 manual slots** + **1 auto-slot** (written every 5 minutes of real-time).
- **Export / Import** as JSON for sharing (Challenge runs, new game+ seeds).

### 7.2 Optimistic Concurrency
- Single-player uses `version` field per entity.
- On sync (future): send delta patch with version; server rejects stale writes.

### 7.3 SemVer Migration Scripts
```
/migrations/sqlite-to-postgres/
  ├── seed-schema.sql
  ├── transform-player.js
  └── test-fixtures/
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)
- `xpCurve.test.ts` – verify level XP thresholds match spec.
- `fusionMatrix.test.ts` – 1000 random pairings produce expected elements.
- `economySim.test.ts` – 1000-tick simulation shows price bounds.
- `ecosystemSim.test.ts` – overhunting causes crash, then recovery.

### 8.2 Integration Tests
- `travelLoop.test.ts` – move 100 tiles, verify encounter rate and log output.
- `dungeonRun.test.ts` – full clear World 10 dungeon in simulation.

### 8.3 Property-Based Testing (fast-check)
- `generateWorld(seed) => validBiomeMap` (no NaN, no empty tiles).
- `fuse(a, b) => result has valid skills list`.
- `levelUp(creature) => XP never decreases`.

---

## 9. Deployment & Build

### 9.1 Build Tooling
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/ --ext ts,tsx",
    "db:generate": "prisma migrate dev --name init",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### 9.2 Performance Budgets
- Initial bundle: < 400 KB gzipped.
- World tile data streamed on demand (only load current + adjacent chunks).
- Creature sprites lazy-loaded via IntersectionObserver.

---

## 10. Open Questions & Future Decisions

| Topic | Decision Needed | Deadline |
|-------|-----------------|----------|
| Multiplayer authority model | Server-authoritative vs lock-step | Phase 1 |
| Turn length design | Async real-time (15s) vs true turns (player action = tick) | Prototype playtest |
| Mobile support | Responsive layout vs. native wrapper | Phase 0 |
| Mod support | JSON data mods vs Lua scripts | Phase 2 |
| Analytics | Self-hosted Plausible vs third-party | Phase 2 |

---

*End of Technical Specification v1.0.0*
