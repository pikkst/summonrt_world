import type { CreatureInstance } from '../types/game';
import type { Element } from '../types/game';
import type { EvolutionStage } from '../data/constants.ts';
import { EVOLUTION_CHAINS, getClassTier, getMutationChance, getMaxMutationsForClass, MUTATION_TYPES, MUTATION_SKILL_POOL, MUTATION_TRAIT_POOL, ELEMENTS, type MutationType } from '../data/constants.ts';
import { getAffectionXPBonus } from './affection.ts';

export function getXPThreshold(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  if (level === 1) return 100n;
  const exponent = level - 1;
  const numerator = 115n ** BigInt(exponent);
  const denominator = 100n ** BigInt(exponent);
  return (100n * numerator) / denominator;
}

export function getCumulativeXP(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  let total = 0n;
  for (let i = 1; i <= level; i++) {
    total += getXPThreshold(i);
  }
  return total;
}

export function getXPForLevel(startLevel: number, endLevel: number): bigint {
  if (startLevel < 1) throw new Error('Start level must be at least 1');
  if (endLevel < startLevel) throw new Error('End level must be >= start level');
  if (startLevel === endLevel) return 0n;
  return getCumulativeXP(endLevel) - getCumulativeXP(startLevel);
}

export function getCreatureXPThreshold(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  if (level === 1) return 50n;
  const base = 50n;
  const exponent = level - 1;
  const multiplierNum = 112n ** BigInt(exponent);
  const multiplierDen = 100n ** BigInt(exponent);
  return (base * multiplierNum) / multiplierDen;
}

export function getCreatureCumulativeXP(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  let total = 0n;
  for (let i = 1; i <= level; i++) {
    total += getCreatureXPThreshold(i);
  }
  return total;
}

export function getCreatureXPForLevel(startLevel: number, endLevel: number): bigint {
  if (startLevel < 1) throw new Error('Start level must be at least 1');
  if (endLevel < startLevel) throw new Error('End level must be >= start level');
  if (startLevel === endLevel) return 0n;
  return getCreatureCumulativeXP(endLevel) - getCreatureCumulativeXP(startLevel);
}

export function getWorldModifier(worldIndex: number): number {
  if (worldIndex < 1) throw new Error('World index must be at least 1');
  return 1 + (worldIndex * 0.05);
}

const SAME_ELEMENT_BONUS = 1.15;
const OPPOSING_ELEMENT_PENALTY = 0.85;

const ELEMENTAL_OPPOSITIONS: Record<string, string[]> = {
  fire: ['water', 'earth'],
  water: ['fire', 'nature'],
  earth: ['air', 'lightning'],
  air: ['earth', 'iron'],
  lightning: ['earth', 'water'],
  nature: ['fire', 'ice'],
  ice: ['fire', 'water'],
  iron: ['lightning', 'earth'],
  light: ['darkness'],
  darkness: ['light'],
  void: ['light', 'starlight'],
  starlight: ['darkness', 'chaos'],
  chaos: ['light', 'void', 'starlight'],
  omni: [],
};

export function getAffinityBonusXP(atkElement: Element | undefined, defElements: Element[] | undefined): number {
  if (!atkElement || !defElements || defElements.length === 0) {
    return 1;
  }

  const hasSameElement = defElements.includes(atkElement);
  if (hasSameElement) {
    return SAME_ELEMENT_BONUS;
  }

  const opposingElements = ELEMENTAL_OPPOSITIONS[atkElement] || [];
  const hasOpposingElement = defElements.some(elem => opposingElements.includes(elem));
  if (hasOpposingElement) {
    return OPPOSING_ELEMENT_PENALTY;
  }

  return 1;
}

export function calculateEncounterXP(
  baseXp: number,
  monsterLevel: number,
  worldModifier: number,
  atkElement: Element | undefined,
  defElements: Element[] | undefined
): number {
  const affinityBonus = getAffinityBonusXP(atkElement, defElements);
  return Math.round(baseXp * monsterLevel * worldModifier * affinityBonus);
}

export interface CreatureXPResult {
  creature: CreatureInstance;
  leveledUp: boolean;
  newLevel: number;
  statsGained: { hp: number; attack: number; defense: number; speed: number };
  evolved?: boolean;
  evolutionStage?: number;
  newClass?: string;
  evolutionStats?: { hp: number; attack: number; defense: number; speed: number };
  mutations?: string[];
}

export function checkEvolution(creature: CreatureInstance): { stage: EvolutionStage; newClass: string; statMultiplier: number } | null {
  const currentClass = creature.class || 'common';
  const chain = EVOLUTION_CHAINS[currentClass];
  if (!chain || chain.length === 0) return null;

  const currentStage = creature.evolutionStage || 0;
  if (currentStage >= chain.length) return null;

  const nextStage = chain[currentStage];
  if (!nextStage) return null;
  if (creature.level >= nextStage.minLevel) {
    return { stage: nextStage, newClass: nextStage.newClass, statMultiplier: nextStage.statMultiplier };
  }

  return null;
}

export function getMutationChanceForClass(creatureClass: string): number {
  const tier = getClassTier(creatureClass);
  return getMutationChance(tier);
}

function rollMutationType(): MutationType {
  const idx = Math.floor(Math.random() * MUTATION_TYPES.length);
  return MUTATION_TYPES[idx] as MutationType;
}

interface MutationResult {
  mutationKey: string;
  statsDelta?: { hp: number; attack: number; defense: number; speed: number };
  newSkill?: string;
  newTrait?: string;
  newElement?: Element;
}

function rollAndApplyMutation(
  creature: CreatureInstance,
  currentSkills: string[],
  currentTraits: string[],
  currentElements: Element[]
): MutationResult {
  const type = rollMutationType();

  switch (type) {
    case 'stat_shift': {
      const statKeys = ['attack', 'defense', 'speed'] as const;
      const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
      const boost = 2;
      const delta: { hp: number; attack: number; defense: number; speed: number } = { hp: 0, attack: 0, defense: 0, speed: 0 };
      if (stat === 'attack') delta.attack = boost;
      else if (stat === 'defense') delta.defense = boost;
      else delta.speed = boost;
      return { mutationKey: `stat_shift_${stat}`, statsDelta: delta };
    }
    case 'new_skill': {
      const available = MUTATION_SKILL_POOL.filter(s => !currentSkills.includes(s));
      if (available.length === 0) return { mutationKey: '' };
      const skill = available[Math.floor(Math.random() * available.length)];
      return { mutationKey: `new_skill_${skill}`, newSkill: skill };
    }
    case 'passive_trait': {
      const available = MUTATION_TRAIT_POOL.filter(t => !currentTraits.includes(t));
      if (available.length === 0) return { mutationKey: '' };
      const trait = available[Math.floor(Math.random() * available.length)];
      return { mutationKey: `passive_trait_${trait}`, newTrait: trait };
    }
    case 'elemental_drift': {
      const available = ELEMENTS.filter(e => !currentElements.includes(e));
      if (available.length === 0) return { mutationKey: '' };
      const element = available[Math.floor(Math.random() * available.length)] as Element;
      return { mutationKey: `elemental_drift_${element}`, newElement: element };
    }
    default:
      return { mutationKey: '' };
  }
}

export function applyCreatureXP(
  creature: CreatureInstance,
  xp: bigint | number,
  maxLevel: number = 1000
): CreatureXPResult {
  let newExp = (creature.experience ?? 0n) + BigInt(xp);
  let newLevel = creature.level;
  let leveledUp = false;
  let statsGained = { hp: 0, attack: 0, defense: 0, speed: 0 };
  let evolved = false;
  let evolutionStage = creature.evolutionStage || 0;
  let newClass = creature.class || 'common';
  let evolutionStats = { hp: 0, attack: 0, defense: 0, speed: 0 };
  const mutations: string[] = [];

  const mutationSkills = [...(creature.skills || [])];
  const mutationTraits = [...(creature.traits || [])];
  const mutationElements = [...(creature.elements || [])];
  const maxMutations = getMaxMutationsForClass(newClass);

  while (newLevel < maxLevel) {
    const threshold = getCreatureXPThreshold(newLevel);
    if (newExp < threshold) break;
    newExp -= threshold;
    newLevel += 1;
    leveledUp = true;

    statsGained.hp += creature.isBossSummon ? 25 : 10;
    statsGained.attack += creature.isBossSummon ? 5 : 2;
    statsGained.defense += creature.isBossSummon ? 3 : 1;
    statsGained.speed += creature.isBossSummon ? 3 : 1;

    const evoResult = checkEvolution({ ...creature, level: newLevel, class: newClass, evolutionStage });
    if (evoResult && !evolved) {
      evolved = true;
      evolutionStage += 1;
      newClass = evoResult.newClass;
      const hpMult = Math.max(1, evoResult.statMultiplier);
      const atkMult = Math.max(1, evoResult.statMultiplier);
      const defMult = Math.max(1, evoResult.statMultiplier);
      const spdMult = Math.max(1, evoResult.statMultiplier);
      evolutionStats.hp = Math.floor(((creature.maxHealth || 50) * 0.1) * (hpMult - 1));
      evolutionStats.attack = Math.floor(((creature.attack || 10) * 0.1) * (atkMult - 1));
      evolutionStats.defense = Math.floor(((creature.defense || 5) * 0.1) * (defMult - 1));
      evolutionStats.speed = Math.floor(((creature.speed || 5) * 0.1) * (spdMult - 1));
      statsGained.hp += evolutionStats.hp;
      statsGained.attack += evolutionStats.attack;
      statsGained.defense += evolutionStats.defense;
      statsGained.speed += evolutionStats.speed;
    }

    if (mutations.length < maxMutations) {
      const chance = getMutationChanceForClass(newClass);
      if (Math.random() < chance) {
        const mutationResult = rollAndApplyMutation(creature, mutationSkills, mutationTraits, mutationElements);
        if (mutationResult.mutationKey) {
          mutations.push(mutationResult.mutationKey);
          if (mutationResult.statsDelta) {
            statsGained.hp += mutationResult.statsDelta.hp || 0;
            statsGained.attack += mutationResult.statsDelta.attack || 0;
            statsGained.defense += mutationResult.statsDelta.defense || 0;
            statsGained.speed += mutationResult.statsDelta.speed || 0;
          }
          if (mutationResult.newSkill) mutationSkills.push(mutationResult.newSkill);
          if (mutationResult.newTrait) mutationTraits.push(mutationResult.newTrait);
          if (mutationResult.newElement) mutationElements.push(mutationResult.newElement);
        }
      }
    }
  }

  const newMaxHp = (creature.maxHealth || 50) + statsGained.hp;
  const newMaxMana = (creature.maxMana || 20) + (creature.isBossSummon ? 10 : 4);

  const updatedCreature: CreatureInstance = {
    ...creature,
    class: newClass,
    level: newLevel,
    experience: newExp,
    maxHealth: newMaxHp,
    maxMana: newMaxMana,
    attack: (creature.attack || 10) + statsGained.attack,
    defense: (creature.defense || 5) + statsGained.defense,
    speed: (creature.speed || 5) + statsGained.speed,
    skills: mutationSkills,
    traits: mutationTraits,
    elements: mutationElements,
    mutations: [...(creature.mutations || []), ...mutations],
    evolutionStage,
  };

  if (leveledUp) {
    updatedCreature.currentHealth = newMaxHp;
    updatedCreature.currentMana = newMaxMana;
  }

  return {
    creature: updatedCreature,
    leveledUp,
    newLevel,
    statsGained,
    evolved,
    evolutionStage,
    newClass: evolved ? newClass : undefined,
    evolutionStats: evolved ? evolutionStats : undefined,
    mutations,
  };
}

export function grantPartyXP(
  creatures: CreatureInstance[],
  creatureIds: string[],
  baseXP: number,
  maxLevel: number = 1000
): { updatedCreatures: CreatureInstance[]; leveledUpIds: string[]; mutatedIds: string[]; mutationsById: Record<string, string[]> } {
  if (creatureIds.length === 0) return { updatedCreatures: creatures, leveledUpIds: [], mutatedIds: [], mutationsById: {} };

  const xpPerCreature = Math.max(1, Math.floor(baseXP / creatureIds.length));
  const xpResults = new Map<string, CreatureXPResult>();
  const updatedCreatures = creatures.map((c) => {
    if (creatureIds.includes(c.id)) {
      const affectionBonus = getAffectionXPBonus(c);
      const adjustedXP = Math.floor(xpPerCreature * affectionBonus);
      const result = applyCreatureXP(c, adjustedXP, maxLevel);
      xpResults.set(c.id, result);
      return result.creature;
    }
    return c;
  });

  const leveledUpIds = updatedCreatures
    .filter((c) => creatureIds.includes(c.id) && c.level > creatures.find((orig) => orig.id === c.id)!.level)
    .map((c) => c.id);

  const mutatedIds: string[] = [];
  const mutationsById: Record<string, string[]> = {};
  for (const c of updatedCreatures) {
    if (creatureIds.includes(c.id)) {
      const result = xpResults.get(c.id);
      if (result?.mutations && result.mutations.length > 0) {
        mutatedIds.push(c.id);
        mutationsById[c.id] = result.mutations;
      }
    }
  }

  return { updatedCreatures, leveledUpIds, mutatedIds, mutationsById };
}
