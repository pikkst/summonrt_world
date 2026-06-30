import { ELEMENTS } from '../../data/constants';
import type { DungeonBossScaling, Element } from '../../types/game';

export const BASE_BOSS_HP = 1000;

export function calculateBossScaling(worldIndex: number, baseBossHp = BASE_BOSS_HP): DungeonBossScaling {
  const normalizedWorldIndex = Math.max(1, worldIndex);
  const hpMultiplier = 1 + ((normalizedWorldIndex - 1) * 0.25);

  return {
    baseBossHp,
    hpMultiplier,
    scaledBossHp: Math.round(baseBossHp * hpMultiplier),
    signatureAbilityCount: Math.floor(normalizedWorldIndex / 10)
  };
}

export function getWorldElement(worldIndex: number): Element {
  return ELEMENTS[(Math.max(1, worldIndex) - 1) % ELEMENTS.length] as Element;
}
