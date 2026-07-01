import type { Element, ElementalAffinity, LogEntry, PlayerState, WorldData, CreatureInstance } from './types.ts';
import { getNeighbors } from '../../data/constants.ts';
import { generateTile } from '../../core/worldGenerator.ts';
import { getXPThreshold, getWorldModifier } from '../../core/xpCurve.ts';
export { getWorldModifier };

export function rollAffinity(): ElementalAffinity {
  const elements: Element[] = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'];
  const primary = elements[Math.floor(Math.random() * elements.length)] as Element;
  const rand = Math.random();
  if (rand < 0.000001) {
    const remaining = elements.filter(e => e !== primary);
    const secondary = pickWeightedElement(primary, remaining);
    const remaining2 = remaining.filter(e => e !== secondary);
    const tertiary = pickWeightedElement(primary, remaining2);
    return { primary, secondary, tertiary, traits: ['primordial'] };
  } else if (rand < 0.001) {
    const remaining = elements.filter(e => e !== primary);
    const secondary = pickWeightedElement(primary, remaining);
    return { primary, secondary };
  }
  return { primary };
}

function pickWeightedElement(primary: Element, candidates: Element[]): Element {
  const weights = candidates.map(e => getElementPairWeight(primary, e));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}

function getElementPairWeight(primary: Element, secondary: Element): number {
  const synergisticPairs: [Element, Element][] = [
    ['fire', 'air'],
    ['water', 'ice'],
    ['earth', 'nature'],
    ['air', 'lightning'],
    ['lightning', 'iron'],
  ];
  
  const opposingPairs: [Element, Element][] = [
    ['fire', 'ice'],
    ['fire', 'water'],
    ['light', 'darkness'],
    ['nature', 'fire'],
    ['ice', 'fire'],
    ['water', 'fire'],
  ];
  
  const isSynergistic = synergisticPairs.some(
    ([a, b]) => (a === primary && b === secondary) || (a === secondary && b === primary)
  );
  const isOpposing = opposingPairs.some(
    ([a, b]) => (a === primary && b === secondary) || (a === secondary && b === primary)
  );
  
  if (isSynergistic) return 2;
  if (isOpposing) return 0.5;
  return 1;
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
  const adjustedXp = BigInt(Math.round(xpGained * worldModifier));
  let newExp = player.experience + adjustedXp;
  let newLevel = player.level;
  let skillPointsGained = 0;

  while (newExp >= getXPThreshold(newLevel)) {
    newExp -= getXPThreshold(newLevel);
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

export function calculateMinViableLevel(worldIndex: number): number {
   if (worldIndex < 1) return 1;
   const baseLevel = 1;
   const perWorldIncrement = 2;
   return Math.max(1, baseLevel + Math.floor((worldIndex - 1) * perWorldIncrement));
}

export interface LevelScalingResult {
   scaled: boolean;
   originalLevel: number;
   scaledLevel: number;
   statsApplied: {
     health: number;
     attack: number;
     defense: number;
     speed: number;
     level: number;
   };
}

export function applyMinViableLevelScaling(
   player: PlayerState,
   worldIndex: number,
   creatures: CreatureInstance[]
): { player: PlayerState; creatures: CreatureInstance[] } {
   const minLevel = calculateMinViableLevel(worldIndex);
   
   if (player.level >= minLevel) {
     return { player, creatures };
   }

   const levelsToAdd = minLevel - player.level;
   const newLevel = minLevel;
   
   const baseHealth = 100 + (newLevel * 10);
   const baseAttack = player.strength || 10;
   const baseDefense = player.defense || 10;
   const baseSpeed = player.speed || 10;

   const scaledCreatures = creatures.map(creature => {
     const healthBoost = Math.min(levelsToAdd * 5, 50);
     const attackBoost = Math.min(levelsToAdd, 10);
     const defenseBoost = Math.min(levelsToAdd, 5);
     const speedBoost = Math.min(levelsToAdd, 5);
     
     return {
       ...creature,
       maxHealth: creature.maxHealth + healthBoost,
       currentHealth: Math.min(creature.currentHealth + healthBoost, creature.maxHealth + healthBoost),
       maxMana: creature.maxMana + (levelsToAdd * 2),
       currentMana: Math.min(creature.currentMana + (levelsToAdd * 2), creature.maxMana + (levelsToAdd * 2)),
       attack: creature.attack + attackBoost,
       defense: creature.defense + defenseBoost,
       speed: creature.speed + speedBoost,
     };
   });

   const scaledPlayer: PlayerState = {
     ...player,
     level: newLevel,
     life: { ...player.life, max: baseHealth, current: baseHealth },
     energy: { ...player.energy, max: 100 + (newLevel * 5), current: 100 + (newLevel * 5) },
   };

   return { player: scaledPlayer, creatures: scaledCreatures };
}
