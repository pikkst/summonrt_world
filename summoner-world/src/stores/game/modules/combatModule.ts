import type { GameStore, GameStoreState, CombatState, CreatureTemplate, CreatureInstance, DungeonState, LogEntry, PlayerState, QuestInstance, Element, SetState } from '../types.ts';
import { createLog, addPlayerXP, getWorldModifier, getPlayerElements } from '../helpers.ts';
import { generateCreatureTemplate } from '../../../modules/creatures/creatureFactory.ts';
import { SKILL_TEMPLATES } from '../../../modules/creatures/creatureFactory.ts';
import { applyCreatureXP, calculateEncounterXP } from '../../../core/xpCurve.ts';
import { applyAffectionGain, getAffectionDamageMultiplier } from '../../../core/affection.ts';
import { SeededRandom } from '../../../utils/SeededRandom.ts';
import { getAggregateStats, getAllNodes } from '../../../data/careerTree/index';
import { applyCombatCareerBonuses, applyDamageTakenReduction, getCareerSystemBonuses } from '../../../data/careerTreeIntegration';
import { createDemonlordState, getDemonlordForFloor } from '../../../core/demonlord';

const getPrimordialDamageMultiplier = (player: PlayerState): number => {
  return player.affinity.traits?.includes('primordial') ? 1.2 : 1;
};

const getOmniDamageMultiplier = (player: PlayerState): number => {
  const elements = getPlayerElements(player);
  return elements.includes('omni') ? 1.3 : 1;
};

const getElementDamageMultiplier = (player: PlayerState): number => {
  const primordialMult = getPrimordialDamageMultiplier(player);
  const omniMult = getOmniDamageMultiplier(player);
  return primordialMult * omniMult;
};

const ELEMENTAL_ADVANTAGES: Record<string, string[]> = {
  fire: ['nature', 'ice', 'iron'],
  water: ['fire', 'earth'],
  earth: ['lightning', 'iron'],
  air: ['earth', 'nature'],
  lightning: ['water', 'air'],
  nature: ['water', 'earth'],
  ice: ['nature', 'air'],
  iron: ['ice', 'earth'],
  light: ['darkness', 'void'],
  darkness: ['light', 'starlight'],
  void: ['chaos', 'starlight'],
  starlight: ['chaos', 'darkness'],
  chaos: ['light', 'void', 'starlight'],
};

const ELEMENTAL_DISADVANTAGES: Record<string, string[]> = {
  fire: ['water', 'fire'],
  water: ['water', 'nature'],
  earth: ['air', 'nature'],
  air: ['iron'],
  lightning: ['earth', 'lightning'],
  nature: ['fire', 'nature'],
  ice: ['fire', 'water'],
  iron: ['lightning', 'iron'],
  light: ['light'],
  darkness: ['darkness'],
};

const getElementalEffectiveness = (atkElement: string | undefined, defElements: string[] | Element[] | undefined): { factor: number; msg: string } => {
  if (!atkElement || !defElements || defElements.length === 0) {
    return { factor: 1, msg: '' };
  }
  let factor = 1;
  let advantages = 0;
  let disadvantages = 0;
  for (const defElem of defElements) {
    if (ELEMENTAL_ADVANTAGES[atkElement]?.includes(defElem)) {
      factor *= 1.5;
      advantages++;
    } else if (ELEMENTAL_DISADVANTAGES[atkElement]?.includes(defElem)) {
      factor *= 0.5;
      disadvantages++;
    }
  }
  if (advantages > disadvantages) {
    return { factor, msg: " (Super effective! ⚔️)" };
  } else if (disadvantages > advantages) {
    return { factor, msg: " (Not very effective... 🛡️)" };
  }
  return { factor, msg: '' };
};

export const combatActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  startCombat: (enemyTemplate: CreatureTemplate | null, enemyName: string, encounterType: 'normal' | 'aggressive' | 'territorial' = 'normal') => {
    const { player } = get();
    if (!player) return;
    const creature = player.creatures.find((c: any) => c.currentHealth > 0) || player.creatures[0];
    let maxHp = enemyTemplate?.baseHealth || 50;
    let baseAtk = enemyTemplate?.baseAttack || 8;
    let baseDef = enemyTemplate?.baseDefense || 5;
    const isAggressive = encounterType === 'aggressive' || encounterType === 'territorial';
    if (isAggressive) {
      maxHp = Math.floor(maxHp * 1.2);
      baseAtk = Math.floor(baseAtk * 1.15);
      baseDef = Math.floor(baseDef * 1.1);
    }
    let logMessage: string;
    if (encounterType === 'territorial') {
      logMessage = `A territorial ${enemyName} blocks your path! It remembers your failed attempt and attacks with fury!`;
    } else if (encounterType === 'aggressive') {
      logMessage = `A wild ${enemyName} appears! It looks enraged and ready to fight!`;
    } else {
      logMessage = `A wild ${enemyName} appears! It looks ready to fight.`;
    }
    set({
      screen: 'combat',
      combat: {
        active: true,
        phase: 'player_turn',
        log: [logMessage],
        enemyName,
        enemyHp: maxHp,
        enemyMaxHp: maxHp,
        enemyTemplate: enemyTemplate ? { ...enemyTemplate, baseHealth: maxHp, baseAttack: baseAtk, baseDefense: baseDef } : null,
        playerCreatureId: creature?.id || '',
        turns: 0,
        encounterType,
      },
      combatTarget: creature?.id || null,
    });
  },

  switchCreatureInCombat: (creatureId: string) => {
    const { player, combat } = get();
    if (!player || !combat.active) return;

    const creature = player.creatures.find((c: any) => c.id === creatureId);
    if (!creature) return;

    if (creature.currentHealth <= 0) {
      set((s: any) => ({
        log: [...s.log.slice(-499), createLog(`${creature.nickname || 'Creature'} is fainted and cannot fight!`, 'warning', s.turnCount)],
      }));
      return;
    }

    const activeCr = player.creatures.find((c: any) => c.id === combat.playerCreatureId);
    const isCurrentFainted = !activeCr || activeCr.currentHealth <= 0;

    const updatedLog = [
      ...combat.log,
      `You recalled your active summon and sent out ${creature.nickname || 'Creature'}!`
    ];

    const nextPhase = isCurrentFainted ? 'player_turn' : 'enemy_turn';

    set((s: any) => ({
      combat: {
        ...s.combat,
        playerCreatureId: creatureId,
        log: updatedLog,
        phase: nextPhase,
      },
      combatTarget: creatureId,
    }));

    if (nextPhase === 'enemy_turn') {
      const enemyTemplate = combat.enemyTemplate || generateCreatureTemplate(player.currentWorldId, new SeededRandom(Date.now()));
      get().triggerEnemyTurn(enemyTemplate, updatedLog, combat.enemyHp || 0);
    }
  },

  attackWithCreature: (creatureId: string) => {
    const state = get();
    const { player, combat } = state;
    if (!player || !combat.active || combat.phase !== 'player_turn') return;

    const creature = player.creatures.find((c: any) => c.id === creatureId);
    if (!creature) return;

    const enemyTemplate = combat.enemyTemplate || generateCreatureTemplate(player.currentWorldId, new SeededRandom(Date.now()));
    const creatureElement = creature.elements?.[0];
    const enemyElements = enemyTemplate.elements || [];

    const eff = getElementalEffectiveness(creatureElement, enemyElements);
    const affectionMult = getAffectionDamageMultiplier(creature);
    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);

    let damageRaw = (creature.attack || 10) - (enemyTemplate.baseDefense || 5) * 0.5;
    const damageMult = creatureElement ? getElementDamageMultiplier(player) : 1;
    let playerDamage = Math.max(1, Math.floor(damageRaw * eff.factor * damageMult * affectionMult + (Math.floor(Math.random() * 5) - 2)));
    playerDamage = applyCombatCareerBonuses(playerDamage, careerBonuses);

    const newEnemyHp = Math.max(0, (combat.enemyHp || 50) - playerDamage);

    let combatLog = [...combat.log, `${creature.nickname || 'Your creature'} attacks for ${playerDamage} damage!${eff.msg}`];

    if (newEnemyHp <= 0) {
      get().handleVictory(creatureId, enemyTemplate, combatLog, newEnemyHp);
      return;
    }

    set((s: any) => ({
      combat: { ...s.combat, log: combatLog, enemyHp: newEnemyHp, phase: 'enemy_turn', turns: s.combat.turns + 1 },
    }));

    get().triggerEnemyTurn(enemyTemplate, combatLog, newEnemyHp);
  },

  useSkill: (skillKey: string) => {
    const state = get();
    const { player, combat } = state;
    if (!player || !combat.active || combat.phase !== 'player_turn') return;

    const creature = player.creatures.find((c: any) => c.id === combat.playerCreatureId);
    if (!creature) return;

    const skill = SKILL_TEMPLATES.find(s => s.key === skillKey) || { key: 'scratch', name: 'Scratch', power: 10, cost: 0, element: undefined };

    if (creature.currentMana < skill.cost) {
      set((s: any) => ({
        combat: { ...s.combat, log: [...s.combat.log.slice(-499), `Not enough energy/mana to use ${skill.name}!`] }
      }));
      return;
    }

    const enemyTemplate = combat.enemyTemplate || generateCreatureTemplate(player.currentWorldId, new SeededRandom(Date.now()));
    const enemyElements = enemyTemplate.elements || [];

    const eff = getElementalEffectiveness(skill.element, enemyElements);
    const affectionMult = getAffectionDamageMultiplier(creature);
    const baseAtk = creature.attack || 10;
    const skillMult = skill.power / 10;
    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);

    let damageRaw = (baseAtk * skillMult) - (enemyTemplate.baseDefense || 5) * 0.5;
    const damageMult = skill.element ? getElementDamageMultiplier(player) : 1;
    let skillDamage = Math.max(1, Math.floor(damageRaw * eff.factor * damageMult * affectionMult + (Math.floor(Math.random() * 5) - 2)));
    skillDamage = applyCombatCareerBonuses(skillDamage, careerBonuses);

    const newEnemyHp = Math.max(0, (combat.enemyHp || 50) - skillDamage);
    const newMana = Math.max(0, creature.currentMana - skill.cost);

    const updatedPlayerCreatures = player.creatures.map((c: any) =>
      c.id === creature.id ? { ...c, currentMana: newMana } : c
    );

    let combatLog = [...combat.log, `${creature.nickname || 'Your creature'} uses ${skill.name} for ${skillDamage} damage!${eff.msg}`];

    set((s: any) => ({
      player: {
        ...s.player,
        creatures: updatedPlayerCreatures
      }
    }));

    if (newEnemyHp <= 0) {
      get().handleVictory(creature.id, enemyTemplate, combatLog, newEnemyHp);
      return;
    }

    set((s: any) => ({
      combat: { ...s.combat, log: combatLog, enemyHp: newEnemyHp, phase: 'enemy_turn', turns: s.combat.turns + 1 },
    }));

    get().triggerEnemyTurn(enemyTemplate, combatLog, newEnemyHp);
  },

  triggerEnemyTurn: (enemyTemplate: CreatureTemplate | null, currentLog: string[], currentEnemyHp: number) => {
    setTimeout(() => {
      const state = get();
      const { player, combat } = state;
      if (!player || !combat.active || combat.phase !== 'enemy_turn') return;

      const activeCreature = player.creatures.find((cr: any) => cr.id === combat.playerCreatureId);
      if (!activeCreature || activeCreature.currentHealth <= 0) return;

      const rng = new SeededRandom(Date.now() + combat.turns * 11);

      let useSkillObj: any = null;

      if (enemyTemplate?.skills && enemyTemplate.skills.length > 0 && rng.next() < 0.4) {
        useSkillObj = rng.pick(enemyTemplate.skills);
      }

      let enemyDamage = 0;
      let actionName = 'attacks';
      let effMsg = '';

       if (useSkillObj) {
         actionName = `uses ${useSkillObj.name}`;
         const eff = getElementalEffectiveness(useSkillObj.element, activeCreature.elements);
         effMsg = eff.msg;
         const skillMult = (useSkillObj.power || 10) / 10;
         const baseAtk = enemyTemplate?.baseAttack || 8;
          enemyDamage = Math.max(1, Math.floor((baseAtk * skillMult - (activeCreature.defense || 5) * 0.5) * eff.factor + (Math.floor(rng.next() * 5) - 2)));
       } else {
         const enemyElement = enemyTemplate?.elements?.[0];
         const eff = getElementalEffectiveness(enemyElement, activeCreature.elements);
         effMsg = eff.msg;
          enemyDamage = Math.max(1, Math.floor(((enemyTemplate?.baseAttack || 8) - (activeCreature.defense || 5) * 0.5) * eff.factor + (Math.floor(rng.next() * 5) - 2)));
       }

       const treeData = getAllNodes();
       const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);
       const finalPlayerDamage = applyDamageTakenReduction(enemyDamage, careerBonuses);

       const newPlayerHp = Math.max(0, (activeCreature.currentHealth || 100) - finalPlayerDamage);
       const enemyLog = [...currentLog, `The ${combat.enemyName} ${actionName} and deals ${finalPlayerDamage} damage!${effMsg}`];

      if (newPlayerHp <= 0) {
        const hasHealthySummon = player.creatures.some((c: any) => c.currentHealth > 0 && c.id !== activeCreature.id);
        if (hasHealthySummon) {
          enemyLog.push(`${activeCreature.nickname || 'Creature'} has fainted! Choose another healthy summon from your Soul Deck to continue fighting.`);
          set((s: any) => ({
            combat: {
              ...s.combat,
              log: enemyLog,
              phase: 'player_turn',
              playerCreatureId: '',
            },
            player: {
              ...s.player,
              creatures: s.player.creatures.map((c: any) => c.id === activeCreature.id ? { ...c, currentHealth: 0 } : c),
            }
          }));
      } else {
        enemyLog.push(`${activeCreature.nickname || 'Creature'} has fainted! All your summons have fainted!`);

        const onDemonlordFloor = getDemonlordForFloor((get().currentWorldId));
        const demonlordState = get().demonlordState;
        const alreadyLord = demonlordState?.currentLordPlayerId === player.id;

        if (onDemonlordFloor && !alreadyLord) {
          const newDemonlordState = createDemonlordState();
          newDemonlordState.currentLordPlayerId = player.id;
          newDemonlordState.currentLordPlayerName = player.name;
          newDemonlordState.influence = 100;
          enemyLog.push(`🔥 You have been defeated, but your will burned brighter than the flames! You have claimed the Demonlord title for Floor ${get().currentWorldId}!`, 'system');
          set((s: any) => ({
            combat: { ...s.combat, log: enemyLog, phase: 'defeat', enemyHp: 0 },
            player: {
              ...s.player,
              creatures: s.player.creatures.map((c: any) => c.id === activeCreature.id ? { ...c, currentHealth: 0 } : c),
            },
            demonlordState: newDemonlordState,
          }));
        } else {
          enemyLog.push(alreadyLord
            ? 'The Demonlord shall not be dethroned! Your title is preserved, but you shall try again.'
            : `You have been defeated! You lose 15 Life points.`);
          set((s: any) => ({
            combat: { ...s.combat, log: enemyLog, phase: 'defeat' },
            player: {
              ...s.player,
              life: { ...s.player.life, current: Math.max(1, s.player.life.current - 15) },
              creatures: s.player.creatures.map((c: any) => c.id === activeCreature.id ? { ...c, currentHealth: 0 } : c),
            },
          }));
        }
      }
      } else {
        set((s: any) => ({
          combat: { ...s.combat, log: enemyLog, phase: 'player_turn' },
          player: {
            ...s.player,
            creatures: s.player.creatures.map((c: any) => c.id === activeCreature.id ? { ...c, currentHealth: newPlayerHp } : c),
          },
        }));
      }
    }, 800);
  },

  handleVictory: (creatureId: string, enemyTemplate: CreatureTemplate | null, currentLog: string[], newEnemyHp: number) => {
    const { player, combat, appendLog, dungeon, currentWorldId, worlds } = get();
    if (!player) return;

    if (combat.encounterType === 'territorial' && combat.enemyName) {
      const tileKey = `${player.tileX},${player.tileY}`;
      set((state) => {
        const updatedHostilities = { ...(state.player?.territorialHostilities || {}) };
        delete updatedHostilities[tileKey];
        return {
          player: state.player ? { ...state.player, territorialHostilities: updatedHostilities } : state.player,
        };
      });
      appendLog(`The territorial ${combat.enemyName} has been driven off!`, 'success');
    }

    const isBoss = (combat.enemyName || '').toLowerCase().includes('boss') || (combat.enemyName || '').toLowerCase().includes('guardian') || enemyTemplate?.isBoss;
    const baseExpGained = enemyTemplate?.baseExpValue || 20;
    const monsterLevel = currentWorldId;
    const worldModifier = getWorldModifier(currentWorldId);
    const encounterXP = calculateEncounterXP(baseExpGained, monsterLevel, worldModifier, player.affinity.primary, enemyTemplate?.elements);

    let combatLog = [...currentLog, `The ${combat.enemyName || 'Manifestation'} has been defeated!`, `+${encounterXP} XP gained!`];

    let eggDropped = false;
    if (isBoss) {
      const dropChance = (combat.enemyName || '').toLowerCase().includes('boss') ? 1.0 : 0.5;
      if (Math.random() < dropChance) {
        combatLog.push(`CRITICAL DISCOVERY: You found a rare ${combat.enemyName} Egg! Hatch it from your Satchel to claim this boss summon at Level 1!`);
        eggDropped = true;
      }
    }

    const MAX_LEVEL = 1000;
    const updatedCreatures = player.creatures.map((c: any) => {
      if (c.id !== creatureId) return c;

      if (c.level >= MAX_LEVEL) {
        const withAffection = applyAffectionGain(c, 'victory');
        return { ...withAffection, experience: 0n };
      }

      const xpResult = applyCreatureXP(c, encounterXP, MAX_LEVEL);
      const updatedWithAffection = applyAffectionGain(xpResult.creature, 'victory');

      if (xpResult.leveledUp) {
        const newMaxHp = xpResult.creature.maxHealth;
        const newMaxMana = xpResult.creature.maxMana;
        appendLog(`${c.nickname || 'Creature'} reached Level ${xpResult.newLevel}! (+${xpResult.statsGained.hp} HP, +${xpResult.statsGained.attack} ATK, +${xpResult.statsGained.defense} DEF, +${xpResult.statsGained.speed} SPD)`, 'success');
        if (xpResult.newLevel === MAX_LEVEL) {
          appendLog(`MAX LEVEL REACHED! ${c.nickname || 'Creature'} has reached its ultimate form!`, 'success');
        }
        if (xpResult.evolved) {
          appendLog(`EVOLUTION! ${c.nickname || 'Creature'} has evolved into ${xpResult.newClass?.toUpperCase() || 'a higher form'}!`, 'success');
        }
        if (xpResult.mutations && xpResult.mutations.length > 0) {
          const labels = xpResult.mutations.map(k => k.replace(/_/g, ' ')).join(', ');
          appendLog(`🧬 ${c.nickname || 'Creature'} mutated: ${labels}!`, 'warning');
        }

        const newSkills = [...xpResult.creature.skills];
        const availableSkills = SKILL_TEMPLATES.filter(s => {
          if (newSkills.includes(s.key)) return false;
          if (!s.element) return xpResult.newLevel >= 5;
          return (xpResult.creature.elements || []).includes(s.element);
        });
        if (availableSkills.length > 0) {
          availableSkills.sort((a, b) => a.power - b.power);
          const effectiveClass = xpResult.newClass || c.class || 'common';
          const maxSkills = effectiveClass === 'common' ? 2 : effectiveClass === 'uncommon' ? 3 : effectiveClass === 'rare' ? 4 : effectiveClass === 'epic' ? 5 : effectiveClass === 'legendary' ? 6 : 8;
          if (newSkills.length < maxSkills) {
            const skillToLearn = xpResult.newLevel >= 10 ? availableSkills[availableSkills.length - 1]?.key : xpResult.newLevel >= 5 && availableSkills.length > 1 ? availableSkills[availableSkills.length - 2]?.key || availableSkills[0]?.key : availableSkills[0]?.key;
            if (skillToLearn) {
              newSkills.push(skillToLearn);
              const skillName = SKILL_TEMPLATES.find(s => s.key === skillToLearn)?.name || skillToLearn;
              appendLog(`${c.nickname || 'Creature'} learned new skill: ${skillName}!`, 'success');
            }
          }
        }

        return {
          ...updatedWithAffection,
          skills: newSkills,
        };
      }

      return updatedWithAffection;
    });

    const finalPlayerState = addPlayerXP(player, Math.floor(encounterXP / 4), appendLog, 1);

    const newInventory = [...finalPlayerState.inventory];
    if (eggDropped) {
      newInventory.push({
        templateKey: 'boss_egg',
        quantity: 1,
        modifiers: { bossTemplate: JSON.stringify(enemyTemplate) }
      });
    }

    if (Math.random() < 0.4) {
      const shardType = 'resource_shard';
      const existing = newInventory.find(i => i.templateKey === shardType);
      if (existing) {
        existing.quantity += 1;
      } else {
        newInventory.push({ templateKey: shardType, quantity: 1 });
      }
      combatLog.push(`Loot found: 1x Essence Shard!`);
    }

    set((s: any) => ({
      combat: { ...s.combat, log: combatLog, phase: 'victory', enemyHp: newEnemyHp },
      player: {
        ...finalPlayerState,
        creatures: updatedCreatures,
        inventory: newInventory
      },
      combatTarget: null,
    }));

    if (get().dungeon.active) {
      get().resolveDungeonEncounter(true);
    }
  },

  fleeCombat: () => {
    const { appendLog } = get();
    if (Math.random() < 0.6) {
      appendLog('You fled from combat.', 'warning');
      set({ screen: 'explore', combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 }, combatTarget: null });
    } else {
      appendLog('Could not escape!', 'warning');
      set((state: any) => ({ combat: { ...state.combat, phase: 'enemy_turn' } }));
    }
  },

  selectCreatureForCombat: (creatureId: string) => set((state: any) => ({
    combatTarget: state.combatTarget === creatureId ? null : creatureId,
  })),
});
