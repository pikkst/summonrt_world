import type {
  Element,
  ElementalAffinity,
  QuestInstance,
  InventoryStack,
  Resource,
  CreatureInstance,
} from './game.ts';

export type SummonerClass =
  | 'beast_binder'
  | 'elementalist'
  | 'warden'
  | 'ritualist'
  | 'tactician'
  | 'alchemist'
  | 'pathfinder'
  | 'duelist';

export interface PlayerIdentity {
  id: string;
  name: string;
  gender?: string;
  appearance: Record<string, any>;
}

export interface SummonerProfile {
  class?: SummonerClass;
  archetype?: string;
  startingWorldId: number;
  firstContractPath?: string;
}

export interface SkillEntry {
  key: string;
  name: string;
  description?: string;
  element?: Element;
  unlocked: boolean;
}

export interface TalentNode {
  nodeId: string;
  unlocked: boolean;
}

export interface TitleEntry {
  key: string;
  name: string;
  unlockedAt?: number;
}

export interface AchievementEntry {
  key: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}

export interface PlayerStatistics {
  worldsUnlocked: number;
  creaturesContracted: number;
  dungeonsCleared: number;
  itemsCrafted: number;
  tradesCompleted: number;
  goldEarned: number;
  bossesDefeated: number;
  pvpWins: number;
  housingValue: number;
  guildContributions: number;
  questsCompleted: number;
}

export interface ReputationState {
  world_rep: Record<number, number>;
  faction_rep: Record<string, number>;
  settlement_rep: Record<string, number>;
  creature_rep: Record<string, number>;
}

export type EquipmentSlotId =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'amulet'
  | 'ring_1'
  | 'ring_2'
  | 'summoner_focus'
  | 'creature_command_artifact';

export interface EquipmentSlot {
  slot: EquipmentSlotId;
  itemKey?: string;
  quantity: number;
  modifiers?: Record<string, number>;
}

export interface CreatureContract {
  id: string;
  templateKey: string;
  nickname?: string;
  bondLevel: number;
  trust: number;
  loyalty: number;
  contractStability: number;
  elementCompatibility: number;
  commandPermissions: string[];
  tradeStatus: 'bound' | 'tradeable' | 'marketable';
  breedingRights: boolean;
  pvpEligibility: boolean;
  summonedAt?: number;
  contractedAt: number;
  instance: CreatureInstance;
}

export interface HousingReference {
  housingId?: string;
  worldId?: number;
  tileX?: number;
  tileY?: number;
  structureLevel?: number;
}

export interface WorldUnlocks {
  unlockedWorlds: number[];
  activeWorldId: number;
}

export interface SaveMetadata {
  saveSlot?: number;
  lastSavedAt: string;
  playtimeSeconds: number;
  saveVersion: string;
}

export interface PlayerCoreState {
  identity: PlayerIdentity;
  summonerProfile: SummonerProfile;
  level: number;
  experience: bigint;
  elements: ElementalAffinity;
  class: SummonerClass;
  inventory: InventoryStack[];
  equipment: EquipmentSlot[];
  skills: SkillEntry[];
  talents: TalentNode[];
  titles: TitleEntry[];
  achievements: AchievementEntry[];
  statistics: PlayerStatistics;
  reputation: ReputationState;
  questHistory: {
    active: QuestInstance[];
    completed: string[];
  };
  creatureContracts: CreatureContract[];
  housing: HousingReference;
  worldUnlocks: WorldUnlocks;
  saveMetadata: SaveMetadata;
  resources: {
    energy: Resource;
    nerve: Resource;
    happy: Resource;
    life: Resource;
  };
  position: {
    worldId: number;
    x: number;
    y: number;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    showLogTimestamps: boolean;
    textSpeed?: number;
    fontSize?: number;
    highContrast?: boolean;
  };
  money: number;
  skillPoints: number;
  dayCount: number;
  gameTimeMinutes: number;
  isOnline?: boolean;
}
