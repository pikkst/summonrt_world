export type Screen = 'explore' | 'inventory' | 'creatures' | 'map' | 'dungeon' | 'settings' | 'combat' | 'quests' | 'gym' | 'acts' | 'login' | 'fusion' | 'skills' | 'creature_activity' | 'stats' | 'profile' | 'community' | 'missions';
export type CommunityTab = 'nearby' | 'messages' | 'party' | 'guild' | 'trade';

export type Element =
  | 'fire'
  | 'water'
  | 'earth'
  | 'air'
  | 'lightning'
  | 'iron'
  | 'nature'
  | 'ice'
  | 'light'
  | 'darkness'
  | 'void'
  | 'starlight'
  | 'chaos'
  | 'omni';

export interface ElementalAffinity {
  primary: Element;
  secondary?: Element;
  tertiary?: Element;
  learned?: Element[];
  traits?: string[];
}

export type CreatureClass = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';

export type CreatureType = 'beast' | 'dragon' | 'undead' | 'construct' | 'spirit' | 'demon' | 'celestial' | 'insect' | 'plant';

export interface Skill {
  key: string;
  name: string;
  description: string;
  element?: Element;
  power: number;
  cost: number;
}

export interface Trait {
  key: string;
  name: string;
  description: string;
}

export interface CreatureTemplate {
  key: string;
  name: string;
  class: CreatureClass;
  type: CreatureType;
  elements: Element[];
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseMana: number;
  baseExpValue: number;
  skills: Skill[];
  description: string;
  isBoss?: boolean;
  bossPhases?: BossPhase[];
  evolutionLevel?: number;
  evolvesIntoKey?: string;
  capturePool?: {
    compatibleElements: Element[];
  };
}

export interface TerritorialHostilityEntry {
  creatureKey: string;
  creatureName: string;
  class: CreatureClass;
  type: CreatureType;
  elements: Element[];
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseMana: number;
  baseExpValue: number;
  skills: { key: string; name: string; description: string; element?: Element; power: number; cost: number }[];
  description: string;
  isBoss?: boolean;
  hostilityTurns: number;
}

export interface ProceduralIdentity {
   headVariant: number;
   bodyVariant: number;
   limbVariant: number;
   elementalFx: {
     trail: string;
     aura: string;
     impact: string;
   };
   colorPalette: {
     primary: string;
     secondary: string;
     accent: string;
   };
 }

export interface CreatureInstance {
  id: string;
  templateKey: string;
  nickname?: string;
  type?: CreatureType;
  baseExpValue?: number;
  elements?: Element[];
  level: number;
  experience: bigint;
  currentHealth: number;
  currentMana: number;
  maxHealth: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  class?: string;
  skills: string[];
  traits: string[];
  mutations: string[];
  affection: number;
  isBossSummon?: boolean;
  evolutionStage?: number;
  evolvedFromKey?: string;
  synergyEffects?: string[];
  proceduralIdentity?: ProceduralIdentity;
  fusionRecipe?: {
    parentAKey: string;
    parentBKey: string;
  };
}

export type ItemType = 'material' | 'equipment' | 'consumable' | 'special' | 'egg';
export type ItemSubType = 'weapon' | 'armor' | 'accessory' | 'herb' | 'crystal' | 'essence' | 'fragment';

export interface ItemTemplate {
  key: string;
  name: string;
  type: ItemType;
  subtype?: ItemSubType;
  rarity: number;
  stackable: boolean;
  maxStack: number;
  description: string;
  stats?: Record<string, number>;
  requirements?: Record<string, number | string>;
}

export interface InventoryStack {
  templateKey: string;
  quantity: number;
  modifiers?: Record<string, any>;
}

export type BiomeType =
  | 'forest'
  | 'plains'
  | 'mountains'
  | 'swamp'
  | 'desert'
  | 'tundra'
  | 'coast'
  | 'volcanic'
  | 'crystal_caves'
  | 'sky_islands';

export interface TileData {
  x: number;
  y: number;
  biome: BiomeType;
  discovered: boolean;
  explored: boolean;
  specialType?: 'city' | 'dungeon' | 'cave' | 'monument' | 'well' | 'ruins' | 'outpost' | 'grove' | 'shrine';
  resourceType?: string;
  resourceQty?: number;
  resourceRespawnTurn?: number;
  encounterSeed?: number;
  npc?: NPC;
}

export interface WorldData {
  id: number;
  seed: number;
  name: string;
  tier: number;
  bossDefeated: boolean;
  dungeonFloors: number;
  tiles: Map<string, TileData>;
  startTile: { x: number; y: number };
}

export interface Resource {
  current: number;
  max: number;
  lastUpdate: string;
}

export interface PlayerState {
  id: string;
  name: string;
  gender: string;
  appearance: Record<string, any>;
affinity: ElementalAffinity;
   level: number;
   experience: bigint;
   money: number;
  archetype?: string;

isOnline?: boolean;
   skillPoints: number;
   skillsUnlocked: Record<string, boolean>;
   unspent_passive_points: number;
   unlocked_node_ids: string[];

  // Torn-like Resources
  energy: Resource;
  nerve: Resource;
  happy: Resource;
  life: Resource;

  // Battle Stats
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;

  currentWorldId: number;
  tileX: number;
  tileY: number;
  dayCount: number;
  gameTimeMinutes: number;
  creatures: CreatureInstance[];
  inventory: InventoryStack[];
  activeQuests: QuestInstance[];
  completedQuests: string[];
  discoveredTiles: Set<string>;
  territorialHostilities?: Record<string, TerritorialHostilityEntry>;
  activity?: {
    type: 'creature_training' | 'physical_training' | 'rest' | 'search_tracks' | 'search_animals';
    creatureId?: string;
    duration: number;
    endTime: number;
    message: string;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    showLogTimestamps: boolean;
    textSpeed?: number;
    fontSize?: number;
    highContrast?: boolean;
  };
}

export interface GameState {
  player: PlayerState | null;
  worlds: Map<number, WorldData>;
  currentWorldId: number;
  log: LogEntry[];
  currentScreen: Screen;
  turnCount: number;
  activity?: {
    type: 'creature_training' | 'physical_training' | 'rest' | 'search_tracks' | 'search_animals';
    creatureId?: string;
    duration: number;
    endTime: number;
    message: string;
  };
}

export interface LogEntry {
  id: string;
  turn: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'combat' | 'system';
  timestamp: number;
}

export type QuestStatus = 'active' | 'completed' | 'failed' | 'hidden';

export interface QuestInstance {
  id: string;
  templateKey: string;
  status: QuestStatus;
  progress: number;
  targetProgress: number;
}

export interface QuestTemplate {
  key: string;
  title: string;
  description: string;
  type: 'explore' | 'combat' | 'gather' | 'summon' | 'social';
  target?: string;
  amount: number;
  rewards: {
    money?: number;
    exp?: number;
    items?: InventoryStack[];
    element?: Element;
  };
}

export interface NPC {
  id: string;
  name: string;
  role: 'quest_giver' | 'merchant' | 'healer' | 'elder' | 'trainer';
  dialogue: string[];
  quests?: string[];
}

export type RoomType = 'entrance' | 'boss' | 'treasure' | 'combat' | 'trap' | 'puzzle' | 'rest' | 'elite' | 'vendor';

export interface DungeonRoom {
  id: string;
  x: number;
  y: number;
  type: RoomType;
  connections: string[];
}

export interface DungeonFloorGraph {
  floorIndex: number;
  worldIndex: number;
  seed: number;
  rooms: DungeonRoom[];
  entranceRoomId: string;
  bossRoomId: string;
  treasureRoomIds: string[];
}

export interface DungeonMetadata {
  worldId: number;
  totalFloors: number;
  completed: boolean;
}

export interface DungeonState {
  active: boolean;
  worldId: number;
  currentFloor: number;
  totalFloors: number;
  clearedFloors: number[];
  bossDefeated: boolean;
  inEncounter: boolean;
  encounterType?: 'guardian' | 'trap' | 'treasure' | 'boss';
  encounterName?: string;
}

export interface DemonlordSkill {
  key: string;
  name: string;
  description: string;
  element?: Element;
  power: number;
  cost: number;
  type: 'signature' | 'elemental_shift' | 'floor_manager' | 'aoe' | 'debuff';
  effects?: Record<string, number>;
}

export interface DemonlordState {
  isActive: boolean;
  currentLordPlayerId?: string;
  currentLordPlayerName?: string;
  floorMin: number;
  floorMax: number;
  influence: number;
  influenceDecayRate: number;
  activityThreshold: number;
  skills: DemonlordSkill[];
  pendingChallenges: Array<{
    challengerId: string;
    challengerName: string;
    issuedAt: number;
  }>;
  activeChallenge?: {
    challengerId: string;
    challengerName: string;
    acceptedAt: number;
  };
  defeatedAt?: number;
}

export type CombatPhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat';

export interface BossPhase {
  threshold: number;
  elementalShift?: Element;
  hazard?: string;
}

export interface MissionResult {
  victory: boolean;
  battle_log: string[];
  rewards: InventoryStack[];
  xp: number;
}

export interface CombatState {
  active: boolean;
  phase: CombatPhase;
  log: string[];
  enemyName?: string;
  enemyHp?: number;
  enemyMaxHp?: number;
  enemyTemplate?: CreatureTemplate | null;
  playerCreatureId?: string;
  turns: number;
  encounterType?: 'normal' | 'aggressive' | 'territorial';
  isBoss?: boolean;
  bossPhasesTriggered?: boolean[];
  activeBossElement?: Element;
  activeHazard?: string;
  scanResult?: {
    weaknesses: Element[];
    resistances: Element[];
    guessedElement?: Element;
    guessCorrect?: boolean;
    scannedAtTurn: number;
  };
}

export interface CommunityPlayer {
  id: string;
  username: string;
  name: string;
  level: number;
  archetype?: string;
  currentWorld?: number;
  posX?: number;
  posY?: number;
  lastActive?: string;
  isOnline?: boolean;
}

export interface CommunityMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  sender: CommunityPlayer;
  recipient: CommunityPlayer;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface CommunityConversation {
  otherPlayer: CommunityPlayer;
  lastMessage?: CommunityMessage;
  unread: number;
  updatedAt: string;
}

export interface CommunityTradeItem {
  itemKey: string;
  quantity: number;
  label?: string;
}

export interface CommunityTrade {
  id: string;
  initiatorId: string;
  targetId: string;
  initiator: CommunityPlayer;
  target: CommunityPlayer;
  offeredItems: CommunityTradeItem[];
  requestedItems: CommunityTradeItem[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPartyMember {
  playerId: string;
  username: string;
  role: 'leader' | 'member';
  joinedAt: string;
}

export interface CommunityParty {
  id: string;
  name: string;
  leaderId: string;
  members: CommunityPartyMember[];
  status: 'open' | 'closed' | 'disbanded';
  createdAt: string;
  updatedAt: string;
}

export interface CommunityGuildMember {
  playerId: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: string;
}

export interface CommunityGuildInvite {
  playerId: string;
  username: string;
  invitedBy: string;
  createdAt: string;
}

export interface CommunityGuild {
  id: string;
  name: string;
  leaderId: string;
  members: CommunityGuildMember[];
  invites: CommunityGuildInvite[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityState {
  conversations: CommunityConversation[];
  messages: CommunityMessage[];
  players: CommunityPlayer[];
  selectedPlayerId: string | null;
  tab: CommunityTab;
  parties: CommunityParty[];
  guilds: CommunityGuild[];
  trades: CommunityTrade[];
}

