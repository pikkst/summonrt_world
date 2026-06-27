import type { Element, ElementalAffinity, LogEntry, PlayerState, WorldData } from './types.ts';
import { getNeighbors } from '../../data/constants.ts';
import { generateTile } from '../../core/worldGenerator.ts';
import { getWorldModifier } from '../../core/xpCurve.ts';
export { getWorldModifier };

export function rollAffinity(): ElementalAffinity {
  const elements: Element[] = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness','starlight','void','chaos'];
  const primary = elements[Math.floor(Math.random() * elements.length)] as Element;
  const rand = Math.random();
  if (rand < 0.001) {
    const remaining = elements.filter(e => e !== primary);
    const secondary = remaining[Math.floor(Math.random() * remaining.length)] as Element;
    const remaining2 = remaining.filter(e => e !== secondary);
    const tertiary = remaining2[Math.floor(Math.random() * remaining2.length)] as Element;
    return { primary, secondary, tertiary };
  } else if (rand < 0.011) {
    const remaining = elements.filter(e => e !== primary);
    const secondary = remaining[Math.floor(Math.random() * remaining.length)] as Element;
    return { primary, secondary };
  }
  return { primary };
}

export function createLog(text: string, type: LogEntry['type'], turnCount: number): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    turn: turnCount,
    text,
    type,
    timestamp: Date.now(),
  };
}

export function getPlayerElements(player: PlayerState): Element[] {
  const elems: Element[] = [player.affinity.primary];
  if (player.affinity.secondary) elems.push(player.affinity.secondary);
  if (player.affinity.tertiary) elems.push(player.affinity.tertiary);
  if (player.affinity.learned) {
    player.affinity.learned.forEach(el => {
      if (!elems.includes(el)) elems.push(el);
    });
  }
  return elems;
}

export function addPlayerXP(player: PlayerState, xpGained: number, logFn: (text: string, type: LogEntry['type']) => void, worldModifier: number = 1): PlayerState {
  const adjustedXp = xpGained * worldModifier;
  let newExp = player.experience + adjustedXp;
  let newLevel = player.level;
  let skillPointsGained = 0;

  while (newExp >= Math.floor(100 * Math.pow(1.15, newLevel - 1))) {
    newExp -= Math.floor(100 * Math.pow(1.15, newLevel - 1));
    newLevel += 1;
    skillPointsGained += 2;
  }

  const updatedPlayer = {
    ...player,
    level: newLevel,
    experience: newExp,
    skillPoints: (player.skillPoints ?? 0) + skillPointsGained,
  };

  if (newLevel > player.level) {
    logFn(`🎉 LEVEL UP! You reached Player Level ${newLevel}! Gained +${skillPointsGained} Skill Points.`, 'success');
    updatedPlayer.life = {
      ...player.life,
      max: 100 + (newLevel * 10),
      current: 100 + (newLevel * 10),
    };
    updatedPlayer.energy = {
      ...player.energy,
      max: 100 + (newLevel * 5),
      current: 100 + (newLevel * 5),
    };
  }

  return updatedPlayer;
}

export function calculateMovementModifiers(x: number, y: number): { distToCenter: number; proximityFactor: number; difficultyScale: number; energyCost: number } {
  const distToCenter = Math.hypot(x - 1000, y - 1000);
  const maxDist = 1414;
  const proximityFactor = Math.max(0, 1 - (distToCenter / maxDist));
  const difficultyScale = 1 + proximityFactor * 4;
  const energyCost = 1 + Math.floor(proximityFactor * 2);
  return { distToCenter, proximityFactor, difficultyScale, energyCost };
}

export function processTileDiscovery(x: number, y: number, currentWorldId: number, worlds: Map<number, WorldData>): void {
  const world = worlds.get(currentWorldId);
  if (!world) return;
  getNeighbors(x, y).forEach(n => {
    const nk = `${n.x},${n.y}`;
    if (!world.tiles.has(nk)) {
      const nt = generateTile(n.x, n.y, currentWorldId);
      world.tiles.set(nk, nt);
    }
    world.tiles.get(nk)!.discovered = true;
  });
}

export function applyResourceRegeneration(player: PlayerState, now: number): PlayerState {
  const updatedPlayer = { ...player };
  const regenTimestamp = new Date(now).toISOString();

  const updateResource = <K extends keyof Pick<PlayerState, 'energy' | 'nerve' | 'happy' | 'life'>>(
    resource: K,
    rate: number,
  ): void => {
    const res = player[resource];
    const lastUpdateTime = res.lastUpdate ? new Date(res.lastUpdate).getTime() : NaN;
    if (isNaN(lastUpdateTime)) return;

    const elapsedMs = Math.max(0, now - lastUpdateTime);
    const elapsedMinutes = elapsedMs / (1000 * 60);
    if (elapsedMinutes < 1) return;

    const gain = Math.floor(elapsedMinutes * rate);
    if (gain <= 0) return;

    updatedPlayer[resource] = {
      ...res,
      current: Math.min(res.max, Math.max(0, res.current + gain)),
      lastUpdate: regenTimestamp,
    };
  };

  updateResource('energy', 1);
  updateResource('nerve', 1 / 3);
  updateResource('happy', 1 / 2);
  updateResource('life', 1 / 5);

  return updatedPlayer;
}
