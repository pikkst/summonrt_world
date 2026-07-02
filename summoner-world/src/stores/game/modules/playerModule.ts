import type { GameStore, GameStoreState, LogEntry, ElementalAffinity, Element, InventoryStack, PlayerState, WorldData, QuestInstance, CreatureInstance, CommunityState, SetState, CreatureTemplate } from '../types.ts';
import { createLog, rollAffinity, getPlayerElements, addPlayerXP, calculateMovementModifiers, processTileDiscovery, getWorldModifier, applyResourceRegeneration } from '../helpers.ts';
import { generateWorld, generateTile } from '../../../core/worldGenerator.ts';
import { getTileKey, getNeighbors } from '../../../data/constants.ts';
import { SeededRandom } from '../../../utils/SeededRandom.ts';
import { generateCreatureTemplate, registerSpeciesLine, pickRandomSpeciesKey, getRandomSpeciesStage } from '../../../modules/creatures/creatureFactory.ts';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { QUEST_TEMPLATES } from '../../../data/quests.ts';
import { applyCreatureXP } from '../../../core/xpCurve.ts';
import { applyAffectionGain } from '../../../core/affection.ts';
import {
  generateTrapInteraction,
  generatePuzzleInteraction,
  generateEliteInteraction,
  generateVendorInteraction,
  generateTreasureInteraction,
  resolveTrapRoom as resolveRoomTrap,
  resolvePuzzleRoom as resolveRoomPuzzle,
  EliteRoomInteraction,
  VendorRoomInteraction,
} from '../../../core/dungeon/DungeonInteractions';
import { createCharacter, CONTRACT_PATHS, type ContractPath } from '../../../core/playerCore/characterCreation.ts';
import { getPrimaryStatsOrDefault } from '../../../core/playerCore/playerStatistics';
import { ARCHETYPE_TO_CLASS } from '../../../core/playerCore/factory';
import type { SummonerClass } from '../../../types/playerCore';
import { SUMMONER_CLASSES } from '../../../data/summonerClasses';

function toBigIntXP(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function serializeXP(value: unknown): number {
  return Number(toBigIntXP(value));
}

function normalizeCreatures(creatures: unknown): CreatureInstance[] {
  if (!Array.isArray(creatures)) return [];
  return creatures.map((creature) => ({
    ...(creature as CreatureInstance),
    experience: toBigIntXP((creature as CreatureInstance).experience),
  }));
}

function buildDefaultResources(archetype: string): InventoryStack[] {
  switch (archetype) {
    case 'trader':
      return [{ templateKey: 'essence', quantity: 3 }];
    case 'summoner':
      return [{ templateKey: 'soul_crystal_common', quantity: 3 }];
    case 'pvp':
      return [{ templateKey: 'healing_herb', quantity: 5 }];
    case 'pve':
      return [{ templateKey: 'mana_crystal', quantity: 3 }];
    default:
      return [];
  }
}

export const playerActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  initGame: (playerName: string, archetype: string = 'fighter') => {
    const affinity = rollAffinity();
    const startWorld = generateWorld(1, affinity);
    const worlds = new Map<number, WorldData>();
    worlds.set(1, startWorld);

const className = ARCHETYPE_TO_CLASS[archetype] ?? 'elementalist';
    const classDef = SUMMONER_CLASSES[className];

    const rng = new SeededRandom(Date.now());
    const startingSpeciesKey = pickRandomSpeciesKey(rng);
    const startingStage = startingSpeciesKey ? getRandomSpeciesStage(startingSpeciesKey, rng) : 0;
    const startingTemplate = startingSpeciesKey
      ? (() => { registerSpeciesLine(startingSpeciesKey, 1); return generateCreatureTemplate(1, rng, false, startingSpeciesKey, startingStage); })()
      : generateCreatureTemplate(1, rng);
    const startingCreature: CreatureInstance = {
      id: uuidv4(),
      templateKey: startingTemplate.key,
      nickname: startingTemplate.name,
      level: 1,
      experience: 0n,
      currentHealth: startingTemplate.baseHealth,
      currentMana: startingTemplate.baseMana,
      maxHealth: startingTemplate.baseHealth,
      maxMana: startingTemplate.baseMana,
      attack: startingTemplate.baseAttack,
      defense: startingTemplate.baseDefense,
      speed: startingTemplate.baseSpeed,
      class: startingTemplate.class,
      skills: startingTemplate.skills.map((s) => typeof s === 'string' ? s : s.key),
      traits: [],
      mutations: [],
      affection: 0,
      type: startingTemplate.type,
      elements: startingTemplate.elements,
      baseExpValue: startingTemplate.baseExpValue,
      evolutionStage: 0,
      evolvedFromKey: undefined,
    };

    const bonusResources = buildDefaultResources(archetype);
    const bonusMoney = archetype === 'trader' ? 500 : 0;
    const bonusStats = classDef.statBias;

    const basePrimaryStats = getPrimaryStatsOrDefault(bonusStats);

    const player: PlayerState = {
       id: uuidv4(),
       name: playerName,
       gender: 'unknown',
       appearance: {},
       affinity,
       archetype,
       level: 1,
       experience: 0n,
       money: 1000 + bonusMoney,
       skillPoints: 0,
       skillsUnlocked: {},
       unspent_passive_points: 0,
       unlocked_node_ids: ['root_hub'],
       energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
       happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       strength: basePrimaryStats.strength,
       vitality: basePrimaryStats.vitality,
       intelligence: basePrimaryStats.intelligence,
       dexterity: basePrimaryStats.dexterity,
       wisdom: basePrimaryStats.wisdom,
       luck: basePrimaryStats.luck,
       speed: bonusStats.speed ?? 10,
       defense: bonusStats.defense ?? 10,
       currentWorldId: 1,
       tileX: 10,
       tileY: 10,
       dayCount: 1,
       gameTimeMinutes: 420,
       creatures: [startingCreature],
       inventory: [
         { templateKey: 'healing_herb', quantity: 5 },
         { templateKey: 'mana_crystal', quantity: 2 },
         { templateKey: 'basic_food', quantity: 3 },
         ...bonusResources,
       ],
       activeQuests: [],
       completedQuests: [],
       discoveredTiles: new Set<string>(),
       territorialHostilities: {},
       settings: {
         musicVolume: 0.5,
         sfxVolume: 0.5,
         showLogTimestamps: true,
         textSpeed: 30,
         fontSize: 15,
         highContrast: false,
       },
     };

    const introLogs: LogEntry[] = [
      createLog('Welcome to SummonerWorld!', 'system', 0),
      createLog('You stand at the Edge (10, 10). The Great Spire is at the Center (1000, 1000).', 'info', 0),
      createLog('Elder Thorne is standing nearby. Talk to him to begin your long journey.', 'success', 0),
      createLog('Commands: north, south, east, west, talk, explore, save', 'system', 0),
      createLog('Goal: Ascend through 100 floors to challenge the Demon Lord.', 'warning', 0),
    ];

    set({
      player,
      worlds,
      currentWorldId: 1,
      log: introLogs,
      screen: 'explore',
      turnCount: 0,
      initialized: true,
      combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
      combatTarget: null,
      dungeon: { active: false, worldId: 1, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined },
      exploring: null,
    });

    get().startHeartbeat();
  },

  createCharacter: (options: {
    name: string;
    appearance?: Record<string, any>;
    className?: SummonerClass;
    startingElement?: Element;
    startingWorldId?: number;
    contractPathKey?: ContractPath;
  }) => {
    const result = createCharacter({
      name: options.name,
      appearance: options.appearance,
      className: options.className,
      startingElement: options.startingElement,
      startingWorldId: options.startingWorldId,
      contractPathKey: options.contractPathKey,
    });

    const { playerCore, startingCreature, affinity, classDef, contractPath } = result;
    const startingWorldId = options.startingWorldId ?? 1;

    const startWorld = generateWorld(startingWorldId, affinity);
    const worlds = new Map<number, WorldData>();
    worlds.set(startingWorldId, startWorld);

const bonusStats = classDef.statBias;
    const bonusMoney = classDef.startingBonus.money || 0;
    const bonusResources = classDef.startingBonus.items || [];

    const basePrimaryStats = getPrimaryStatsOrDefault(bonusStats);

    const player: PlayerState = {
       id: playerCore.identity.id,
       name: playerCore.identity.name,
       gender: 'unknown',
       appearance: playerCore.identity.appearance,
       affinity,
       level: 1,
       experience: 0n,
       money: 1000 + bonusMoney,
       skillPoints: 0,
       skillsUnlocked: {},
       unspent_passive_points: 0,
       unlocked_node_ids: ['root_hub'],
       energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
       happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
       strength: basePrimaryStats.strength,
       vitality: basePrimaryStats.vitality,
       intelligence: basePrimaryStats.intelligence,
       dexterity: basePrimaryStats.dexterity,
       wisdom: basePrimaryStats.wisdom,
       luck: basePrimaryStats.luck,
       speed: bonusStats.speed ?? 10,
       defense: bonusStats.defense ?? 10,
       currentWorldId: startingWorldId,
       tileX: 10,
       tileY: 10,
       dayCount: 1,
       gameTimeMinutes: 420,
       creatures: [startingCreature],
       inventory: [
         { templateKey: 'healing_herb', quantity: 5 },
         { templateKey: 'mana_crystal', quantity: 2 },
         { templateKey: 'basic_food', quantity: 3 },
         ...bonusResources,
       ],
       activeQuests: [],
       completedQuests: [],
       discoveredTiles: new Set<string>(),
       territorialHostilities: {},
       settings: {
         musicVolume: 0.5,
         sfxVolume: 0.5,
         showLogTimestamps: true,
         textSpeed: 30,
         fontSize: 15,
         highContrast: false,
       },
     };

    const introLogs: LogEntry[] = [
      createLog(`Welcome, ${player.name}! You begin your journey as a ${classDef.name}.`, 'system', 0),
      createLog(`Your first companion: ${startingCreature.nickname} the ${contractPath.label}.`, 'info', 0),
      createLog('You stand at the Edge (10, 10). The Great Spire is at the Center (1000, 1000).', 'info', 0),
      createLog('Elder Thorne is standing nearby. Talk to him to begin your long journey.', 'success', 0),
      createLog('Commands: north, south, east, west, talk, explore, save', 'system', 0),
      createLog(`Goal: Ascend through 100 floors to challenge the Demon Lord.`, 'warning', 0),
    ];

    set({
      player,
      worlds,
      currentWorldId: startingWorldId,
      log: introLogs,
      screen: 'explore',
      turnCount: 0,
      initialized: true,
      combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
      combatTarget: null,
      dungeon: { active: false, worldId: startingWorldId, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined },
      exploring: null,
    });

    get().startHeartbeat();
  },

  register: async (username: string, password: string, options: { name?: string; archetype?: string } = {}): Promise<boolean> => {
    const { appendLog } = get();
    try {
      const res = await axios.post(`${'http://localhost:5000/api'}/register`, {
        username,
        password,
        name: options.name || username,
        archetype: options.archetype || 'summoner',
      });
      if (res.data.success || res.data.player) {
        appendLog('Registration complete. Your journey is saved to MongoDB.', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      appendLog(err.response?.data?.error || 'Registration failed', 'error');
      return false;
    }
  },

  login: async (username: string, password: string): Promise<boolean> => {
    const { appendLog } = get();
    try {
      const res = await axios.post(`${'http://localhost:5000/api'}/login`, { username, password });
      if (res.data.success) {
        const serverPlayer = res.data.player;
        const affinity = serverPlayer.affinity || { primary: 'fire' as Element, learned: [] as Element[] };
        const startWorld = generateWorld(serverPlayer.currentWorld || 1, affinity);
        const worlds = new Map<number, WorldData>();
        worlds.set(serverPlayer.currentWorld || 1, startWorld);

        if (serverPlayer.exploredTiles) {
          serverPlayer.exploredTiles.forEach((tk: string) => {
            const [wid, coords] = tk.split(':');
            if (wid === undefined || coords === undefined) return;
            if (parseInt(wid) === (serverPlayer.currentWorld || 1)) {
              const tile = startWorld.tiles.get(coords);
              if (tile) {
                tile.explored = true;
                tile.discovered = true;
              } else {
                const parts = coords.split(',');
                if (parts.length < 2 || !parts[0] || !parts[1]) return;
                const tx = parseInt(parts[0]);
                const ty = parseInt(parts[1]);
                if (isNaN(tx) || isNaN(ty)) return;
                const newTile = generateTile(tx, ty, serverPlayer.currentWorld || 1);
                newTile.explored = true;
                newTile.discovered = true;
                startWorld.tiles.set(coords, newTile);
              }
            }
          });
        }

        const discoveredTilesSet = new Set<string>();
        if (serverPlayer.exploredTiles) {
          serverPlayer.exploredTiles.forEach((tk: string) => {
            const parts = tk.split(':');
            if (parts[1]) discoveredTilesSet.add(parts[1]);
          });
        }

        const loggedInPlayer: PlayerState = {
          ...serverPlayer,
          id: serverPlayer._id,
          affinity,
          isOnline: true,
          skillPoints: serverPlayer.skillPoints ?? 0,
          skillsUnlocked: serverPlayer.skillsUnlocked ?? {},
          unspent_passive_points: serverPlayer.unspent_passive_points ?? 0,
          unlocked_node_ids: serverPlayer.unlocked_node_ids ?? ['root_hub'],
          currentWorldId: serverPlayer.currentWorld || 1,
          tileX: typeof serverPlayer.posX === 'number' && !isNaN(serverPlayer.posX) ? serverPlayer.posX : startWorld.startTile.x,
          tileY: typeof serverPlayer.posY === 'number' && !isNaN(serverPlayer.posY) ? serverPlayer.posY : startWorld.startTile.y,
          gameTimeMinutes: typeof serverPlayer.gameTimeMinutes === 'number' && !isNaN(serverPlayer.gameTimeMinutes) ? serverPlayer.gameTimeMinutes : 420,
          experience: toBigIntXP(serverPlayer.experience),
          creatures: normalizeCreatures(serverPlayer.creatures),
          inventory: serverPlayer.inventory || [],
          activeQuests: serverPlayer.activeQuests || [],
          completedQuests: serverPlayer.completedQuests || [],
          discoveredTiles: discoveredTilesSet,
          activity: serverPlayer.activity || null,
          settings: serverPlayer.settings || { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true }
        };
        const regeneratedPlayer = applyResourceRegeneration(loggedInPlayer, Date.now());

        set({
          player: regeneratedPlayer,
          worlds,
          currentWorldId: serverPlayer.currentWorld || 1,
          initialized: true,
          log: [createLog(`Welcome back, ${serverPlayer.username}!`, 'system', 0)],
        });
          get().startHeartbeat();
        set({
          nearbyPlayers: res.data.nearby?.areaPlayers || res.data.nearby || [],
          community: {
            ...get().community,
            players: res.data.nearby?.areaPlayers || res.data.nearby || [],
          },
        });
        
        const localRaw = localStorage.getItem('summonerworld-save');
        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw);
            if (localData.missions && localData.missions.length > 0) {
              set((state) => ({
                missions: [...(state.missions || []), ...localData.missions],
              }));
            }
          } catch (e) {
            console.error('Failed to merge local missions on login', e);
          }
        }
        
        const logoutTimestamp = parseInt(localStorage.getItem('summonerworld-last-logout') || '0');
        if (logoutTimestamp > 0 && get().missions.length > 0) {
          const resolved = get().processOfflineCatchUp(logoutTimestamp);
          if (resolved > 0) {
            localStorage.removeItem('summonerworld-last-logout');
          }
        }
        
        return true;
      } else {
        appendLog('Login failed: Invalid username or password', 'error');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      console.error('Login failed', err);
      appendLog(errorMsg, 'error');
      return false;
    }
  },

  train: async (stat: 'strength' | 'defense' | 'speed' | 'dexterity', energyCost: number) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      const res = await axios.post(`${'http://localhost:5000/api'}/train`, { playerId: player.id, stat, energyCost });
      if (res.data.success) {
        set({
          player: {
            ...res.data.player,
            id: res.data.player._id,
            experience: toBigIntXP(res.data.player.experience),
            creatures: normalizeCreatures(res.data.player.creatures),
          },
        });
        appendLog(`Trained ${stat}! Gained ${res.data.gain.toFixed(2)} points.`, 'success');
      }
    } catch (err: any) {
      appendLog(err.response?.data?.error || 'Training failed', 'error');
    }
  },

  performSummonAct: async (actType: string, nerveCost: number) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      const res = await axios.post(`${'http://localhost:5000/api'}/summon-act`, { playerId: player.id, actType, nerveCost });
      if (res.data.success) {
        set({
          player: {
            ...res.data.player,
            id: res.data.player._id,
            experience: toBigIntXP(res.data.player.experience),
            creatures: normalizeCreatures(res.data.player.creatures),
          },
        });
        appendLog(`Summon Act Successful! Gained ${res.data.reward} stones and ${res.data.xp} XP.`, 'success');
      } else {
        set({
          player: {
            ...res.data.player,
            id: res.data.player._id,
            experience: toBigIntXP(res.data.player.experience),
            creatures: normalizeCreatures(res.data.player.creatures),
          },
        });
        appendLog(`Summon Act Failed! You lost some spirit.`, 'warning');
      }
    } catch (err: any) {
      appendLog(err.response?.data?.error || 'Summon Act failed', 'error');
    }
  },

  syncWithServer: async () => {
    const { player } = get();
    if (!player) return;
    try {
      const res = await axios.get(`${'http://localhost:5000/api'}/player/${player.id}`);
      const serverPlayer = res.data;

      const discoveredTilesSet = new Set<string>();
      if (serverPlayer.exploredTiles) {
        serverPlayer.exploredTiles.forEach((tk: string) => {
          const parts = tk.split(':');
          if (parts[1]) discoveredTilesSet.add(parts[1]);
        });
      }

      let activityState = null;
      if (serverPlayer.activity && serverPlayer.activity.type) {
        activityState = {
          ...serverPlayer.activity,
          endTime: new Date(serverPlayer.activity.endTime).getTime(),
        };
      }

set({
         player: {
           ...serverPlayer,
           id: serverPlayer._id,
           affinity: serverPlayer.affinity || { primary: 'fire' as Element, learned: [] as Element[] },
           isOnline: true,
           skillPoints: serverPlayer.skillPoints ?? 0,
           skillsUnlocked: serverPlayer.skillsUnlocked ?? {},
           unspent_passive_points: serverPlayer.unspent_passive_points ?? 0,
           unlocked_node_ids: serverPlayer.unlocked_node_ids ?? ['root_hub'],
           discoveredTiles: discoveredTilesSet,
           experience: toBigIntXP(serverPlayer.experience),
           creatures: normalizeCreatures(serverPlayer.creatures),
           inventory: serverPlayer.inventory || [],
           activeQuests: serverPlayer.activeQuests || [],
           completedQuests: serverPlayer.completedQuests || [],
           activity: activityState,
           settings: serverPlayer.settings || { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true }
         }
       });
    } catch (err) {
      console.error('Sync failed', err);
    }
  },

  updateSettings: (patch: Partial<PlayerState['settings']>) => set((state) => ({
    player: state.player ? { ...state.player, settings: { ...state.player.settings, ...patch } } : state.player,
  })),

  logout: () => {
    get().saveGame();
    set({ player: null, initialized: false, screen: 'login', lastLogoutTimestamp: Date.now() });
    localStorage.setItem('summonerworld-last-logout', Date.now().toString());
  },

  saveGame: async () => {
    const state = get();
    if (!state.player) return;

    const serializedPlayer = {
      ...state.player,
      experience: serializeXP(state.player.experience),
      creatures: state.player.creatures.map((creature) => ({
        ...creature,
        experience: serializeXP(creature.experience),
      })),
      discoveredTiles: Array.from(state.player.discoveredTiles || []),
    };

    const serializedWorlds = Array.from(state.worlds.entries()).map(([worldId, worldData]) => [
      worldId,
      {
        ...worldData,
        tiles: Array.from(worldData.tiles.entries()),
      }
    ]);

    const data = {
      version: '1.1.0',
      player: serializedPlayer,
      worlds: serializedWorlds,
      currentWorldId: state.currentWorldId,
      turnCount: state.turnCount,
      screen: state.screen,
      combat: state.combat,
      dungeon: state.dungeon,
      activity: state.activity,
      missions: state.missions,
      exploring: state.exploring,
      searching: state.searching,
      capturing: state.capturing,
      lastLogoutTimestamp: state.lastLogoutTimestamp,
      log: state.log.slice(-500),
      savedAt: Date.now(),
    };

    localStorage.setItem('summonerworld-save', JSON.stringify(data));
    set((state) => ({
      log: [...state.log.slice(-499), createLog('Local save successful.', 'success', state.turnCount)]
    }));

    if (state.player.isOnline) {
      try {
        const exploredTiles: string[] = [];
        state.worlds.forEach((world, wId) => {
          world.tiles.forEach((tile) => {
            if (tile.explored) {
              exploredTiles.push(`${wId}:${tile.x},${tile.y}`);
            }
          });
        });

        const syncPayload = {
          ...serializedPlayer,
          exploredTiles,
          combat: state.combat,
          dungeon: state.dungeon,
          activity: state.activity,
          screen: state.screen,
        };

        const res = await axios.post(`${'http://localhost:5000/api'}/player/sync`, {
          playerId: state.player.id,
          playerState: syncPayload
        });

        if (res.data.success) {
          set((state) => ({
            log: [...state.log.slice(-499), createLog('Synced progress with server.', 'success', state.turnCount)]
          }));
        }
      } catch (err) {
        console.error('Server sync failed during saveGame', err);
        set((state) => ({
          log: [...state.log.slice(-499), createLog('Could not sync with server (offline mode active).', 'warning', state.turnCount)]
        }));
      }
    }
  },

  loadGame: (): boolean => {
    const raw = localStorage.getItem('summonerworld-save');
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      const rawPlayer = data.player;
      if (!rawPlayer) return false;

      const player: PlayerState = {
        ...rawPlayer,
        tileX: typeof rawPlayer.tileX === 'number' && !isNaN(rawPlayer.tileX) ? rawPlayer.tileX : 10,
        tileY: typeof rawPlayer.tileY === 'number' && !isNaN(rawPlayer.tileY) ? rawPlayer.tileY : 10,
        discoveredTiles: new Set(rawPlayer.discoveredTiles || []),
        affinity: rawPlayer.affinity || { primary: 'fire' as Element, learned: [] as Element[] },
        experience: toBigIntXP(rawPlayer.experience),
        creatures: normalizeCreatures(rawPlayer.creatures),
        inventory: rawPlayer.inventory || [],
        activeQuests: rawPlayer.activeQuests || [],
        completedQuests: rawPlayer.completedQuests || [],
        territorialHostilities: rawPlayer.territorialHostilities || {},
        unspent_passive_points: rawPlayer.unspent_passive_points ?? 0,
        unlocked_node_ids: rawPlayer.unlocked_node_ids ?? ['root_hub'],
        settings: rawPlayer.settings || { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
      };

      const worlds = new Map<number, WorldData>();
      if (data.worlds) {
        data.worlds.forEach(([worldId, worldData]: [number, any]) => {
          worlds.set(worldId, {
            ...worldData,
            tiles: new Map(worldData.tiles || []),
          });
        });
      }

      const storedLogout = localStorage.getItem('summonerworld-last-logout');
      const parsedLogout = storedLogout ? parseInt(storedLogout, 10) : 0;
      const logoutTimestamp = data.lastLogoutTimestamp ?? (parsedLogout > 0 ? parsedLogout : undefined);
      if (parsedLogout > 0) localStorage.removeItem('summonerworld-last-logout');

      const regeneratedPlayer = applyResourceRegeneration(player, Date.now());

      set({
        player: regeneratedPlayer,
        worlds,
        currentWorldId: data.currentWorldId || 1,
        turnCount: data.turnCount || 0,
        screen: data.screen || 'explore',
        log: data.log && data.log.length > 0 ? data.log : [createLog('Loaded from previous save.', 'system', 0)],
        combat: data.combat || { active: false, phase: 'player_turn' as const, log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
        dungeon: data.dungeon || { active: false, worldId: 1, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined },
        activity: data.activity || null,
        missions: data.missions || [],
        exploring: data.exploring || null,
        searching: data.searching || null,
        capturing: data.capturing || null,
        lastLogoutTimestamp: logoutTimestamp,
          initialized: true,
        });

        get().startHeartbeat();
        
        if (logoutTimestamp && (data.missions || []).length > 0) {
        const resolved = get().processOfflineCatchUp(logoutTimestamp);
        if (resolved > 0) {
          set({ lastLogoutTimestamp: undefined });
        }
      }
      
      return true;
    } catch (e) {
      console.error('Failed to load local save', e);
      return false;
    }
  },

  appendLog: (text: string, type: LogEntry['type']) => {
    const entry = createLog(text, type, get().turnCount);
    set((state) => ({
      log: [...state.log.slice(-499), entry],
    }));
  },

  showLevelUpNotification: (notifications: Array<{ creatureName: string; newLevel: number }>) => {
    set({ levelUpNotifications: notifications });
  },

  clearLevelUpNotifications: () => {
    set({ levelUpNotifications: [] });
  },

  closeModal: () => set({ screen: 'explore', combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 }, dungeon: { active: false, worldId: 1, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined } }),

  openCreaturePanel: () => set({ screen: 'creatures' }),
  openInventory: () => set({ screen: 'inventory' }),
  openWorldMap: () => set({ screen: 'map' }),
  openDungeon: () => set({ screen: 'dungeon' }),
  openSettings: () => set({ screen: 'settings' }),
  openQuests: () => set({ screen: 'quests' }),
  openProfile: () => set({ screen: 'profile' }),

  useItem: (itemKey: string) => {
    const { player, openProfile: _, useMapScroll } = get();
    if (!player) return;
    const idx = player.inventory.findIndex(i => i.templateKey === itemKey);
    if (idx === -1) return;
    const stack = player.inventory[idx];
    if (!stack) return;

    if (itemKey === 'atlas_scroll' && stack.modifiers?.data) {
      useMapScroll(stack.modifiers.data);
      stack.quantity -= 1;
      if (stack.quantity <= 0) player.inventory.splice(idx, 1);
      set({ player: { ...player } });
      return;
    }

    if (itemKey.startsWith('scroll_')) {
      const elementToLearn = itemKey.substring(7) as Element;
      const currentElements = getPlayerElements(player);
      if (currentElements.includes(elementToLearn)) {
        set((state) => ({
          log: [...state.log.slice(-499), createLog(`You already possess the ${elementToLearn.toUpperCase()} elemental affinity!`, 'warning', state.turnCount)]
        }));
        return;
      }
      const updatedLearned = player.affinity.learned ? [...player.affinity.learned] : [];
      updatedLearned.push(elementToLearn);

      player.affinity.learned = updatedLearned;
      set((state) => ({
        log: [...state.log.slice(-499), createLog(`📜 You read the Scroll of ${elementToLearn.toUpperCase()}! You have unlocked the ${elementToLearn.toUpperCase()} affinity and its skill tree!`, 'success', state.turnCount)]
      }));

      stack.quantity -= 1;
      if (stack.quantity <= 0) player.inventory.splice(idx, 1);
      set({ player: { ...player } });
      return;
    }

    stack.quantity -= 1;
    if (stack.quantity <= 0) player.inventory.splice(idx, 1);

    switch (itemKey) {
      case 'boss_egg': {
        if (stack.modifiers?.bossTemplate) {
          const template = JSON.parse(stack.modifiers.bossTemplate);
const newCreature: any = {
             id: uuidv4(),
             templateKey: template.key,
             nickname: `Mini ${template.name}`,
             level: 1,
             experience: 0n,
             currentHealth: template.baseHealth / 2.5,
            maxHealth: template.baseHealth / 2.5,
            currentMana: template.baseMana / 2.5,
            maxMana: template.baseMana / 2.5,
            attack: template.baseAttack / 2.5,
            defense: template.baseDefense / 2.5,
            speed: template.baseSpeed / 2.5,
            skills: template.skills.map((s: any) => typeof s === 'string' ? s : s.key),
            traits: [],
            mutations: ['Guardian Rebirth'],
            affection: 5,
            class: 'legendary'
          };
          if (player.creatures.length < 6) {
            player.creatures.push(newCreature);
            set((state) => ({
              log: [...state.log.slice(-499), createLog(`The Boss Egg hatched! A young ${template.name} has joined your deck.`, 'success', state.turnCount)]
            }));
            stack.quantity -= 1;
            if (stack.quantity <= 0) player.inventory.splice(idx, 1);
          } else {
            set((state) => ({
              log: [...state.log.slice(-499), createLog('Your Soul Deck is full. Release a creature first.', 'warning', state.turnCount)]
            }));
            return;
          }
        }
        break;
      }
      case 'healing_herb': {
        const heal = 25;
        player.life.current = Math.min(player.life.max, player.life.current + heal);
        set((state) => ({
          log: [...state.log.slice(-499), createLog(`Used Healing Herb. Restored ${heal} HP.`, 'success', state.turnCount)]
        }));
        break;
      }
      case 'mana_crystal': {
        const mana = 20;
        player.energy.current = Math.min(player.energy.max, player.energy.current + mana);
        set((state) => ({
          log: [...state.log.slice(-499), createLog(`Used Mana Crystal. Restored ${mana} Mana.`, 'success', state.turnCount)]
        }));
        break;
      }
      case 'basic_food': {
        const hp = 15, mana = 10;
        player.life.current = Math.min(player.life.max, player.life.current + hp);
        player.energy.current = Math.min(player.energy.max, player.energy.current + mana);
        set((state) => ({
          log: [...state.log.slice(-499), createLog(`Ate Travel Rations. Restored ${hp} HP and ${mana} Mana.`, 'success', state.turnCount)]
        }));
        break;
      }
      default:
        set((state) => ({
          log: [...state.log.slice(-499), createLog(`Used ${itemKey.replace(/_/g, ' ')}.`, 'success', state.turnCount)]
        }));
    }
    set((s: any) => ({ player: s.player }));
  },

  startActivity: (type: 'creature_training' | 'physical_training' | 'rest' | 'search_tracks' | 'search_animals', duration: number, message: string, creatureId?: string) => {
    const { player, activity } = get();
    if (!player) return;
    if (activity) {
      set((state) => ({
        log: [...state.log.slice(-499), createLog('You are already engaged in an activity.', 'warning', state.turnCount)]
      }));
      return;
    }

    const endTime = Date.now() + duration;
    set({ activity: { type, duration, endTime, message, creatureId } });
    set((state) => ({
      log: [...state.log.slice(-499), createLog(message, 'info', state.turnCount)]
    }));

    setTimeout(() => {
      get().finishActivity();
    }, duration);
  },

  cancelActivity: () => {
    const { activity } = get();
    if (activity) {
      set((state) => ({
        log: [...state.log.slice(-499), createLog(`Activity ${activity.type.replace(/_/g, ' ')} cancelled.`, 'warning', state.turnCount)]
      }));
      set({ activity: null });
    }
  },

  finishActivity: () => {
    const { player, currentWorldId, activity, appendLog } = get();
    if (!player || !activity) return;

    let xpGain = 0;
    let message = `Your ${activity.type.replace(/_/g, ' ')} is complete!`;

    switch (activity.type) {
      case 'creature_training': {
         const creature = player.creatures.find(c => c.id === activity.creatureId);
         if (creature) {
           const creatureXp = Math.floor(activity.duration / 1000) * 0.5;
           const xpResult = applyCreatureXP(creature, creatureXp);
           const creatureWithAffection = applyAffectionGain(xpResult.creature, 'training');
           if (xpResult.leveledUp) {
             appendLog(`${creature.nickname || 'Creature'} reached Level ${xpResult.newLevel}! (+${xpResult.statsGained.hp} HP, +${xpResult.statsGained.attack} ATK, +${xpResult.statsGained.defense} DEF, +${xpResult.statsGained.speed} SPD)`, 'success');
             if (xpResult.evolved) {
               appendLog(`EVOLUTION! ${creature.nickname || 'Creature'} has evolved into ${xpResult.newClass?.toUpperCase() || 'a higher form'}!`, 'success');
             }
             if (xpResult.mutations && xpResult.mutations.length > 0) {
               const labels = xpResult.mutations.map(k => k.replace(/_/g, ' ')).join(', ');
               appendLog(`🧬 ${creature.nickname || 'Creature'} mutated: ${labels}!`, 'warning');
             }
           }
           appendLog(`${creature.nickname || 'Creature'} gained ${creatureXp} XP from training!`, 'success');
           xpGain = creatureXp / 4;
           set((state) => ({
             player: state.player ? {
               ...state.player,
               creatures: state.player.creatures.map((c: any) => c.id === creature.id ? creatureWithAffection : c),
             } : state.player,
           }));
         }
         break;
       }
case 'physical_training': {
         xpGain = Math.floor(activity.duration / 1000) * 0.2;
         const statGain = Math.floor(xpGain / 10);
         player.strength += statGain;
         player.vitality += statGain;
         player.speed += statGain;
         player.dexterity += statGain;
         message += ` You feel stronger! (+${statGain} all physical stats)`;
         break;
      }
      case 'rest':
        player.energy.current = player.energy.max;
        player.nerve.current = player.nerve.max;
        player.life.current = player.life.max;
        message += ` You are fully rested and rejuvenated.`;
        break;
      case 'search_tracks':
        xpGain = Math.floor(activity.duration / 1000) * 0.1;
        if (Math.random() < 0.3) {
          message += ` You found some interesting tracks leading deeper into the biome.`;
        }
        break;
      case 'search_animals':
        xpGain = Math.floor(activity.duration / 1000) * 0.15;
        if (Math.random() < 0.2) {
          message += ` You spotted a rare creature in the distance!`;
        }
        break;
    }

const updatedPlayer = addPlayerXP(player, xpGain, appendLog, getWorldModifier(currentWorldId));

    set({ player: updatedPlayer, activity: null });
    appendLog(message, 'success');
  },

  resolveTrapRoom: (choice: string) => {
    const { player, combat, appendLog } = get();
    if (!player || !combat.roomInteraction?.active) return;

    const rng = new SeededRandom(Date.now());
    const result = resolveRoomTrap(choice, player.dexterity, player.defense, rng);
    
    const updatedLife = result.success 
      ? player.life 
      : { ...player.life, current: Math.max(1, player.life.current - (result.damageTaken || 0)) };

    set((s: any) => ({
      player: { ...s.player, life: updatedLife },
      dungeon: { ...s.dungeon, clearedFloors: [...s.dungeon.clearedFloors, s.dungeon.currentFloor] },
      combat: { 
        ...s.combat, 
        roomInteraction: { 
          ...s.combat.roomInteraction, 
          active: false, 
          result: { success: result.success, damageTaken: result.damageTaken, message: result.message } 
        } 
      }
    }));
    
    appendLog(result.message, result.success ? 'success' : 'warning');
  },

  resolvePuzzleRoom: (choice: string) => {
    const { player, combat, appendLog } = get();
    if (!player || !combat.roomInteraction?.active) return;

    const rng = new SeededRandom(Date.now());
    const result = resolveRoomPuzzle(choice, rng);
    
    set((s: any) => ({
      dungeon: { ...s.dungeon, clearedFloors: [...s.dungeon.clearedFloors, s.dungeon.currentFloor] },
      combat: { 
        ...s.combat, 
        roomInteraction: { 
          ...s.combat.roomInteraction, 
          active: false, 
          result: { success: result.success, message: result.message } 
        } 
      }
    }));
    
    appendLog(result.message, result.success ? 'success' : 'warning');
  },

  resolveEliteRoom: () => {
    const { player, dungeon, currentWorldId, startCombat, appendLog } = get();
    if (!player) return;

    const rng = new SeededRandom(Date.now());
    const eliteInteraction = generateEliteInteraction(rng, currentWorldId);
    const enemyLevel = eliteInteraction.enemyLevel;
    
    const eliteTemplate: CreatureTemplate = {
      key: 'elite_guardian',
      name: eliteInteraction.enemyName,
      class: 'rare',
      type: 'construct',
      elements: ['earth'],
      baseHealth: 50 + (enemyLevel * 8),
      baseAttack: 10 + (enemyLevel * 2),
      baseDefense: 8 + (enemyLevel * 1.5),
      baseSpeed: 5 + enemyLevel,
      baseMana: 20,
      baseExpValue: 30 + (enemyLevel * 2),
      skills: [{ key: 'earth_slash', name: 'Earth Slash', description: 'A powerful earth attack', power: 15, cost: 5 }],
      description: 'An elite guardian of the dungeon.',
      isBoss: false,
    };

    startCombat(eliteTemplate, eliteInteraction.enemyName, 'normal');
    set((s: any) => ({
      dungeon: { ...s.dungeon, inEncounter: true, encounterType: 'guardian' }
    }));
    appendLog(`An elite ${eliteInteraction.enemyName} appears!`, 'warning');
  },

  resolveVendorRoom: (itemId: string) => {
    const { player, combat, appendLog } = get();
    if (!player || !combat.roomInteraction?.active) return;

    const vendorInteraction = combat.roomInteraction.vendorData as VendorRoomInteraction;
    const items = vendorInteraction?.items;
    if (!items) {
      appendLog('No vendor data available.', 'error');
      return;
    }
    const item = items.find(i => i.key === itemId);
    
    if (!item) {
      appendLog('Item not found in vendor stock.', 'error');
      return;
    }

    if (player.money < item.price) {
      appendLog('Insufficient stones for purchase.', 'warning');
      return;
    }

    const updatedInventory = [...player.inventory];
    const existing = updatedInventory.find(i => i.templateKey === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      updatedInventory.push({ templateKey: itemId, quantity: 1 });
    }

    set((s: any) => ({
      player: { 
        ...s.player, 
        money: s.player.money - item.price,
        inventory: updatedInventory 
      },
      dungeon: { ...s.dungeon, clearedFloors: [...s.dungeon.clearedFloors, s.dungeon.currentFloor] }
    }));
    
    appendLog(`Purchased ${item.name} for ${item.price} stones!`, 'success');
  },

  resolveTreasureRoom: () => {
    const { player, dungeon, currentWorldId, combat, appendLog } = get();
    if (!player) return;

    const rng = new SeededRandom(Date.now());
    const treasureInteraction = generateTreasureInteraction(rng, currentWorldId);
    const updatedInventory = [...player.inventory];

    let itemKey = 'resource_shard';
    let itemName = 'Essence Shard';
    let fortuneMessage = treasureInteraction.hasMythicalEgg
      ? 'An ornate chest pulses with ethereal light! You found a Mythical Egg!'
      : 'You found valuable treasure!';

    if (treasureInteraction.hasMythicalEgg) {
      itemKey = 'mythical_egg';
      itemName = 'Mythical Egg';
      updatedInventory.push({ templateKey: itemKey, quantity: 1 });
    } else {
      const lootTables = [
        { key: 'resource_shard', name: 'Essence Shard' },
        { key: 'essence', name: 'Pure Essence' },
        { key: 'crystal', name: 'Prismatic Crystal' },
      ];
      const lootIndex = rng.int(0, lootTables.length - 1);
      const loot = lootTables[lootIndex];
      if (loot) {
        itemName = loot.name;
        updatedInventory.push({ templateKey: loot.key, quantity: 1 + rng.int(0, 2) });
      }
    }

    set((s: any) => ({
      player: { ...s.player, inventory: updatedInventory },
      dungeon: { 
        ...s.dungeon, 
        inEncounter: false, 
        encounterType: undefined,
        clearedFloors: [...s.dungeon.clearedFloors, s.dungeon.currentFloor] 
      },
      combat: { ...s.combat, roomInteraction: undefined, active: false }
    }));

    appendLog(`${fortuneMessage} Found: ${itemName}`, 'success');
  },
});
