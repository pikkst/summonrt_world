import type { CreatureInstance } from '../types/game';

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

export function getWorldModifier(worldIndex: number): number {
  if (worldIndex < 1) throw new Error('World index must be at least 1');
  return 1 + (worldIndex * 0.05);
}

export type Element =
  | 'fire'
  | 'water'
  | 'earth'
  | 'air'
  | 'lightning'
  | 'iron'
  | 'nature'
  | 'ice'
  | 'light'
  | 'darkness'
  | 'void'
  | 'starlight'
  | 'chaos';

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

  while (newLevel < maxLevel) {
    const threshold = getXPThreshold(newLevel);
    if (newExp < threshold) break;
    newExp -= threshold;
    newLevel += 1;
    leveledUp = true;

    statsGained.hp += creature.isBossSummon ? 25 : 10;
    statsGained.attack += creature.isBossSummon ? 5 : 2;
    statsGained.defense += creature.isBossSummon ? 3 : 1;
    statsGained.speed += creature.isBossSummon ? 3 : 1;
  }

  const newMaxHp = (creature.maxHealth || 50) + statsGained.hp;
  const newMaxMana = (creature.maxMana || 20) + (creature.isBossSummon ? 10 : 4);

  const updatedCreature: CreatureInstance = {
    ...creature,
    level: newLevel,
    experience: newExp,
    maxHealth: newMaxHp,
    maxMana: newMaxMana,
    attack: (creature.attack || 10) + statsGained.attack,
    defense: (creature.defense || 5) + statsGained.defense,
    speed: (creature.speed || 5) + statsGained.speed,
  };

  if (leveledUp) {
    updatedCreature.currentHealth = newMaxHp;
    updatedCreature.currentMana = newMaxMana;
  }

  return { creature: updatedCreature, leveledUp, newLevel, statsGained };
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
