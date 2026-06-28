import type { CreatureInstance } from '../types/game';

export type AffectionLevel = 1 | 2 | 3 | 4 | 5;

export interface AffectionLevelInfo {
  level: AffectionLevel;
  minAffection: number;
  maxAffection: number;
  damageMultiplier: number;
  xpBonusMultiplier: number;
}

const AFFECTION_LEVEL_DATA: AffectionLevelInfo[] = [
  { level: 1, minAffection: 0, maxAffection: 19, damageMultiplier: 1.0, xpBonusMultiplier: 1.0 },
  { level: 2, minAffection: 20, maxAffection: 39, damageMultiplier: 1.07, xpBonusMultiplier: 1.1 },
  { level: 3, minAffection: 40, maxAffection: 59, damageMultiplier: 1.15, xpBonusMultiplier: 1.2 },
  { level: 4, minAffection: 60, maxAffection: 79, damageMultiplier: 1.25, xpBonusMultiplier: 1.35 },
  { level: 5, minAffection: 80, maxAffection: 100, damageMultiplier: 1.4, xpBonusMultiplier: 1.5 },
];

export function getAffectionLevel(affection: number): AffectionLevel {
  if (affection >= 80) return 5;
  if (affection >= 60) return 4;
  if (affection >= 40) return 3;
  if (affection >= 20) return 2;
  return 1;
}

export function getAffectionLevelInfo(level: AffectionLevel): AffectionLevelInfo {
  const info = AFFECTION_LEVEL_DATA[level - 1];
  if (!info) throw new Error(`Invalid affection level: ${level}`);
  return info;
}

export function getAffectionDamageMultiplier(creature: CreatureInstance): number {
  const level = getAffectionLevel(creature.affection ?? 0);
  const data = AFFECTION_LEVEL_DATA[level - 1];
  return data?.damageMultiplier ?? 1.0;
}

export function getAffectionXPBonus(creature: CreatureInstance): number {
  const level = getAffectionLevel(creature.affection ?? 0);
  const data = AFFECTION_LEVEL_DATA[level - 1];
  return data?.xpBonusMultiplier ?? 1.0;
}

export type AffectionSource = 'victory' | 'training' | 'capture';

const AFFECTION_GAIN: Record<AffectionSource, number> = {
  victory: 8,
  training: 5,
  capture: 10,
};

export function applyAffectionGain(creature: CreatureInstance, source: AffectionSource): CreatureInstance {
  const gain = AFFECTION_GAIN[source] ?? 0;
  const newAffection = Math.min(100, (creature.affection ?? 0) + gain);
  
  return {
    ...creature,
    affection: newAffection,
  };
}