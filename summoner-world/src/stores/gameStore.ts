import type { GameStoreState, GameActions, GameStore } from './game/types.ts';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayerState, WorldData, LogEntry, ElementalAffinity, Screen, CombatState, DungeonState, CreatureInstance, CreatureTemplate, Skill, QuestInstance, Element, InventoryStack, CommunityState, CommunityPlayer } from '../types/game.ts';
import { generateWorld, generateTile } from '../core/worldGenerator.ts';
import { getTileKey, getNeighbors } from '../data/constants.ts';
import { SeededRandom } from '../utils/SeededRandom.ts';
import { generateCreatureTemplate, SKILL_TEMPLATES } from '../modules/creatures/creatureFactory.ts';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { QUEST_TEMPLATES } from '../data/quests.ts';
import { playerActions } from './game/modules/playerModule.ts';
import { combatActions } from './game/modules/combatModule.ts';
import { careerActions } from './game/modules/careerModule.ts';
import { missionActions } from './game/modules/missionModule.ts';
import { economyActions } from './game/modules/economyModule.ts';

const API_BASE = 'http://localhost:5000/api';

// The types are now imported from './game/types.ts'

const initialGameState: GameStoreState = {
  player: null,
  worlds: new Map(),
  currentWorldId: 1,
  log: [],
  screen: 'explore',
  turnCount: 0,
  lastWorldTickTime: Date.now(),
  gameTimeMinutes: 360,
  dayCount: 1,
  initialized: false,
  combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
  combatTarget: null,
  dungeon: { active: false, worldId: 1, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false },
  exploring: null,
  searching: null,
  capturing: null,
  activity: null,
  nearbyPlayers: [],
    community: {
    conversations: [],
    messages: [],
    players: [],
    selectedPlayerId: null,
    tab: 'nearby',
    parties: [],
    guilds: [],
    trades: [],
    },
  missions: [],
  lastLogoutTimestamp: undefined,
  heartbeat: null,
  levelUpNotifications: [],
  };

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialGameState,
    ...playerActions(set, get),
    ...combatActions(set, get),
    ...careerActions(set, get),
    ...missionActions(set, get),
    ...economyActions(set, get),
  }))
);
