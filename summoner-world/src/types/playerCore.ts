import type {
  Element,
  ElementalAffinity,
  QuestInstance,
  InventoryStack,
  Resource,
  CreatureInstance,
  FastTravelPointType,
  FastTravelPoint,
  FastTravelDestination,
} from './game.ts';
import type { Structure, TownHallPolicy } from './structure.ts';
import type { FastTravelState } from '../core/fastTravel.ts';

export type { FastTravelState };

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

export type PlayerSkillCategoryId =
  | 'direct_combat'
  | 'summoner_commands'
  | 'elemental'
  | 'crafting'
  | 'travel'
  | 'social'
  | 'economy'
  | 'housing'
  | 'pvp';

export interface PlayerSkillCategory {
  id: PlayerSkillCategoryId;
  name: string;
  description: string;
  supportsDirectUse: boolean;
  supportsCreatureSynergy: boolean;
}

export type TalentTreeCategoryId =
  | 'summoning'
  | 'elemental_mastery'
  | 'creature_bonding'
  | 'combat'
  | 'survival'
  | 'crafting'
  | 'trading'
  | 'housing'
  | 'exploration'
  | 'pvp'
  | 'guild_leadership';

export interface TalentTreeCategory {
  id: TalentTreeCategoryId;
  name: string;
  description: string;
  unlockFocus: string;
}

export interface SkillEntry {
  key: string;
  name: string;
  category: PlayerSkillCategoryId;
  description?: string;
  element?: Element;
  unlocked: boolean;
}

export interface TalentNode {
  nodeId: string;
  category: TalentTreeCategoryId;
  unlocked: boolean;
}

export type PlayerAchievementCategoryId =
  | 'exploration'
  | 'creature_collection'
  | 'crafting'
  | 'economy'
  | 'housing'
  | 'dungeons'
  | 'pvp'
  | 'guilds'
  | 'world_completion'
  | 'rare_events';

export interface TitleEntry {
  key: string;
  name: string;
  category: PlayerAchievementCategoryId;
  description?: string;
  unlockedAt?: number;
}

export interface AchievementEntry {
  key: string;
  name: string;
  description: string;
  category: PlayerAchievementCategoryId;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}

export interface PlayerPrimaryStats {
  strength: number;
  vitality: number;
  intelligence: number;
  dexterity: number;
  wisdom: number;
  luck: number;
}

export interface PlayerSecondaryStats {
  maxHealth: number;
  maxMana: number;
  maxStamina: number;
  movement: number;
  criticalChance: number;
  elementalMastery: number;
  contractCapacity: number;
  commandSpeed: number;
  creatureBondPower: number;
  inventoryCapacity: number;
  craftingEfficiency: number;
  tradeInfluence: number;
  reputationGain: number;
  summoningCost: number;
  travelUtility: number;
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

export type ReputationDomain = 'world' | 'faction' | 'settlement' | 'creature';

export type ReputationChangeSource =
  | 'quest'
  | 'trading'
  | 'ecosystem_impact'
  | 'dungeon_clearing';

export interface ReputationChange {
  domain: ReputationDomain;
  targetId: number | string;
  amount: number;
  source: ReputationChangeSource;
}

export interface ReputationEffects {
  merchantPriceMultiplier: number;
  creatureCaptureChanceModifierPct: number;
  settlementGrowthModifierPct: number;
  dungeonDifficultyModifierPct: number;
  npcReactionModifierPct: number;
}

export type ItemCategory =
  | 'equipment'
  | 'consumable'
  | 'material'
  | 'quest'
  | 'creature'
  | 'contract'
  | 'crafting_tool'
  | 'housing'
  | 'marketplace'
  | 'dungeon_key';

export type ItemBinding = 'bound' | 'tradeable' | 'marketable';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';

export type InventorySortKey = 'category' | 'rarity' | 'name' | 'quantity' | 'addedAt';
export type InventorySortOrder = 'asc' | 'desc';

export interface InventoryFilter {
  categories?: ItemCategory[];
  rarities?: ItemRarity[];
  binding?: ItemBinding[];
  nameContains?: string;
}

export interface InventoryItem extends InventoryStack {
  category: ItemCategory;
  rarity: ItemRarity;
  binding: ItemBinding;
  ownerId?: string;
  addedAt: number;
  dungeonKeyData?: {
    worldId: number;
    floorStart: number;
    floorEnd: number;
  };
  contractItemData?: {
    creatureTemplateKey: string;
    contractType: string;
  };
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
  durability?: number;
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

export type CreatureSlotType =
  | 'active_combat'
  | 'reserve'
  | 'utility'
  | 'housing'
  | 'marketplace'
  | 'breeding';

export interface CreatureSlotGroup {
  type: CreatureSlotType;
  max: number;
  assigned: string[];
}

export interface CreatureSlots {
  groups: CreatureSlotGroup[];
}

export interface HousingReference {
  structures: Structure[];
  structureLevel?: number;
  townHallPolicies?: TownHallPolicy[];
}

export type ProfessionId =
  | 'blacksmith'
  | 'explorer'
  | 'shopkeeper'
  | 'broker'
  | 'official'
  | 'summoner';

export interface ProfessionProgression {
  professionId: ProfessionId;
  level: number;
  xp: number;
  totalXpEarned: number;
  unlockedPerkIds: string[];
  lastAdvancedAt?: number;
}

export interface ProfessionState {
  activeProfessionId: ProfessionId;
  entries: Record<ProfessionId, ProfessionProgression>;
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
  primaryStats: PlayerPrimaryStats;
  secondaryStats: PlayerSecondaryStats;
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
  creatureSlots: CreatureSlots;
  housing: HousingReference;
  professions?: ProfessionState;
  worldUnlocks: WorldUnlocks;
  fastTravel: FastTravelState;
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
