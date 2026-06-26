export function getXPThreshold(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  const xp = Math.pow(1.15, level - 1) * 100;
  return BigInt(Math.round(xp));
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
