import type { GameStore, GameStoreState, PlayerState, WorldData, LogEntry, QuestInstance, Element, CreatureInstance, SetState } from '../types.ts';
import { createLog, calculateMovementModifiers, processTileDiscovery, getPlayerElements, addPlayerXP, getWorldModifier } from '../helpers.ts';
import { generateTile } from '../../../core/worldGenerator.ts';
import { getTileKey, getAffinityWeight, calculateBaseCaptureProbability } from '../../../data/constants.ts';
import { QUEST_TEMPLATES } from '../../../data/quests.ts';
import { generateCreatureTemplate } from '../../../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../../../utils/SeededRandom.ts';
import type { MissionStatus, MissionModifiers, ActiveMission } from '../../../core/missionQueue.ts';
import { createActiveMission, getCreatureAgilityMod, MissionType } from '../../../core/missionQueue.ts';
import type { HeartbeatInstance } from '../../../core/heartbeat.ts';
import { grantPartyXP, applyCreatureXP } from '../../../core/xpCurve.ts';
import { applyAffectionGain } from '../../../core/affection.ts';
import type { GameEngineState } from '../../../core/gameEngine.ts';
import { createHeartbeat } from '../../../core/heartbeat.ts';
import { getAggregateStats, getAllNodes, getCareerModifiers } from '../../../data/careerTree/index';
import { getFusionResult } from '../../../data/fusionMatrix.ts';
import axios from 'axios';

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
    if (Math.random() < encounterChance) {
      const encounterRng = new SeededRandom(tile.encounterSeed || Date.now());
      const effectiveTier = currentWorldId + Math.floor(proximityFactor * 10);
      const enemy = generateCreatureTemplate(effectiveTier, encounterRng);

      setTimeout(() => {
        get().startCombat(enemy, `Wild ${enemy.name}`);
      }, 500);
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

    const found = Math.min(tile?.resourceQty ?? 0, 1 + Math.floor(Math.random() * 2));
    if (found > 0 && tile) {
      const existing = (player.inventory || []).find((i) => i.templateKey === resourceKey);
      if (existing) {
        existing.quantity += found;
      } else {
        player.inventory.push({ templateKey: resourceKey, quantity: found });
      }
      tile.resourceQty = Math.max(0, (tile.resourceQty ?? 0) - found);
      get().appendLog(`You found ${found} ${resourceKey}!`, 'success');
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
    const { player, capturing, appendLog } = get();
    if (!player || !capturing) return;

    const creature = capturing.creature;
    const playerElements = getPlayerElements(player);
    const hasNebulaShroud = player.skillsUnlocked?.['nebula_shroud'] === true;

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

    const hasWildWhisper = player.skillsUnlocked?.['wild_whisper'] === true;
    const hasBeastmaster = player.skillsUnlocked?.['beastmaster'] === true;
    const hasSummonerMinor = player.unlocked_node_ids?.includes('summoner_minor_1');
    const hasSummonerNotable = player.unlocked_node_ids?.includes('summoner_notable_1');

    const careerBonus = (player.skillPoints * 0.01) + (hasWildWhisper ? 0.15 : 0) + (hasBeastmaster ? 0.3 : 0) + (hasSummonerMinor ? 0.01 : 0) + (hasSummonerNotable ? 0.02 : 0);
    pCapture = Math.min(0.95, pCapture + careerBonus);

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
      appendLog(`✨ Success! You captured a new creature: ${creature.name} (${creature.class.toUpperCase()})!`, 'success');
    } else {
      if (player.creatures.length > 0) {
        appendLog(`💨 Failed to capture ${creature.name}. The creature's soul broke free of your binding spell! (Capture Chance: ${Math.round(pCapture * 100)}%)`, 'warning');
        setTimeout(() => {
          get().startCombat(creature, `Wild ${creature.name}`, 'aggressive');
        }, 500);
      } else {
        appendLog(`💨 Failed to capture ${creature.name}. The creature escapes but now views your territory as hostile! (Capture Chance: ${Math.round(pCapture * 100)}%)`, 'warning');
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

    const essenceIdx = player.inventory.findIndex(i => i.templateKey === 'essence');
    const essenceStack = player.inventory[essenceIdx];
    if (!essenceStack || essenceStack.quantity < 5) {
      appendLog('Soul Fusion requires 5 Essence.', 'warning');
      return;
    }

    const c1 = player.creatures.find(c => c.id === id1);
    const c2 = player.creatures.find(c => c.id === id2);

    if (!c1 || !c2 || player.creatures.length >= 6) {
      appendLog('Invalid selection or party full.', 'error');
      return;
    }

    const rng = new SeededRandom(Date.now());
    const isAncient = rng.next() < 0.05;
    const isVoid = rng.next() < 0.03;
    const isStellar = rng.next() < 0.02;

    const bonus = 1.15 + (rng.next() * 0.15) + (isAncient ? 0.25 : 0);
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

    const parentSkills = new Set([...(c1.skills || []), ...(c2.skills || [])]);
    const inheritedSkills = Array.from(parentSkills).slice(0, 3);
    const finalSkills = [...inheritedSkills, ...selectedSkills.slice(0, 4 - inheritedSkills.length)];

    const parentTraits = new Set([...(c1.traits || []), ...(c2.traits || [])]);
    const inheritedTraits = Array.from(parentTraits).slice(0, 2);

    const baseClass = (c1.class || 'common') === (c2.class || 'common')
      ? c1.class
      : ['common','uncommon','rare','epic','legendary','mythical'].includes(c1.class || 'common')
        ? c1.class
        : c2.class || 'common';

    let newClass = baseClass;
    if (isAncient) newClass = 'epic';
    if (isVoid || isStellar) newClass = newClass === 'common' ? 'rare' : newClass === 'uncommon' ? 'rare' : newClass === 'rare' ? 'epic' : newClass;
    if (specialFusionOccurred && fusionResultElement === 'aether') {
      newClass = newClass === 'common' ? 'epic' : newClass === 'uncommon' ? 'epic' : newClass === 'rare' ? 'legendary' : newClass;
    }

    const newCreature: any = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      templateKey: `fused_${c1.templateKey}_${c2.templateKey}`,
      nickname: specialFusionOccurred && fusionResultElement === 'aether'
        ? `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Aether Manifestation`
        : specialFusionOccurred && fusionResultElement === 'unstable_void'
          ? `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Unstable Void`
          : `${c1.nickname || 'Soul'}-${c2.nickname || 'Soul'} Hybrid`,
      level: 1,
      experience: 0,
      currentHealth: newMaxHP,
      maxHealth: newMaxHP,
      currentMana: newMaxMana,
      maxMana: newMaxMana,
      attack: newAttack,
      defense: newDefense,
      speed: newSpeed,
      skills: finalSkills,
      traits: inheritedTraits,
      mutations: mutations,
      affection: 5,
      class: newClass,
      elements: newElements,
      type: specialFusionOccurred && fusionResultElement === 'unstable_void' ? 'demon' : c1.type || 'spirit'
    };

    const updatedInventory = [...player.inventory];
    const essenceStackItem = updatedInventory[essenceIdx];
    if (essenceStackItem) {
      essenceStackItem.quantity -= 5;
      if (essenceStackItem.quantity <= 0) updatedInventory.splice(essenceIdx, 1);
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
    set({ screen: 'dungeon' });
  },

  descendDungeon: () => {
    const { player, currentWorldId, worlds, dungeon, appendLog } = get();
    if (!player) return;
    const world = worlds.get(currentWorldId);
    if (!world) return;

    if (dungeon.currentFloor >= dungeon.totalFloors) {
      appendLog('You have reached the boss floor!', 'system');
      return;
    }

    const nextFloor = dungeon.currentFloor + 1;
    const isBoss = nextFloor === dungeon.totalFloors;
    const isTrap = !isBoss && Math.random() < 0.15;
    const isTreasure = !isBoss && !isTrap && Math.random() < 0.1;

    let enemyName: string;
    let maxHp: number;
    let encounterType: 'guardian' | 'trap' | 'treasure' | 'boss' = 'guardian';

    if (isTrap) {
      encounterType = 'trap';
      const trapTypes = ['Spike Pit', 'Poison Gas', 'Crushing Walls', 'Lightning Rune', 'Fire Vent'];
      const trapIdx = Math.floor(Math.random() * trapTypes.length);
      enemyName = trapTypes[trapIdx] || 'Unknown Trap';
      maxHp = 20 + nextFloor * 3 + currentWorldId * 2;
    } else if (isTreasure) {
      encounterType = 'treasure';
      enemyName = 'Treasure Mimic';
      maxHp = 30 + nextFloor * 4 + currentWorldId * 3;
    } else if (isBoss) {
      encounterType = 'boss';
      enemyName = `${world.name} World Boss`;
      maxHp = 120 + currentWorldId * 15;
    } else {
      encounterType = 'guardian';
      enemyName = `Floor ${nextFloor} Warden`;
      maxHp = 40 + nextFloor * 5 + currentWorldId * 3;
    }

    set((state) => ({
      dungeon: {
        ...state.dungeon,
        currentFloor: nextFloor,
        inEncounter: true,
        encounterType,
        encounterName: enemyName,
      },
      combat: {
        active: true,
        phase: 'player_turn',
        log: [`You advance to Floor ${nextFloor}. ${isTrap ? 'A hidden trap triggers!' : isTreasure ? 'A treasure mimic appears!' : isBoss ? 'The World Boss awaits!' : 'A new guardian appears!'}`],
        enemyName,
        enemyHp: maxHp,
        enemyMaxHp: maxHp,
        enemyTemplate: null,
        playerCreatureId: player.creatures[0]?.id || '',
        turns: 0,
      },
      combatTarget: player.creatures[0]?.id || null,
      screen: 'combat',
    }));
  },

  resolveDungeonEncounter: (victory: boolean) => {
    const { dungeon, currentWorldId, worlds, appendLog } = get();
    if (!dungeon.active) return;

    if (victory) {
      const newCleared = [...dungeon.clearedFloors, dungeon.currentFloor];
      const isBoss = dungeon.currentFloor === dungeon.totalFloors;
      const isTreasure = dungeon.encounterType === 'treasure';

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
            ...state.player!,
            activeQuests: updatedQuests,
          },
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
            }
          }));
          appendLog(`Found ${goldFound} gold!`, 'success');
        }
      } else if (isBoss) {
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
    const { appendLog } = get();
    if (Math.random() < 0.5) {
      appendLog('You escaped the dungeon!', 'warning');
      set({ screen: 'explore', dungeon: { active: false, worldId: 1, currentFloor: 0, totalFloors: 3, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined }, combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 }, combatTarget: null });
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
      };
      return Math.floor((baseByType[mission.type] || 10) * worldScale);
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

    const { updatedCreatures, leveledUpIds, mutatedIds, mutationsById } = grantPartyXP(player.creatures, creatureIds, baseXP);
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
