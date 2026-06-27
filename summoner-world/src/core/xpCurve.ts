import type { CreatureInstance } from '../types/game';
import type { Element } from '../types/game';
import type { EvolutionStage } from '../data/constants.ts';
import { EVOLUTION_CHAINS } from '../data/constants.ts';

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
  };
}

export function grantPartyXP(
  creatures: CreatureInstance[],
  creatureIds: string[],
  baseXP: number,
  maxLevel: number = 1000
): { updatedCreatures: CreatureInstance[]; leveledUpIds: string[] } {
  if (creatureIds.length === 0) return { updatedCreatures: creatures, leveledUpIds: [] };

  const xpPerCreature = Math.max(1, Math.floor(baseXP / creatureIds.length));
  const updatedCreatures = creatures.map((c) =>
    creatureIds.includes(c.id) ? applyCreatureXP(c, xpPerCreature, maxLevel).creature : c
  );

  const leveledUpIds = updatedCreatures
    .filter((c) => creatureIds.includes(c.id) && c.level > creatures.find((orig) => orig.id === c.id)!.level)
    .map((c) => c.id);

  return { updatedCreatures, leveledUpIds };
}
