import { StoreApi } from 'zustand';

export type SetState<T> = StoreApi<T>['setState'];

import type {
   PlayerState,
   WorldData,
   LogEntry,
   ElementalAffinity,
   Screen,
   CombatState,
   DungeonState,
   DungeonRun,
   DemonlordState,
   DemonlordSkill,
   CreatureInstance,
   CreatureTemplate,
   Skill,
   QuestInstance,
   Element,
   InventoryStack,
   CommunityState,
   CommunityPlayer,
   Resource,
   CreatureType,
   CreatureClass,
   ItemType,
   ItemSubType,
   BiomeType,
   QuestStatus,
   CombatPhase,
   CommunityTab,
   BossHazard,
   RoomInteractionState,
   RoomInteractionChoice,
   RoomInteractionResult,
  } from '../../types/game.ts';
 import type { ActiveMission } from '../../core/missionQueue.ts';
 import type { MissionType, MissionModifiers } from '../../core/missionQueue.ts';
 import type { HeartbeatInstance } from '../../core/heartbeat.ts';
 import type { FloorActivity } from '../../core/demonlord';
  import type { TrapRoomInteraction, PuzzleRoomInteraction, EliteRoomInteraction, VendorRoomInteraction, TreasureRoomInteraction } from '../../core/dungeon/DungeonInteractions';

export type {
  PlayerState,
  WorldData,
  LogEntry,
  ElementalAffinity,
  Screen,
  CombatState,
  DungeonState,
  DungeonRun,
  DemonlordState,
  DemonlordSkill,
  CreatureInstance,
  CreatureTemplate,
  Skill,
  QuestInstance,
  Element,
  InventoryStack,
  CommunityState,
  CommunityPlayer,
  Resource,
  CreatureType,
  CreatureClass,
  ItemType,
  ItemSubType,
  BiomeType,
  QuestStatus,
  CombatPhase,
  CommunityTab,
  BossHazard,
  RoomInteractionState,
  RoomInteractionChoice,
  RoomInteractionResult,
ActiveMission,
   MissionType,
   MissionModifiers,
   HeartbeatInstance,
   FloorActivity,
   TrapRoomInteraction,
   PuzzleRoomInteraction,
   EliteRoomInteraction,
   VendorRoomInteraction,
   TreasureRoomInteraction,
 };

export interface GameStoreState {
   player: PlayerState | null;
   worlds: Map<number, WorldData>;
   currentWorldId: number;
   log: LogEntry[];
   screen: Screen;
   turnCount: number;
   lastWorldTickTime: number;
   gameTimeMinutes: number;
   dayCount: number;
   initialized: boolean;
   combat: CombatState;
   combatTarget: string | null;
   dungeon: DungeonState;
   exploring: {
     tileKey: string;
     endTime: number;
     totalDuration: number;
     targetX?: number;
     targetY?: number;
   } | null;
   searching: {
     missionId: string;
     resourceType?: string;
     endTime: number;
     totalDuration: number;
   } | null;
capturing: {
      missionId: string;
      creature: {
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
        skills: { key: string; name: string; description: string; element?: Element; power: number; cost: number }[];
        description: string;
        isBoss?: boolean;
        currentHealth?: number;
      };
      endTime: number;
      totalDuration: number;
    } | null;
   activity: {
     type: 'creature_training' | 'physical_training' | 'rest' | 'search_tracks' | 'search_animals';
     creatureId?: string;
     duration: number;
     endTime: number;
     message: string;
   } | null;
   nearbyPlayers: Array<{ id: string; username: string; name?: string; level?: number; archetype?: string; x: number; y: number; currentWorld?: number; isOnline?: boolean }>;
   community: CommunityState;
missions: ActiveMission[];
    lastLogoutTimestamp?: number;
    heartbeat: HeartbeatInstance | null;
    levelUpNotifications: Array<{ creatureName: string; newLevel: number }>;
    demonlordState?: DemonlordState;
    demonlordFloorActivity?: FloorActivity;
    }

export interface GameActions {
   initGame: (playerName: string, archetype?: string) => void;
   login: (username: string, password: string) => Promise<boolean>;
   register: (username: string, password: string, options?: { name?: string; archetype?: string }) => Promise<boolean>;
   logout: () => void;
   openCommunity: (tab?: CommunityState['tab']) => void;
   openProfile: () => void;
   refreshCommunity: () => Promise<void>;
   getCommunityPlayers: (query?: string) => Promise<void>;
   selectCommunityPlayer: (playerId: string | null) => void;
   sendCommunityMessage: (targetId: string, body: string) => Promise<void>;
   loadCommunityMessages: (targetId: string) => Promise<void>;
   loadCommunityConversations: () => Promise<void>;
   blockUser: (targetId: string) => Promise<void>;
   unblockUser: (targetId: string) => Promise<void>;
   reportUser: (targetId: string, reason: string, details?: string) => Promise<void>;
   createTrade: (targetId: string, offeredItems: Array<{ itemKey: string; quantity: number; label?: string }>, requestedItems?: Array<{ itemKey: string; quantity: number; label?: string }>) => Promise<void>;
   acceptTrade: (tradeId: string) => Promise<void>;
   declineTrade: (tradeId: string) => Promise<void>;
   invitePlayerToParty: (targetId: string, partyId?: string) => Promise<void>;
   acceptPartyInvite: (partyId: string) => Promise<void>;
   declinePartyInvite: (partyId: string) => Promise<void>;
   leaveParty: (partyId: string) => Promise<void>;
   createGuild: (name: string) => Promise<void>;
   invitePlayerToGuild: (targetId: string, guildId?: string) => Promise<void>;
   acceptGuildInvite: (guildId: string) => Promise<void>;
   declineGuildInvite: (guildId: string) => Promise<void>;
   leaveGuild: (guildId: string) => Promise<void>;
   train: (stat: 'strength' | 'defense' | 'speed' | 'dexterity', energyCost: number) => Promise<void>;
   performSummonAct: (actType: string, nerveCost: number) => Promise<void>;
   syncWithServer: () => Promise<void>;
   movePlayer: (dx: number, dy: number) => void;
   finishMovement: (x: number, y: number, tileKey: string, newlyExplored?: boolean) => void;
   switchCreatureInCombat: (creatureId: string) => void;
   searchArea: () => void;
   finishSearch: (resourceKey: string) => void;
    gatherResource: (resourceKey: string) => void;
    captureCreature: () => void;
    finishCapture: () => void;
   openCreaturePanel: () => void;
   openInventory: () => void;
   openWorldMap: () => void;
   openDungeon: () => void;
   openSettings: () => void;
   openQuests: () => void;
   interactNPC: () => void;
   acceptQuest: (questKey: string) => void;
   completeQuest: (questId: string) => void;
   breedCreatures: (id1: string, id2: string, selectedSkills: string[]) => void;
   closeModal: () => void;
   appendLog: (text: string, type: LogEntry['type']) => void;
   saveGame: () => void;
   loadGame: () => boolean;
    startCombat: (enemyTemplate: CreatureTemplate | null, enemyName: string, encounterType?: 'normal' | 'aggressive' | 'territorial') => void;
    attackWithCreature: (creatureId: string) => void;
    useSkill: (skillKey: string) => void;
    triggerEnemyTurn: (enemyTemplate: CreatureTemplate | null, currentLog: string[], currentEnemyHp: number) => void;
    handleVictory: (creatureId: string, enemyTemplate: CreatureTemplate | null, currentLog: string[], newEnemyHp: number) => void;
    fleeCombat: () => void;
    selectCreatureForCombat: (creatureId: string) => void;
     applyBossPhaseMechanics: () => void;
      applyEnvironmentalHazardDamage: () => void;
    useItem: (itemKey: string) => void;
    updateSettings: (patch: Partial<PlayerState['settings']>) => void;
     scanEnemy: () => void;
     guessWeakness: (element: Element) => void;
   enterDungeon: () => void;
   descendDungeon: () => void;
   resolveDungeonEncounter: (victory: boolean) => void;
   fleeDungeon: () => void;
   resolveTrapRoom: (choice: string) => void;
   resolvePuzzleRoom: (choice: string) => void;
   resolveEliteRoom: () => void;
   resolveVendorRoom: (itemId: string) => void;
   resolveTreasureRoom: () => void;
   exploreTile: () => void;
   cancelExploration: () => void;
   createMapScroll: () => void;
   useMapScroll: (data: string) => void;
   unlockSkill: (nodeId: string) => void;
   startActivity: (type: NonNullable<GameStoreState['activity']>['type'], duration: number, message: string, creatureId?: string) => void;
   cancelActivity: () => void;
   finishActivity: () => void;
   addMission: (mission: ActiveMission) => void;
    completeMission: (missionId: string) => void;
    failMission: (missionId: string) => void;
    removeMission: (missionId: string) => void;
    addMissionWithModifiers: (params: {
      type: MissionType;
      assigned_creatures: string[];
      world_layer: number;
      duration_seconds: number;
      extraModifiers?: MissionModifiers;
    }) => ActiveMission | undefined;
     processOfflineCatchUp: (logoutTimestamp: number) => number;
     startHeartbeat: () => void;
     stopHeartbeat: () => void;
     grantMissionXP: (creatureIds: string[], baseXP: number) => { leveledUpIds: string[] };
showLevelUpNotification: (notifications: Array<{ creatureName: string; newLevel: number }>) => void;
     clearLevelUpNotifications: () => void;
     initDemonlord: () => void;
     challengeDemonlord: () => void;
     acceptDemonlordChallenge: () => void;
     resolveDemonlordCombat: (victorId: string) => void;
     isOnDemonlordFloor: () => boolean;
     updateDemonlordInfluence: (playerCountDelta: number) => void;
     getDemonlordInfluenceForCombat: () => number;
    applyDemonlordCombatBonuses: (baseDamage: number, baseDefense: number) => { damage: number; defense: number };
    setDemonlordFloorActivity: (activity: FloorActivity) => void;
    getDemonlordFloorActivity: () => FloorActivity;
    createCharacter: (options: {
      name: string;
      appearance?: Record<string, any>;
      className?: string;
      startingElement?: string;
      startingWorldId?: number;
      contractPathKey?: string;
    }) => void;
  }

export type GameStore = GameStoreState & GameActions;
