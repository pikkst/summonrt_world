import type { GameStore, GameStoreState, PlayerState, WorldData, LogEntry, QuestInstance, Element, CreatureInstance, SetState, CreatureTemplate } from '../types.ts';
import { createLog, calculateMovementModifiers, processTileDiscovery, getPlayerElements, addPlayerXP, getWorldModifier, applyMinViableLevelScaling, calculateMinViableLevel } from '../helpers.ts';
import { generateTile } from '../../../core/worldGenerator.ts';
import { getTileKey, getAffinityWeight, calculateBaseCaptureProbability, DUNGEON_ASCEND_SCROLL } from '../../../data/constants.ts';
import { QUEST_TEMPLATES } from '../../../data/quests.ts';
import { generateCreatureTemplate, SKILL_TEMPLATES } from '../../../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../../../utils/SeededRandom.ts';
import type { MissionStatus, MissionModifiers, ActiveMission } from '../../../core/missionQueue.ts';
import { createActiveMission, getCreatureAgilityMod, MissionType, resolveAutomatedCombat, type AutomatedCombatOutcome } from '../../../core/missionQueue.ts';
import type { HeartbeatInstance } from '../../../core/heartbeat.ts';
import { grantPartyXP, applyCreatureXP } from '../../../core/xpCurve.ts';
import { applyAffectionGain } from '../../../core/affection.ts';
import type { GameEngineState } from '../../../core/gameEngine.ts';
import { createHeartbeat } from '../../../core/heartbeat.ts';
import { getAggregateStats, getAllNodes, getCareerModifiers } from '../../../data/careerTree/index';
import { applyCaptureRateBonus, applyXPBoost, getCareerSystemBonuses } from '../../../data/careerTreeIntegration';
import { getFusionResult, calculateFusionRarityWithSpecial } from '../../../data/fusionMatrix.ts';
import { inheritSkills } from '../../../data/fusionUtils.ts';
import { getSoulCrystalTierForClass } from '../../../data/constants.ts';
import { getSynergyNames, calculateSynergyEffects } from '../../../data/traitSynergy.ts';
import { generateProceduralIdentity } from '../../../data/proceduralIdentity';
import { generateDungeonTower, exportDungeonRun } from '../../../core/dungeon/DungeonTowerGenerator';
import { generateTrapInteraction, generatePuzzleInteraction, generateEliteInteraction, generateVendorInteraction, generateTreasureInteraction, TrapRoomInteraction, PuzzleRoomInteraction, EliteRoomInteraction, VendorRoomInteraction, TreasureRoomInteraction } from '../../../core/dungeon/DungeonInteractions';
import type { RoomInteractionState } from '../../../types/game.ts';
import { applyPlayerStatisticEvent, type PlayerStatisticEvent } from '../../../core/playerCore/playerStatisticsTracking';
import { getWeatherEffect, getWeatherResourceYieldModifier, getWeatherEncounterModifier, getPlayerElementalAffinityBonus, getEncounterTableForWeather } from '../../../core/Weather';
import axios from 'axios';

function recordPlayerCoreStatistic(set: SetState<GameStore>, event: PlayerStatisticEvent): void {
  set((state) => {
    if (!state.playerCore) return {};
    return {
      playerCore: {
        ...state.playerCore,
        statistics: applyPlayerStatisticEvent(state.playerCore.statistics, event),
      },
    };
  });
}

export const missionActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  movePlayer: (dx: number, dy: number) => {
    const { player, worlds, currentWorldId, appendLog, exploring } = get();
    if (!player || exploring) return;

    const newX = player.tileX + dx;
    const newY = player.tileY + dy;
    const newTileKey = getTileKey(newX, newY);

    const { energyCost } = calculateMovementModifiers(newX, newY);

    if (player.energy.current < energyCost) {
      appendLog('You are too exhausted to push further towards the center. Rest or use items.', 'warning');
      return;
    }

    if (!worlds.get(currentWorldId)?.tiles.has(newTileKey)) {
      const world = worlds.get(currentWorldId)!;
      const newTile = generateTile(newX, newY, currentWorldId);
      world.tiles.set(newTileKey, newTile);
    }

    const world = worlds.get(currentWorldId)!;
    const tile = world.tiles.get(newTileKey)!;

    if (tile.explored) {
      get().finishMovement(newX, newY, newTileKey, false);
      return;
    }

    const duration = currentWorldId * 30;
    const mission = get().addMissionWithModifiers({
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: currentWorldId,
      duration_seconds: duration,
    });

    if (mission) {
      set({
        exploring: {
          tileKey: newTileKey,
          endTime: mission.end_time,
          totalDuration: mission.duration_seconds * 1000,
          targetX: newX,
          targetY: newY,
        },
      });
      appendLog(`Starting exploration mission to sector (${newX}, ${newY}). ETA: ${mission.duration_seconds}s`, 'info');
    }
  },

  finishMovement: (x: number, y: number, tileKey: string, newlyExplored: boolean = false) => {
    const { player, currentWorldId, worlds, appendLog } = get();
    if (!player) return;

    const world = worlds.get(currentWorldId);
    const tile = world?.tiles.get(tileKey);
    if (!tile) return;

    const { energyCost, proximityFactor, difficultyScale } = calculateMovementModifiers(x, y);

    if (player.energy.current < energyCost) {
      appendLog('You reached the sector but are too exhausted to enter. Rest required.', 'warning');
      set({ exploring: null });
      return;
    }

    tile.discovered = true;
    tile.explored = true;

    processTileDiscovery(x, y, currentWorldId, worlds!);

    set((state) => {
      const updatedQuests = state.player!.activeQuests.map((q: QuestInstance) => {
        const template = QUEST_TEMPLATES[q.templateKey];
        if (!template || q.status !== 'active') return q;

        if (template.type === 'explore' && newlyExplored) {
          return { ...q, progress: Math.min(q.targetProgress, q.progress + 1) };
        }
        if (template.type === 'combat' && template.target === 'dungeon_floor') {
          const dungeon = state.dungeon;
          if (dungeon.active) {
            return { ...q, progress: Math.min(q.targetProgress, dungeon.clearedFloors.length) };
          }
        }
        if (template.type === 'combat' && template.target === 'world_boss') {
          const dungeon = state.dungeon;
          if (dungeon.bossDefeated) {
            return { ...q, progress: Math.min(q.targetProgress, q.progress + 1) };
          }
        }
        return q;
      });

      return {
        player: {
          ...state.player!,
          tileX: x,
          tileY: y,
          energy: { ...state.player!.energy, current: state.player!.energy.current - energyCost },
          gameTimeMinutes: (state.player!.gameTimeMinutes + 10) % 1440,
          creatures: (state.player!.creatures || []).map((c: CreatureInstance) => ({
            ...c,
            currentHealth: Math.min((c.currentHealth || 0) + 1, c.maxHealth || 100),
          })),
          activeQuests: updatedQuests,
        },
        turnCount: state.turnCount + 1,
        exploring: null,
      };
    });

    axios.post('http://localhost:5000/api/player/location', {
      playerId: player.id,
      x: x,
      y: y,
      worldId: currentWorldId,
      newExploredTile: newlyExplored ? `${currentWorldId}:${x},${y}` : undefined
    }).then(res => {
      if (res.data.success) {
        set({ nearbyPlayers: res.data.nearby });
        if (res.data.nearby.length > 0) {
          const names = res.data.nearby.map((p: { username?: string }) => p.username).join(', ');
          appendLog(`You sense other summoners nearby: ${names}`, 'info');
        }
      }
    }).catch(err => console.error('Location sync failed', err));

    if (tile.specialType) {
      appendLog(`Discovery! You found a ${tile.specialType.toUpperCase()} at (${x}, ${y})!`, 'success');
    } else {
      appendLog(`Sector (${x}, ${y}) mapped. Danger: ${Math.round(difficultyScale * 10) / 10}x`, newlyExplored ? 'success' : 'info');
    }

    const currentHostilities = player.territorialHostilities || {};
    const updatedHostilities: Record<string, any> = {};
    for (const [key, entry] of Object.entries(currentHostilities)) {
      const remainingTurns = entry.hostilityTurns - 1;
      if (remainingTurns > 0) {
        updatedHostilities[key] = { ...entry, hostilityTurns: remainingTurns };
      }
    }
    if (Object.keys(updatedHostilities).length !== Object.keys(currentHostilities).length) {
      set((state) => ({
        player: {
          ...state.player!,
          territorialHostilities: updatedHostilities,
        }
      }));
    }

    const hostility = updatedHostilities[tileKey];
    if (hostility) {
      const hostileTemplate = {
        key: hostility.creatureKey,
        name: hostility.creatureName,
        class: hostility.class,
        type: hostility.type,
        elements: hostility.elements,
        baseHealth: hostility.baseHealth,
        baseAttack: hostility.baseAttack,
        baseDefense: hostility.baseDefense,
        baseSpeed: hostility.baseSpeed,
        baseMana: hostility.baseMana,
        baseExpValue: hostility.baseExpValue,
        skills: hostility.skills,
        description: hostility.description,
        isBoss: hostility.isBoss,
      };
      setTimeout(() => {
        get().startCombat(hostileTemplate, `Territorial ${hostility.creatureName}`, 'territorial');
      }, 500);
      return;
    }

    const encounterChance = 0.05 + proximityFactor * 0.15;
    
    const weatherState = world?.weather;
    const weatherEncounterMod = weatherState ? getWeatherEncounterModifier(weatherState.currentWeather, weatherState.weatherIntensity) : 1.0;
    const weatherAdjustedChance = encounterChance * weatherEncounterMod;
    
    const encounterRng = new SeededRandom(tile.encounterSeed || Date.now());
    
    if (encounterRng.next() < weatherAdjustedChance) {
      const effectiveTier = currentWorldId + Math.floor(proximityFactor * 10);
      const enemy = generateCreatureTemplate(effectiveTier, encounterRng);
      
      const weatherEffect = weatherState ? getWeatherEffect(weatherState.currentWeather) : { encounterModifier: 1.0, resourceYieldModifier: 1.0, elementalBonus: 0, description: '' };

      const encounterDuration = 10 + Math.floor(Math.random() * 15);
      const encounterMission = get().addMissionWithModifiers({
        type: 'WILD_ENCOUNTER',
        assigned_creatures: [],
        world_layer: currentWorldId,
        duration_seconds: encounterDuration,
        extraModifiers: {
          encounter_data: JSON.stringify({
            templateKey: enemy.key,
            name: enemy.name,
            class: enemy.class,
            type: enemy.type,
            elements: enemy.elements,
            baseHealth: enemy.baseHealth,
            baseAttack: enemy.baseAttack,
            baseDefense: enemy.baseDefense,
            baseSpeed: enemy.baseSpeed,
            baseMana: enemy.baseMana,
            baseExpValue: enemy.baseExpValue,
            skills: enemy.skills,
            description: enemy.description,
            isBoss: enemy.isBoss,
            weather: weatherState?.currentWeather ?? 'Clear',
            weatherDescription: weatherEffect.description,
          }),
        },
      });

      if (encounterMission) {
        const weatherPrefix = weatherState ? `(${weatherState.currentWeather}) ` : '';
        appendLog(`${weatherPrefix}A wild ${enemy.name} appears! Combat will resolve automatically in ${encounterDuration}s...`, 'info');
      }
    }
  },

  searchArea: () => {
    const { player, worlds, currentWorldId, searching } = get();
    if (!player) return;

    const world = worlds.get(currentWorldId);
    if (!world) return;

    const tileKey = getTileKey(player.tileX, player.tileY);
    const tile = world.tiles.get(tileKey);
    if (!tile || !tile.resourceType) {
      get().appendLog('You found nothing of interest here.', 'info');
      return;
    }

    if (searching) {
      get().appendLog('You are already searching this area.', 'warning');
      return;
    }

    const duration = 15 + Math.floor(Math.random() * 30);
    const mission = get().addMissionWithModifiers({
      type: 'SEARCH_AREA',
      assigned_creatures: [],
      world_layer: currentWorldId,
      duration_seconds: duration,
      extraModifiers: { resource_type: tile.resourceType },
    });

    if (mission) {
      set({
        searching: {
          missionId: mission.mission_id,
          resourceType: tile.resourceType,
          endTime: mission.end_time,
          totalDuration: mission.duration_seconds * 1000,
        },
      });
      get().appendLog(`You begin searching the area for ${tile.resourceType}... (${duration}s)`, 'info');
    }
  },

  finishSearch: (resourceKey: string) => {
    const { player, worlds, currentWorldId, searching } = get();
    if (!player || !searching) return;

    const world = worlds.get(currentWorldId);
    const tileKey = getTileKey(player.tileX, player.tileY);
    const tile = world?.tiles.get(tileKey);
    
    const weatherState = world?.weather;
    const weatherEffect = weatherState ? getWeatherEffect(weatherState.currentWeather) : { encounterModifier: 1.0, resourceYieldModifier: 1.0, elementalBonus: 0, description: '' };
    const yieldModifier = getWeatherResourceYieldModifier(weatherState?.currentWeather ?? 'Clear', weatherState?.weatherIntensity ?? 1.0);
    
    const baseFound = Math.min(tile?.resourceQty ?? 0, 1 + Math.floor(Math.random() * 2));
    const found = Math.floor(baseFound * yieldModifier);
    
    if (found > 0 && tile) {
      const existing = (player.inventory || []).find((i) => i.templateKey === resourceKey);
      if (existing) {
        existing.quantity += found;
      } else {
        player.inventory.push({ templateKey: resourceKey, quantity: found });
      }
      tile.resourceQty = Math.max(0, (tile.resourceQty ?? 0) - found);
      const weatherMsg = weatherEffect.description ? ` Under ${weatherState?.currentWeather ?? 'Clear'} skies,` : '';
      get().appendLog(`You found ${found} ${resourceKey}!${weatherMsg} (${Math.round(yieldModifier * 100)}% yield)`, 'success');
    } else {
      get().appendLog('You found nothing of interest here.', 'info');
    }

    set({ searching: null });
  },

  gatherResource: (resourceKey: string) => {
    const { player, worlds, currentWorldId, searching } = get();
    if (!player) return;

    const world = worlds.get(currentWorldId);
    if (!world) return;

    const tileKey = getTileKey(player.tileX, player.tileY);
    const tile = world.tiles.get(tileKey);
    if (!tile || tile.resourceType !== resourceKey || !tile.resourceQty || tile.resourceQty <= 0) {
      get().appendLog('There is no such resource here.', 'warning');
      return;
    }

    if (searching) {
      get().appendLog('You are already engaged in a gathering activity.', 'warning');
      return;
    }

    const duration = 15 + Math.floor(Math.random() * 30);
    const mission = get().addMissionWithModifiers({
      type: 'GATHER_RESOURCE',
      assigned_creatures: [],
      world_layer: currentWorldId,
      duration_seconds: duration,
      extraModifiers: { resource_type: resourceKey },
    });

    if (mission) {
      set({
        searching: {
          missionId: mission.mission_id,
          resourceType: resourceKey,
          endTime: mission.end_time,
          totalDuration: mission.duration_seconds * 1000,
        },
      });
      get().appendLog(`You begin gathering ${resourceKey}... (${duration}s)`, 'info');
    }
  },

  captureCreature: () => {
     const { player, worlds, currentWorldId, capturing, appendLog } = get();
     if (!player) return;

     if (capturing) {
       appendLog('You are already attempting to capture a creature.', 'warning');
       return;
     }

     const world = worlds.get(currentWorldId);
     if (!world) return;

     if (player.creatures.length >= 6) {
       appendLog('Your party is full (6/6). Release a creature first.', 'warning');
       return;
     }

     const rng = new SeededRandom(Date.now() + Math.floor(Math.random() * 10000));
     const creature = generateCreatureTemplate(currentWorldId, rng);

     const playerElements = getPlayerElements(player);
     const hasNebulaShroud = player.skillsUnlocked?.['nebula_shroud'] === true;
     const hasElementMatch = creature.elements.some((el) => playerElements.includes(el));

     if (!hasElementMatch && !hasNebulaShroud) {
       appendLog(`Failed to capture ${creature.name}. Its elements are: ${creature.elements.join(', ').toUpperCase()}. You do not share an elemental affinity with this soul!`, 'warning');
       return;
     }

     const duration = 60;
     const mission = get().addMissionWithModifiers({
       type: 'CAPTURE_CREATURE',
       assigned_creatures: [],
       world_layer: currentWorldId,
       duration_seconds: duration,
     });

if (mission) {
        const initialHpRatio = 0.5 + Math.random() * 0.5;
        set({
          capturing: {
            missionId: mission.mission_id,
            creature: {
              key: creature.key,
              name: creature.name,
              class: creature.class,
              type: creature.type,
              elements: creature.elements,
              baseHealth: creature.baseHealth,
              baseAttack: creature.baseAttack,
              baseDefense: creature.baseDefense,
              baseSpeed: creature.baseSpeed,
              baseMana: creature.baseMana,
              baseExpValue: creature.baseExpValue,
              skills: creature.skills.map((s) => typeof s === 'string' ? { key: s, name: '', description: '', power: 0, cost: 0 } : s),
              description: creature.description,
              isBoss: creature.isBoss,
              currentHealth: Math.floor(creature.baseHealth * initialHpRatio),
            },
            endTime: mission.end_time,
            totalDuration: mission.duration_seconds * 1000,
          },
        });
        appendLog(`Beginning capture ritual for ${creature.name}... (${mission.duration_seconds}s)`, 'info');
      }
    },

finishCapture: () => {
     const { player, capturing, worlds, currentWorldId, appendLog } = get();
     if (!player || !capturing) return;

     const creature = capturing.creature;
     const playerElements = getPlayerElements(player);
     const hasNebulaShroud = player.skillsUnlocked?.['nebula_shroud'] === true;

     const world = worlds.get(currentWorldId);
     const weatherState = world?.weather;
     const weatherElementalBonus = weatherState ? getPlayerElementalAffinityBonus(weatherState.currentWeather, playerElements) : 1.0;

     const creatureLevel = player.currentWorldId || 1;

     if (creatureLevel > player.level + 5 && !hasNebulaShroud) {
       appendLog(`This ${creature.name} (Level ${creatureLevel}) is far too powerful for you to bind! You need to be at least Level ${creatureLevel - 5}.`, 'warning');
       set({ capturing: null });
       return;
     }

     const currentHp = creature.currentHealth ?? creature.baseHealth;
     const maxHp = creature.baseHealth;
     
      let pCapture = calculateBaseCaptureProbability(
        currentHp,
        maxHp,
        playerElements,
        creature.elements,
        creature.class,
        player.level,
        creatureLevel
      );

      const treeData = getAllNodes();
      const aggregatedStats = getAggregateStats(player, treeData);
      const careerBonuses = getCareerSystemBonuses(aggregatedStats);

      const hasWildWhisper = player.skillsUnlocked?.['wild_whisper'] === true;
      const hasBeastmaster = player.skillsUnlocked?.['beastmaster'] === true;

      const skillBonus = (player.skillPoints * 0.01) + (hasWildWhisper ? 0.15 : 0) + (hasBeastmaster ? 0.3 : 0);
      const careerCaptureBonus = applyCaptureRateBonus(0, careerBonuses);

      pCapture = Math.min(0.95, pCapture * weatherElementalBonus + skillBonus + careerCaptureBonus);
      
      const weatherPrefix = weatherState ? `(${weatherState.currentWeather}) ` : '';

     const roll = Math.random();
     if (roll < pCapture) {
       const newCreature = {
         id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
         templateKey: creature.key,
         nickname: creature.name,
         level: 1,
         experience: 0n,
         currentHealth: creature.baseHealth,
         currentMana: creature.baseMana,
         maxHealth: creature.baseHealth,
         maxMana: creature.baseMana,
         skills: creature.skills.map((s) => typeof s === 'string' ? s : s.key),
         traits: [],
         mutations: [],
         affection: 10,
         class: creature.class,
         attack: creature.baseAttack,
         defense: creature.baseDefense,
         speed: creature.baseSpeed,
         elements: creature.elements,
         type: creature.type,
         proceduralIdentity: generateProceduralIdentity(
           creature.type,
           creature.elements,
           () => Math.random()
         ),
       };

       set((state) => {
         const updatedQuests = state.player!.activeQuests.map((q: QuestInstance) => {
           const template = QUEST_TEMPLATES[q.templateKey];
           if (!template || q.status !== 'active') return q;
           if (template.type === 'summon') {
             return { ...q, progress: Math.min(q.targetProgress, q.progress + 1) };
           }
           return q;
         });

         return {
           player: {
             ...state.player!,
             creatures: [...state.player!.creatures, newCreature],
             activeQuests: updatedQuests,
           }
         };
       });
       recordPlayerCoreStatistic(set, { type: 'CreatureContracted' });
       const weatherBonusMsg = weatherElementalBonus > 1 ? ` (${Math.round((weatherElementalBonus - 1) * 100)}% elemental affinity bonus)` : '';
       appendLog(`${weatherPrefix}✨ Success! You captured a new creature: ${creature.name} (${creature.class.toUpperCase()})!${weatherBonusMsg}`, 'success');
     } else {
       if (player.creatures.length > 0) {
         appendLog(`${weatherPrefix}💨 Failed to capture ${creature.name}. The creature's soul broke free of your binding spell! (Capture Chance: ${Math.round(pCapture * 100)}%)`, 'warning');
         setTimeout(() => {
           get().startCombat(creature, `Wild ${creature.name}`, 'aggressive');
         }, 500);
       } else {
         appendLog(`${weatherPrefix}💨 Failed to capture ${creature.name}. The creature escapes but now views your territory as hostile! (Capture Chance: ${Math.round(pCapture * 100)}%)`, 'warning');
         const tileKey = getTileKey(player.tileX, player.tileY);
         const hostilityEntry = {
           creatureKey: creature.key,
           creatureName: creature.name,
           class: creature.class,
           type: creature.type,
           elements: creature.elements,
           baseHealth: creature.baseHealth,
           baseAttack: creature.baseAttack,
           baseDefense: creature.baseDefense,
           baseSpeed: creature.baseSpeed,
           baseMana: creature.baseMana,
           baseExpValue: creature.baseExpValue,
           skills: creature.skills.map((s) => typeof s === 'string' ? { key: s, name: '', description: '', power: 0, cost: 0 } : s),
           description: creature.description,
           isBoss: creature.isBoss,
           hostilityTurns: 5 + Math.floor(Math.random() * 5),
         };
         set((state) => ({
           player: {
             ...state.player!,
             territorialHostilities: {
               ...(state.player!.territorialHostilities || {}),
               [tileKey]: hostilityEntry,
             },
           }
         }));
       }
     }

     set({ capturing: null });
   },

  interactNPC: () => {
    const { player, worlds, currentWorldId, appendLog } = get();
    if (!player) return;
    const world = worlds.get(currentWorldId);
    const tile = world?.tiles.get(getTileKey(player.tileX, player.tileY));
    const npc = tile?.npc;

    if (!npc) {
      appendLog('There is no one here to talk to.', 'info');
      return;
    }

    appendLog(`${npc.name} (${npc.role}): "${npc.dialogue[0]}"`, 'info');

    if (npc.quests && npc.quests.length > 0) {
      npc.quests.forEach(qKey => {
        const template = QUEST_TEMPLATES[qKey];
        const alreadyHas = player.activeQuests.find(aq => aq.templateKey === qKey);
        const alreadyDone = player.completedQuests.includes(qKey);

        if (!alreadyHas && !alreadyDone) {
          get().acceptQuest(qKey);
        }
      });
    }
  },

  acceptQuest: (questKey: string) => {
    const template = QUEST_TEMPLATES[questKey];
    if (!template) return;

    set((state) => {
      const newQuest: QuestInstance = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        templateKey: questKey,
        status: 'active',
        progress: 0,
        targetProgress: template.amount
      };
      return {
        player: {
          ...state.player!,
          activeQuests: [...state.player!.activeQuests, newQuest]
        },
        log: [...state.log, createLog(`New Quest: ${template.title}`, 'system', state.turnCount)]
      };
    });
  },

  completeQuest: (questId: string) => {
    const { player, currentWorldId, appendLog } = get();
    if (!player) return;

    const qIdx = player.activeQuests.findIndex(q => q.id === questId);
    if (qIdx === -1) return;

    const quest = player.activeQuests[qIdx];
    if (!quest) return;

    const template = QUEST_TEMPLATES[quest.templateKey];
    if (!template) return;

    if ((quest.progress || 0) < quest.targetProgress) return;

    const baseElements = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'];
    
    if (template.rewards?.element === 'omni') {
      const currentElements = getPlayerElements(player);
      const hasAllBaseElements = baseElements.every(el => currentElements.includes(el as Element));
      if (!hasAllBaseElements) {
        set((state) => ({
          log: [...state.log.slice(-499), createLog('To unlock Omni, you must first master all 10 base elements. The convergence fails.', 'warning', state.turnCount)]
        }));
        return;
      }
    }

    const updatedQuests = [...player.activeQuests];
    updatedQuests.splice(qIdx, 1);

    let updatedLearned = player.affinity.learned ? [...player.affinity.learned] : [];
    if (template.rewards?.element) {
      const newEl = template.rewards.element as Element;
      const currentElements = getPlayerElements(player);
      if (!currentElements.includes(newEl)) {
        updatedLearned.push(newEl);
        appendLog(`✨ Elemental Awakening! Through completing the quest, you have learned the element: ${newEl.toUpperCase()}!`, 'success');
      }
    }

    const basePlayer = {
      ...player,
      activeQuests: updatedQuests,
      completedQuests: [...player.completedQuests, quest.templateKey],
      money: player.money + (template.rewards?.money || 0),
      affinity: {
        ...player.affinity,
        learned: updatedLearned
      }
    };

    const updatedPlayer = addPlayerXP(basePlayer, template.rewards?.exp || 0, appendLog, getWorldModifier(currentWorldId));

    set({ player: updatedPlayer });
    recordPlayerCoreStatistic(set, { type: 'QuestCompleted', questKey: quest.templateKey });
    if ((template.rewards?.money || 0) > 0) {
      recordPlayerCoreStatistic(set, { type: 'GoldEarned', amount: template.rewards!.money! });
    }
    appendLog(`Quest Completed: ${template.title}!`, 'success');
  },

  breedCreatures: (id1: string, id2: string, selectedSkills: string[]) => {
    const { player, worlds, currentWorldId, appendLog } = get();
    if (!player) return;

    const world = worlds.get(currentWorldId);
    const tile = world?.tiles.get(getTileKey(player.tileX, player.tileY));

    if (tile?.specialType !== 'city') {
      appendLog('Soul Fusion can only be performed at a Soul Forge in a City.', 'warning');
      return;
    }

    const c1 = player.creatures.find(c => c.id === id1);
    const c2 = player.creatures.find(c => c.id === id2);

    if (!c1 || !c2 || player.creatures.length >= 6) {
      appendLog('Invalid selection or party full.', 'error');
      return;
    }

    const essenceIdx = player.inventory.findIndex(i => i.templateKey === 'essence');
    const essenceStack = player.inventory[essenceIdx];
    if (!essenceStack || essenceStack.quantity < 5) {
      appendLog('Soul Fusion requires 5 Essence.', 'warning');
      return;
    }

    const baseClass = (c1.class || 'common') === (c2.class || 'common')
      ? c1.class
      : (getSoulCrystalTierForClass(c1.class || 'common') >= getSoulCrystalTierForClass(c2.class || 'common')
        ? c1.class
        : c2.class) || 'common';

    const effectiveBaseClass = baseClass || 'common';
    const requiredSoulCrystalTier = getSoulCrystalTierForClass(effectiveBaseClass);
    const soulCrystalKey = `soul_crystal_${requiredSoulCrystalTier}` as const;

    const crystalIdx = player.inventory.findIndex(i => i.templateKey === soulCrystalKey);
    const crystalStack = player.inventory[crystalIdx];
    if (!crystalStack || crystalStack.quantity < 1) {
      appendLog(`Soul Fusion for ${effectiveBaseClass.toUpperCase()} creatures requires a Soul Crystal (${requiredSoulCrystalTier.charAt(0).toUpperCase() + requiredSoulCrystalTier.slice(1)}).`, 'warning');
      return;
    }

    const rng = new SeededRandom(Date.now());
    const isAncient = rng.next() < 0.05;
    const isVoid = rng.next() < 0.03;
    const isStellar = rng.next() < 0.02;

    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);

    const fusionBonusBoost = 1 + ((careerBonuses.fusion_success_chance || 0) / 100);
    const bonus = (1.15 + (rng.next() * 0.15) + (isAncient ? 0.25 : 0)) * fusionBonusBoost;
    const newAttack = Math.floor(Math.max(c1.attack || 10, c2.attack || 10) * bonus);
    const newDefense = Math.floor(Math.max(c1.defense || 5, c2.defense || 5) * bonus);
    const newSpeed = Math.floor(Math.max(c1.speed || 5, c2.speed || 5) * bonus);
    const newMaxHP = Math.floor(Math.max(c1.maxHealth || 50, c2.maxHealth || 50) * bonus);
    const newMaxMana = Math.floor(Math.max(c1.maxMana || 20, c2.maxMana || 20) * bonus);

    const combinedElements = Array.from(new Set([...(c1.elements || []), ...(c2.elements || [])]));

    let newElements = combinedElements.slice(0, 2);
    let fusionResultElement: string | undefined;
    let specialFusionOccurred = false;

    const parentElements = [...(c1.elements || []), ...(c2.elements || [])];
    const hasLight = parentElements.includes('light');
    const hasDarkness = parentElements.includes('darkness');
    if (hasLight && hasDarkness) {
      fusionResultElement = getFusionResult('light', 'darkness', rng.next.bind(rng));
      specialFusionOccurred = true;
      if (fusionResultElement === 'aether') {
        newElements = ['aether' as Element];
      } else if (fusionResultElement === 'unstable_void') {
        newElements = ['void' as Element];
      }
    }

    if (!specialFusionOccurred) {
      if (isVoid && combinedElements.length > 2) newElements = [combinedElements[0] as Element, 'void' as Element];
      if (isStellar && combinedElements.length > 2) newElements = [combinedElements[0] as Element, 'starlight' as Element];
    }

    const mutations = [];
    if (isAncient) mutations.push('Ancient Bloodline');
    if (isVoid && !specialFusionOccurred) mutations.push('Void Touched');
    if (isStellar && !specialFusionOccurred) mutations.push('Stellar Echo');
    if (specialFusionOccurred && fusionResultElement === 'unstable_void') mutations.push('Unstable Core');

    const finalSkills = inheritSkills(c1.skills || [], c2.skills || [], selectedSkills);

    const parentTraits = new Set([...(c1.traits || []), ...(c2.traits || [])]);
    const inheritedTraits = Array.from(parentTraits).slice(0, 2);

    const { statBonuses, specialEffects } = calculateSynergyEffects(inheritedTraits);
    const synergyATTACK = (statBonuses['attack'] || 0);
    const synergyDEFENSE = (statBonuses['defense'] || 0);
    const synergySPEED = (statBonuses['speed'] || 0);

    const synergyNicknames = getSynergyNames(inheritedTraits);

    const newClass = calculateFusionRarityWithSpecial(
      c1.class || 'common',
      c2.class || 'common',
      isAncient,
      isVoid,
      isStellar,
      specialFusionOccurred && fusionResultElement === 'aether'
    );

    const newCreature: any = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      templateKey: `fused_${c1.templateKey}_${c2.templateKey}`,
      nickname: specialFusionOccurred && fusionResultElement === 'aether'
        ? `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Aether Manifestation`
        : specialFusionOccurred && fusionResultElement === 'unstable_void'
          ? `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Unstable Void`
          : synergyNicknames.length > 0
            ? `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} ${synergyNicknames.join(' ')} Hybrid`
            : `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Hybrid`,
      level: 1,
      experience: 0,
      currentHealth: newMaxHP + (statBonuses['healthRegen'] ? Math.floor(newMaxHP * 0.1) : 0),
      maxHealth: newMaxHP,
      currentMana: newMaxMana + (statBonuses['maxMana'] || 0),
      maxMana: newMaxMana,
      attack: newAttack + synergyATTACK,
      defense: newDefense + synergyDEFENSE,
      speed: newSpeed + synergySPEED,
      skills: finalSkills,
      traits: inheritedTraits,
      mutations: mutations,
      affection: 5,
      fusionRecipe: {
        parentAKey: c1.templateKey,
        parentBKey: c2.templateKey,
      },
      class: newClass,
      elements: newElements,
      type: specialFusionOccurred && fusionResultElement === 'unstable_void' ? 'demon' : c1.type || 'spirit',
      synergyEffects: specialEffects.length > 0 ? specialEffects : undefined,
      proceduralIdentity: generateProceduralIdentity(
        specialFusionOccurred && fusionResultElement === 'unstable_void' ? 'demon' : c1.type || 'spirit',
        newElements,
        rng.next.bind(rng)
      ),
    };

    const updatedInventory = [...player.inventory];
    const essenceStackItem = updatedInventory[essenceIdx];
    if (essenceStackItem) {
      essenceStackItem.quantity -= 5;
      if (essenceStackItem.quantity <= 0) updatedInventory.splice(essenceIdx, 1);
    }

    const crystalStackItem = updatedInventory[crystalIdx];
    if (crystalStackItem) {
      crystalStackItem.quantity -= 1;
      if (crystalStackItem.quantity <= 0) updatedInventory.splice(crystalIdx, 1);
    }

    const updatedCreatures = player.creatures.filter(c => c.id !== id1 && c.id !== id2);
    updatedCreatures.push(newCreature);

    set((state) => {
      const updatedQuests = state.player!.activeQuests.map((q: QuestInstance) => {
        const template = QUEST_TEMPLATES[q.templateKey];
        if (template && template.type === 'summon' && template.target === 'fusion' && q.status === 'active') {
          return { ...q, progress: Math.min(q.targetProgress, q.progress + 1) };
        }
        return q;
      });

      return {
        player: {
          ...state.player!,
          inventory: updatedInventory,
          creatures: updatedCreatures,
          activeQuests: updatedQuests,
        }
      };
    });

    appendLog(`Soul Fusion Complete! A new manifestation has emerged.`, 'success');
    if (isAncient) appendLog(`SURPRISE: The Forge flared with golden light! An Ancient Bloodline has awakened!`, 'success');
    if (specialFusionOccurred && fusionResultElement === 'aether') {
      appendLog(`✨ CELESTIAL CONVERGENCE! Light and Darkness have aligned to form AEther! The creature is blessed with rare power!`, 'success');
    }
    if (specialFusionOccurred && fusionResultElement === 'unstable_void') {
      appendLog(`💥 ENTROPIC REACTION! The fusion produced an Unstable Void creature! Handle with extreme caution!`, 'warning');
    }
    if (isVoid || isStellar) appendLog(`SURPRISE: Dimensional rifts opened during fusion! A mutation occurred!`, 'warning');
    if (synergyNicknames.length > 0) {
      appendLog(`✨ TRAIT SYNERGY ACTIVATED! ${synergyNicknames.join(' + ')} combined for special effects!`, 'success');
    }

    set({ screen: 'creatures' });
  },

  enterDungeon: () => {
    const { player, currentWorldId, worlds, appendLog } = get();
    if (!player) return;
    const world = worlds.get(currentWorldId);
    if (!world) return;
    if (player.level < world.tier * 5) {
      set((state) => ({
        log: [...state.log.slice(-499), createLog(`Your level is too low. Required: ${world.tier * 5}`, 'warning', state.turnCount)]
      }));
      return;
    }
    const globalSeed = currentWorldId * 1000 + player.level;
    const tower = generateDungeonTower(currentWorldId, globalSeed);
    const dungeonRun = exportDungeonRun(tower);
    set({ screen: 'dungeon', dungeon: { active: true, worldId: currentWorldId, currentFloor: 0, totalFloors: tower.totalFloors, clearedFloors: [], bossDefeated: false, inEncounter: false, tower } });
  },

  descendDungeon: () => {
    const { player, currentWorldId, worlds, dungeon, appendLog, startCombat } = get();
    if (!player) return;
    const world = worlds.get(currentWorldId);
    if (!world) return;

    if (dungeon.currentFloor >= dungeon.totalFloors) {
      appendLog('You have reached the boss floor!', 'system');
      return;
    }

    if (dungeon.currentFloor > 0 && !dungeon.clearedFloors.includes(dungeon.currentFloor)) {
      const hasTeleportScroll = player.inventory.some(i => i.templateKey === DUNGEON_ASCEND_SCROLL);
      if (!hasTeleportScroll) {
        appendLog('The floor guardian blocks your path! Defeat it to ascend, or find a rare Teleport Scroll to bypass.', 'warning');
        return;
      }
      const updatedInventory = player.inventory.filter(i => i.templateKey !== DUNGEON_ASCEND_SCROLL);
      set((state) => ({
        player: { ...state.player!, inventory: updatedInventory }
      }));
      appendLog('You burned a Teleport Scroll to bypass the guardian and ascend!', 'success');
    }

    const nextFloor = dungeon.currentFloor + 1;
    const isBoss = nextFloor === dungeon.totalFloors;
    const tower = dungeon.tower;
    
    const rng = new SeededRandom(Date.now() + nextFloor);
    const floorGraph = tower?.floors.find(f => f.floorIndex === nextFloor);
    const roomTypes = ['combat', 'trap', 'puzzle', 'treasure', 'elite', 'vendor', 'rest'];
    const randomRoomType = roomTypes[rng.int(0, roomTypes.length - 1)];
    
    let roomInteraction: RoomInteractionState | undefined;
    let encounterType: 'guardian' | 'trap' | 'treasure' | 'boss' | 'puzzle' | 'elite' | 'vendor' = 'guardian';

    if (isBoss) {
      encounterType = 'boss';
      const bossTemplate: CreatureTemplate = {
        key: 'world_boss',
        name: `${world.name} Guardian`,
        class: 'legendary',
        type: 'dragon',
        elements: ['earth', 'fire'],
        baseHealth: 120 + currentWorldId * 15,
        baseAttack: 15 + currentWorldId * 2,
        baseDefense: 10 + currentWorldId,
        baseSpeed: 5 + Math.floor(currentWorldId / 2),
        baseMana: 30,
        baseExpValue: 50 + currentWorldId * 5,
        skills: [{ key: 'world_slam', name: 'World Slam', description: 'Devastating earth attack', power: 20, cost: 10 }],
        description: 'The tower guardian.',
        isBoss: true,
      };
      startCombat(bossTemplate, 'Tower Guardian', 'normal');
      set((state) => ({
        dungeon: {
          ...state.dungeon,
          currentFloor: nextFloor,
          inEncounter: true,
          encounterType: 'boss',
        },
        screen: 'combat',
      }));
      return;
    }

    switch (randomRoomType) {
      case 'trap': {
        encounterType = 'trap';
        const trapInteraction = generateTrapInteraction(rng);
        roomInteraction = {
          active: true,
          roomType: 'trap',
          roomId: `floor_${nextFloor}_trap`,
          choices: trapInteraction.choices.map(c => ({ id: c.id, label: c.label, description: c.description })),
          message: trapInteraction.description,
        };
        set((state) => ({
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: true,
            encounterType: 'trap',
          },
          combat: {
            ...state.combat,
            active: false,
            log: [`You enter a trap room. ${trapInteraction.description}`],
          },
        }));
        return;
      }
      case 'puzzle': {
        encounterType = 'puzzle';
        const puzzleInteraction = generatePuzzleInteraction(rng, currentWorldId);
        roomInteraction = {
          active: true,
          roomType: 'puzzle',
          roomId: `floor_${nextFloor}_puzzle`,
          choices: puzzleInteraction.choices.map(c => ({ id: c.id, label: c.label, description: c.description })),
          message: puzzleInteraction.description,
        };
        set((state) => ({
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: true,
            encounterType: 'puzzle',
          },
          combat: {
            ...state.combat,
            active: false,
            roomInteraction,
          },
        }));
        return;
      }
      case 'treasure': {
        encounterType = 'treasure';
        const treasureInteraction = generateTreasureInteraction(rng, currentWorldId);
        roomInteraction = {
          active: true,
          roomType: 'treasure',
          roomId: `floor_${nextFloor}_treasure`,
          message: treasureInteraction.description,
        };
        set((state) => ({
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: true,
            encounterType: 'treasure',
          },
          combat: {
            ...state.combat,
            active: false,
            roomInteraction,
          },
        }));
        return;
      }
      case 'elite': {
        encounterType = 'elite';
        const eliteInteraction = generateEliteInteraction(rng, currentWorldId);
        const eliteTemplate: CreatureTemplate = {
          key: 'elite_guardian',
          name: eliteInteraction.enemyName,
          class: 'rare',
          type: 'construct',
          elements: ['earth'],
          baseHealth: 50 + (eliteInteraction.enemyLevel * 8),
          baseAttack: 10 + (eliteInteraction.enemyLevel * 2),
          baseDefense: 8 + (eliteInteraction.enemyLevel * 1.5),
          baseSpeed: 5 + eliteInteraction.enemyLevel,
          baseMana: 20,
          baseExpValue: 30 + (eliteInteraction.enemyLevel * 2),
          skills: [{ key: 'earth_slash', name: 'Earth Slash', description: 'A powerful earth attack', power: 15, cost: 5 }],
          description: 'An elite guardian of the dungeon.',
          isBoss: false,
        };
        startCombat(eliteTemplate, eliteInteraction.enemyName, 'normal');
        set((state) => ({
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: true,
            encounterType: 'elite',
          },
        }));
        return;
      }
      case 'vendor': {
        encounterType = 'vendor';
        const vendorInteraction = generateVendorInteraction(rng, currentWorldId);
        roomInteraction = {
          active: true,
          roomType: 'vendor',
          roomId: `floor_${nextFloor}_vendor`,
          choices: vendorInteraction.items.map(i => ({ id: i.key, label: i.name, description: `${i.price} stones` })),
          message: vendorInteraction.description,
          vendorData: vendorInteraction,
        };
        set((state) => ({
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: true,
            encounterType: 'vendor',
          },
          combat: {
            ...state.combat,
            active: false,
            roomInteraction,
          },
        }));
        return;
      }
      case 'rest': {
        roomInteraction = {
          active: false,
          roomType: 'rest',
          roomId: `floor_${nextFloor}_rest`,
          message: 'A peaceful rest area. Your vitality is restored.',
        };
        set((state) => ({
          player: {
            ...state.player!,
            energy: { ...state.player!.energy, current: state.player!.energy.max },
            nerve: { ...state.player!.nerve, current: state.player!.nerve.max },
            life: { ...state.player!.life, current: state.player!.life.max },
          },
          dungeon: {
            ...state.dungeon,
            currentFloor: nextFloor,
            inEncounter: false,
            encounterType: undefined,
            clearedFloors: [...state.dungeon.clearedFloors, nextFloor],
          },
          combat: {
            ...state.combat,
            active: false,
            roomInteraction,
          },
        }));
        appendLog('You found a rest area. Your vitality is fully restored!', 'success');
        return;
      }
      default:
        break;
    }

    const enemyName = `Floor ${nextFloor} Warden`;
    const maxHp = 40 + nextFloor * 5 + currentWorldId * 3;
    const guardianTemplate: CreatureTemplate = {
      key: 'floor_guardian',
      name: enemyName,
      class: 'uncommon',
      type: 'beast',
      elements: ['earth'],
      baseHealth: maxHp,
      baseAttack: 8 + nextFloor,
      baseDefense: 5 + Math.floor(nextFloor / 2),
      baseSpeed: 5 + Math.floor(nextFloor / 3),
      baseMana: 15,
      baseExpValue: 20 + nextFloor * 2,
      skills: [{ key: 'slash', name: 'Slash', description: 'Basic attack', power: 10, cost: 0 }],
      description: 'A lesser guardian.',
      isBoss: false,
    };
    startCombat(guardianTemplate, enemyName, 'normal');
    set((state) => ({
      dungeon: {
        ...state.dungeon,
        currentFloor: nextFloor,
        inEncounter: true,
        encounterType: 'guardian',
      },
    }));
  },

resolveDungeonEncounter: (victory: boolean) => {
     const { dungeon, currentWorldId, worlds, appendLog } = get();
     if (!dungeon.active) return;

     if (victory) {
       const newCleared = [...dungeon.clearedFloors, dungeon.currentFloor];
       const isBoss = dungeon.currentFloor === dungeon.totalFloors;
       const isTreasure = dungeon.encounterType === 'treasure';

       const player = get().player;
       if (!player) return;

       const { player: scaledPlayer, creatures: scaledCreatures } = applyMinViableLevelScaling(player, currentWorldId, player.creatures);

       set((state) => {
         const updatedQuests = state.player!.activeQuests.map((q: QuestInstance) => {
           const template = QUEST_TEMPLATES[q.templateKey];
           if (!template || q.status !== 'active') return q;

           if (template.type === 'combat' && template.target === 'dungeon_floor') {
             return { ...q, progress: Math.min(q.targetProgress, newCleared.length) };
           }
           if (template.type === 'combat' && template.target === 'world_boss' && isBoss) {
             return { ...q, progress: Math.min(q.targetProgress, q.progress + 1) };
           }
           return q;
         });

         return {
           player: {
             ...scaledPlayer,
             creatures: scaledCreatures,
             activeQuests: updatedQuests,
           },
           playerCore: state.playerCore && isBoss ? {
             ...state.playerCore,
             statistics: [
               { type: 'BossDefeated', worldId: currentWorldId } as const,
               { type: 'DungeonCleared', worldId: currentWorldId, floorCount: dungeon.totalFloors } as const,
             ].reduce(
               (statistics, event) => applyPlayerStatisticEvent(statistics, event),
               state.playerCore.statistics
             ),
           } : state.playerCore,
           dungeon: {
             ...state.dungeon,
             clearedFloors: newCleared,
             bossDefeated: isBoss ? true : state.dungeon.bossDefeated,
             inEncounter: false,
             encounterType: undefined,
             encounterName: undefined,
           },
           combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
           combatTarget: null,
         };
       });

       if (isTreasure) {
         appendLog('The mimic dissolved into gold and items!', 'success');
         const goldFound = 50 + currentWorldId * 20;
         const p = get().player;
         if (p) {
           set((state) => ({
             player: {
               ...state.player!,
               money: state.player!.money + goldFound,
             },
             playerCore: state.playerCore ? {
               ...state.playerCore,
               statistics: applyPlayerStatisticEvent(state.playerCore.statistics, { type: 'GoldEarned', amount: goldFound }),
             } : state.playerCore,
           }));
           appendLog(`Found ${goldFound} gold!`, 'success');
         }
       } else if (isBoss) {
         const minLevel = calculateMinViableLevel(currentWorldId);
         if (player.level < minLevel && scaledPlayer.level >= minLevel) {
           appendLog(`Dungeon exit scaled you to minimum viable level ${minLevel} for this world tier.`, 'success');
         }
         appendLog(`World Boss defeated! You have conquered ${worlds.get(currentWorldId)?.name}!`, 'success');
       } else {
         appendLog(`Floor ${dungeon.currentFloor} cleared.`, 'success');
       }
     } else {
      set((state) => ({
        dungeon: { ...state.dungeon, inEncounter: false, encounterType: undefined, encounterName: undefined },
        combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
        combatTarget: null,
        screen: 'explore',
      }));
      appendLog('You retreated from the dungeon, defeated.', 'warning');
    }
  },

fleeDungeon: () => {
     const { appendLog, player, currentWorldId } = get();
     if (!player) return;
     if (Math.random() < 0.5) {
       const escapedWorldId = currentWorldId || 1;
       const { player: scaledPlayer, creatures: scaledCreatures } = applyMinViableLevelScaling(player, escapedWorldId, player.creatures);
       
       appendLog('You escaped the dungeon!', 'warning');
       appendLog(`Dungeon exit scaled you to minimum viable level ${calculateMinViableLevel(escapedWorldId)} for this world tier.`, 'info');
       
       set((state) => ({ 
         screen: 'explore', 
         player: { ...scaledPlayer, creatures: scaledCreatures },
         dungeon: { active: false, worldId: escapedWorldId, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined }, 
         combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 }, 
         combatTarget: null 
       }));
     } else {
       appendLog('Could not escape the dungeon!', 'warning');
       set((state: any) => ({ combat: { ...state.combat, phase: 'enemy_turn' } }));
     }
   },

  exploreTile: () => {
    const { player, worlds, currentWorldId, appendLog, exploring } = get();
    if (!player || exploring) return;

    const tileKey = getTileKey(player.tileX, player.tileY);
    const world = worlds.get(currentWorldId);
    const tile = world?.tiles.get(tileKey);

    if (!tile || tile.explored) {
      appendLog('This area is already fully mapped.', 'info');
      return;
    }

    const duration = 30000;
    const endTime = Date.now() + duration;

    set({ exploring: { tileKey, endTime, totalDuration: duration } });
    appendLog('You begin carefully mapping the surroundings...', 'info');

    setTimeout(() => {
      const state = get();
      if (state.exploring?.tileKey === tileKey) {
        const world = state.worlds.get(currentWorldId);
        const tile = world?.tiles.get(tileKey);
        if (tile) {
          tile.explored = true;
          tile.discovered = true;

          let discoveryMsg = 'Area mapping complete.';
          if (tile.specialType) discoveryMsg += ` You have discovered a ${tile.specialType.toUpperCase()}!`;
          if (tile.resourceType) discoveryMsg += ` Resource nodes located: ${tile.resourceType}.`;

          state.appendLog(discoveryMsg, 'success');
          set({ exploring: null });
        }
      }
    }, duration);
  },

  cancelExploration: () => set({ exploring: null }),

  createMapScroll: () => {
    const { player, worlds, currentWorldId, appendLog } = get();
    if (!player) return;
    const world = worlds.get(currentWorldId);
    if (!world) return;

    const landmarks: { x: number; y: number; type: string }[] = [];
    world.tiles.forEach(t => {
      if (t.explored && t.specialType) {
        landmarks.push({ x: t.x, y: t.y as number, type: t.specialType });
      }
    });

    if (landmarks.length === 0) {
      appendLog('You have not explored any significant landmarks to map out.', 'warning');
      return;
    }

    const mapData = btoa(JSON.stringify({ floor: currentWorldId, landmarks }));
    const scrollItem = { templateKey: 'atlas_scroll', quantity: 1, modifiers: { data: mapData } };

    set(state => ({
      player: {
        ...state.player!,
        inventory: [...state.player!.inventory, scrollItem]
      }
    }));
    appendLog('You have transcribed your discoveries onto an Atlas Scroll.', 'success');
  },

  useMapScroll: (encodedData: string) => {
    const { worlds, currentWorldId, appendLog } = get();
    try {
      const data = JSON.parse(atob(encodedData));
      if (data.floor !== currentWorldId) {
        appendLog('This map is for a different floor.', 'warning');
        return;
      }

      const world = worlds.get(currentWorldId);
      if (!world) return;

      data.landmarks.forEach((l: { x: number; y: number; type: string }) => {
        const key = getTileKey(l.x, l.y);
        if (!world.tiles.has(key)) {
          world.tiles.set(key, generateTile(l.x, l.y, currentWorldId));
        }
        const tile = world.tiles.get(key)!;
        tile.discovered = true;
        tile.explored = true;
      });

      appendLog(`Map data imported. ${data.landmarks.length} landmarks added to your Atlas.`, 'success');
    } catch (e) {
      appendLog('Failed to read map data.', 'error');
    }
  },

  startActivity: (type: 'creature_training' | 'physical_training' | 'rest' | 'search_tracks' | 'search_animals', duration: number, message: string, creatureId?: string) => {
    const { player, appendLog, activity } = get();
    if (!player) return;
    if (activity) {
      appendLog('You are already engaged in an activity.', 'warning');
      return;
    }

    const endTime = Date.now() + duration;
    set({ activity: { type, duration, endTime, message, creatureId } });
    appendLog(message, 'info');

    setTimeout(() => {
      get().finishActivity();
    }, duration);
  },

  cancelActivity: () => {
    const { appendLog, activity } = get();
    if (activity) {
      appendLog(`Activity ${activity.type.replace(/_/g, ' ')} cancelled.`, 'warning');
      set({ activity: null });
    }
  },

  finishActivity: () => {
    const { player, activity, appendLog } = get();
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
        player.defense += statGain;
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

    const updatedPlayer = addPlayerXP(player, xpGain, appendLog);

    set({ player: updatedPlayer, activity: null });
    appendLog(message, 'success');
  },

  addMission: (mission: ActiveMission) => {
    set((state) => ({
      missions: [...state.missions, { ...mission, status: 'IN_PROGRESS' as MissionStatus }]
    }));
  },

  addMissionWithModifiers: (params: {
    type: MissionType;
    assigned_creatures: string[];
    world_layer: number;
    duration_seconds: number;
    extraModifiers?: MissionModifiers;
  }) => {
    const { player } = get();
    if (!player) return;

    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerModifiers = getCareerModifiers(aggregatedStats);
    
    const creatureInstances = player.creatures.filter(c => 
      params.assigned_creatures.includes(c.id)
    );
    const creatureAgilityMod = getCreatureAgilityMod(creatureInstances);

const modifiers: MissionModifiers = {
       ...careerModifiers,
       creature_agility_mod: creatureAgilityMod,
       ...params.extraModifiers,
     };

     const mission = createActiveMission({
       type: params.type,
       assigned_creatures: params.assigned_creatures,
       world_layer: params.world_layer,
       duration_seconds: params.duration_seconds,
       modifiers,
     });

     const inProgressMission = { ...mission, status: 'IN_PROGRESS' as MissionStatus };

    set((state) => ({
      missions: [...state.missions, inProgressMission]
    }));
    return inProgressMission;
  },

  completeMission: (missionId: string) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.mission_id === missionId ? { ...m, status: 'COMPLETED' as MissionStatus } : m
      )
    }));
  },

  failMission: (missionId: string) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.mission_id === missionId ? { ...m, status: 'FAILED' as MissionStatus } : m
      )
    }));
  },

  removeMission: (missionId: string) => {
    set((state) => ({
      missions: state.missions.filter((m) => m.mission_id !== missionId),
    }));
  },

  processOfflineCatchUp: (logoutTimestamp: number): number => {
    const now = Date.now();
    const missions = get().missions;

    if (missions.length === 0) return 0;

    const updatedMissions = missions.map((m) =>
      m.status === 'PENDING' ? { ...m, status: 'IN_PROGRESS' as MissionStatus } : m
    );
    set({ missions: updatedMissions });

    const getBaseXP = (mission: ActiveMission): number => {
      const worldScale = 1 + (mission.world_layer - 1) * 0.05;
      const baseByType: Record<string, number> = {
        EXPLORE_TIER_1: 15,
        SCOUT_DUNGEON: 30,
        SMELT_ORE: 20,
        CRAFT_ITEM: 30,
        STORE_VISIT: 15,
        TAX_EDICT: 40,
        CARAVAN_ROUTE: 35,
        SEARCH_AREA: 15,
        GATHER_RESOURCE: 20,
        CAPTURE_CREATURE: 25,
        WILD_ENCOUNTER: 20,
      };
      return Math.floor((baseByType[mission.type] || 10) * worldScale);
    };

    const heartbeat = createHeartbeat({
       getCurrentTime: () => now,
       getMissions: () => get().missions,
       removeMission: (id) => get().removeMission(id),
       getMissionById: (id) => get().missions.find((m) => m.mission_id === id),
       getLastWorldTickTime: () => get().lastWorldTickTime,
       setLastWorldTickTime: () => {},
       getTurnCount: () => get().turnCount,
       setTurnCount: () => {},
       getGameTimeMinutes: () => get().player?.gameTimeMinutes ?? 360,
       setGameTimeMinutes: () => {},
       getDayCount: () => get().player?.dayCount ?? 1,
       setDayCount: () => {},
       onWorldTick: () => {},
       onMissionsProgress: () => {},
       resolveMissionCallbacks: {
         EXPLORE_TIER_1: (mission) => {
           const state = get();
           if (state.exploring) {
             state.finishMovement(state.exploring.targetX!, state.exploring.targetY!, state.exploring.tileKey, true);
           }
           get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         SCOUT_DUNGEON: (mission) => {
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         SMELT_ORE: (mission) => {
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         CRAFT_ITEM: (mission) => {
           recordPlayerCoreStatistic(set, { type: 'ItemCrafted' });
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         STORE_VISIT: (mission) => {
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         TAX_EDICT: (mission) => {
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         CARAVAN_ROUTE: (mission) => {
           get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
         SEARCH_AREA: (mission) => {
           const state = get();
           if (state.searching) {
             state.finishSearch(state.searching.resourceType!);
           }
           get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
         },
          GATHER_RESOURCE: (mission) => {
            const state = get();
            const resourceType = mission.modifiers?.resource_type as string | undefined;
            if (state.searching && resourceType) {
              state.finishSearch(resourceType);
            }
            get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
            CAPTURE_CREATURE: (mission) => {
              const state = get();
              if (state.capturing) {
                state.finishCapture();
              }
              get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
            },
            WILD_ENCOUNTER: (mission) => {
              const state = get();
              const encounterData = mission.modifiers?.encounter_data as string | undefined;
              if (encounterData) {
                try {
                  const enemyTemplate = JSON.parse(encounterData);
                  const partyCreatures = state.player?.creatures.filter((c: any) => c.currentHealth > 0) || [];
                  if (partyCreatures.length > 0) {
                    const outcome = resolveAutomatedCombat(partyCreatures, [enemyTemplate], {
                      worldLayer: mission.world_layer,
                    });
                    if (outcome.result.victory) {
                      get().grantMissionXP(partyCreatures.map((c: any) => c.id), getBaseXP(mission));
                    }
                    if (outcome.result.battle_log.length > 0) {
                      state.appendLog(`[Wild Encounter] ${outcome.result.battle_log[outcome.result.battle_log.length - 1]}`, 'combat');
                    }
                  }
                } catch (e) {
                  get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
                }
              } else {
                get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
              }
            },
            DEMONLORD_ENCOUNTER: (mission) => {
              const state = get();
              if (state.demonlordState?.activeChallenge) {
                state.appendLog('A Demonlord encounter mission requires direct combat resolution.', 'info');
              }
              get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
            },
          },
      });

    const beforeCount = get().missions.length;
    heartbeat.tick();
    const afterCount = get().missions.length;
    const resolvedCount = beforeCount - afterCount;

    if (resolvedCount > 0) {
      const { appendLog, turnCount } = get();
      const offlineDuration = Math.floor((now - logoutTimestamp) / 1000);
      const minutes = Math.floor(offlineDuration / 60);
      const seconds = offlineDuration % 60;
      const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      appendLog(`Offline catch-up: ${resolvedCount} mission(s) resolved after ${durationStr} offline.`, 'system');
    }

    return resolvedCount;
  },

   startHeartbeat: () => {
     const { heartbeat } = get();
     if (heartbeat) return;

      const getBaseXP = (mission: ActiveMission): number => {
        const worldScale = 1 + (mission.world_layer - 1) * 0.05;
        const baseByType: Record<string, number> = {
          EXPLORE_TIER_1: 15,
          SCOUT_DUNGEON: 30,
          SMELT_ORE: 20,
          CRAFT_ITEM: 30,
          STORE_VISIT: 15,
          TAX_EDICT: 40,
          CARAVAN_ROUTE: 35,
          SEARCH_AREA: 15,
          GATHER_RESOURCE: 20,
          CAPTURE_CREATURE: 25,
          WILD_ENCOUNTER: 20,
        };
        return Math.floor((baseByType[mission.type] || 10) * worldScale);
      };

     const applyWorldTickCareerBonuses = (): void => {
       const state = get();
       if (!state.player) return;
       const treeData = getAllNodes();
       const aggregatedStats = getAggregateStats(state.player, treeData);
        const bonuses = getCareerSystemBonuses(aggregatedStats);

        const energyRegenBoost = 1 + ((bonuses.energy_regen_pct || 0) / 100);
       const nerveRegenBoost = 1 + ((bonuses.nerve_regen_pct || 0) / 100);
       const happyRegenBoost = 1 + ((bonuses.happy_regen_pct || 0) / 100);
       const lifeRegenBoost = 1 + ((bonuses.life_regen_pct || 0) / 100);

       if (energyRegenBoost > 1 || nerveRegenBoost > 1 || happyRegenBoost > 1 || lifeRegenBoost > 1) {
         set((s) => {
           const p = s.player;
           if (!p) return {};
           return {
             player: {
               ...p,
               energy: {
                 ...p.energy,
                 current: Math.min(p.energy.max, Math.floor(p.energy.current * Math.max(1, energyRegenBoost * 0.01))),
               },
               nerve: {
                 ...p.nerve,
                 current: Math.min(p.nerve.max, Math.floor(p.nerve.current * Math.max(1, nerveRegenBoost * 0.01))),
               },
               happy: {
                 ...p.happy,
                 current: Math.min(p.happy.max, Math.floor(p.happy.current * Math.max(1, happyRegenBoost * 0.01))),
               },
               life: {
                 ...p.life,
                 current: Math.min(p.life.max, Math.floor(p.life.current * Math.max(1, lifeRegenBoost * 0.01))),
               },
             },
           };
         });
       }
     };

 const instance = createHeartbeat({
        getCurrentTime: Date.now,
        getMissions: () => get().missions,
        removeMission: (id) => get().removeMission(id),
        getMissionById: (id) => get().missions.find((m) => m.mission_id === id),
        getLastWorldTickTime: () => get().lastWorldTickTime,
        setLastWorldTickTime: (time) => set({ lastWorldTickTime: time }),
        getTurnCount: () => get().turnCount,
        setTurnCount: (count) => set({ turnCount: count }),
        getGameTimeMinutes: () => get().player?.gameTimeMinutes ?? 360,
        setGameTimeMinutes: (minutes) => set((state) => ({
          player: state.player ? { ...state.player, gameTimeMinutes: minutes } : state.player,
        })),
        getDayCount: () => get().player?.dayCount ?? 1,
        setDayCount: (count) => set((state) => ({
          player: state.player ? { ...state.player, dayCount: count } : state.player,
        })),
         onWorldTick: () => {
           applyWorldTickCareerBonuses();
         },
         onMissionsProgress: () => {},
       resolveMissionCallbacks: {
          EXPLORE_TIER_1: (mission) => {
            const state = get();
            if (state.exploring) {
              state.finishMovement(state.exploring.targetX!, state.exploring.targetY!, state.exploring.tileKey, true);
            }
            get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          SCOUT_DUNGEON: (mission) => {
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          SMELT_ORE: (mission) => {
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          CRAFT_ITEM: (mission) => {
            recordPlayerCoreStatistic(set, { type: 'ItemCrafted' });
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          STORE_VISIT: (mission) => {
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          TAX_EDICT: (mission) => {
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          CARAVAN_ROUTE: (mission) => {
            get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
          SEARCH_AREA: (mission) => {
            const state = get();
            if (state.searching) {
              state.finishSearch(state.searching.resourceType!);
            }
            get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
          },
           GATHER_RESOURCE: (mission) => {
             const state = get();
             const resourceType = mission.modifiers?.resource_type as string | undefined;
             if (state.searching && resourceType) {
               state.finishSearch(resourceType);
             }
             get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
           },
            CAPTURE_CREATURE: (mission) => {
              const state = get();
              if (state.capturing) {
                state.finishCapture();
              }
              get().grantMissionXP(state.player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
            },
            WILD_ENCOUNTER: (mission) => {
              const state = get();
              const encounterData = mission.modifiers?.encounter_data as string | undefined;
              if (encounterData) {
                try {
                  const enemyTemplate = JSON.parse(encounterData);
                  const partyCreatures = state.player?.creatures.filter((c: any) => c.currentHealth > 0) || [];
                  if (partyCreatures.length > 0) {
                    const outcome = resolveAutomatedCombat(partyCreatures, [enemyTemplate], {
                      worldLayer: mission.world_layer,
                    });
                    if (outcome.result.victory) {
                      get().grantMissionXP(partyCreatures.map((c: any) => c.id), getBaseXP(mission));
                    }
                    if (outcome.result.battle_log.length > 0) {
                      state.appendLog(`[Wild Encounter] ${outcome.result.battle_log[outcome.result.battle_log.length - 1]}`, 'combat');
                    }
                  }
                } catch (e) {
                  get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
                }
              } else {
                get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], getBaseXP(mission));
              }
            },
            DEMONLORD_ENCOUNTER: (_mission) => {
              get().grantMissionXP(get().player?.creatures.map((c) => c.id) || [], 0);
            },
          },
       });

    instance.start();
    set({ heartbeat: instance });
  },

  stopHeartbeat: () => {
    const { heartbeat } = get();
    if (heartbeat) {
      heartbeat.stop();
    }
    set({ heartbeat: null });
  },

  grantMissionXP: (creatureIds: string[], baseXP: number) => {
    const { player } = get();
    if (!player || creatureIds.length === 0) return { leveledUpIds: [] };

    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);
    const boostedXP = applyXPBoost(baseXP, careerBonuses);

    const { updatedCreatures, leveledUpIds, mutatedIds, mutationsById } = grantPartyXP(player.creatures, creatureIds, boostedXP);
    set((state) => ({
      player: state.player ? { ...state.player, creatures: updatedCreatures } : state.player,
    }));

    if (leveledUpIds.length > 0) {
      const notifications: Array<{ creatureName: string; newLevel: number }> = [];
      for (const id of leveledUpIds) {
        const creature = updatedCreatures.find((c) => c.id === id);
        if (creature) {
          const name = creature.nickname || creature.templateKey || 'Unknown';
          get().appendLog(`⚡ ${name} reached Level ${creature.level}!`, 'success');
          notifications.push({ creatureName: name, newLevel: creature.level });
        }
      }
      if (notifications.length > 0) {
        get().showLevelUpNotification(notifications);
      }
    }

    if (mutatedIds.length > 0) {
      for (const id of mutatedIds) {
        const creature = updatedCreatures.find((c) => c.id === id);
        if (creature) {
          const name = creature.nickname || creature.templateKey || 'Unknown';
          const newMutations = mutationsById[id] || [];
          const labels = newMutations.map(k => k.replace(/_/g, ' ')).join(', ');
          get().appendLog(`🧬 ${name} mutated: ${labels}!`, 'warning');
        }
      }
    }

    return { leveledUpIds };
  },
});
