import type { PlayerCoreState } from '../types/playerCore.ts';
import { applyPlayerStatisticEvent } from './playerCore/playerStatisticsTracking.ts';

export const WORLD_COUNT = 100;
export const WORLD_TIER_SIZE = 10;
export const DEMONLORD_WORLD_ID = WORLD_COUNT;

export type WorldUnlockRequirementType =
  | 'previous_world_boss'
  | 'min_player_level'
  | 'demonlord_title';

export interface WorldUnlockRequirement {
  type: WorldUnlockRequirementType;
  value?: number;
  description: string;
}

export interface WorldTierRule {
  tier: number;
  firstWorld: number;
  lastWorld: number;
  recommendedLevel: number;
  description: string;
  requirements: WorldUnlockRequirement[];
}

export interface WorldUnlockContext {
  previousWorldBossDefeated: boolean;
  playerLevel: number;
  hasDemonlordTitle: boolean;
}

export interface WorldProgressionEntry {
  worldId: number;
  tier: number;
  isStartingWorld: boolean;
  isDemonlordWorld: boolean;
  recommendedLevel: number;
  requirements: WorldUnlockRequirement[];
}

export interface WorldCompletionState {
  worldBossDefeated: boolean;
}

export function getWorldTier(worldId: number): number {
  if (worldId < 1) return 1;
  if (worldId > WORLD_COUNT) return Math.ceil(WORLD_COUNT / WORLD_TIER_SIZE);
  return Math.ceil(worldId / WORLD_TIER_SIZE);
}

export function getWorldTierRule(worldId: number): WorldTierRule {
  const tier = getWorldTier(worldId);
  const firstWorld = (tier - 1) * WORLD_TIER_SIZE + 1;
  const lastWorld = Math.min(tier * WORLD_TIER_SIZE, WORLD_COUNT);
  return {
    tier,
    firstWorld,
    lastWorld,
    recommendedLevel: firstWorld,
    description: describeTier(tier, firstWorld, lastWorld),
    requirements: [PREVIOUS_WORLD_BOSS_REQUIREMENT],
  };
}

export function getAllWorldTierRules(): WorldTierRule[] {
  const rules: WorldTierRule[] = [];
  for (let tier = 1; tier <= Math.ceil(WORLD_COUNT / WORLD_TIER_SIZE); tier++) {
    const firstWorld = (tier - 1) * WORLD_TIER_SIZE + 1;
    const lastWorld = Math.min(tier * WORLD_TIER_SIZE, WORLD_COUNT);
    rules.push({
      tier,
      firstWorld,
      lastWorld,
      recommendedLevel: firstWorld,
      description: describeTier(tier, firstWorld, lastWorld),
      requirements: [PREVIOUS_WORLD_BOSS_REQUIREMENT],
    });
  }
  return rules;
}

export function isStartingWorld(worldId: number): boolean {
  return worldId === 1;
}

export function isDemonlordWorld(worldId: number): boolean {
  return worldId === DEMONLORD_WORLD_ID;
}

export function getNextWorldId(worldId: number): number | null {
  const next = worldId + 1;
  return next <= WORLD_COUNT ? next : null;
}

export function getWorldUnlockRequirements(worldId: number): WorldUnlockRequirement[] {
  if (isStartingWorld(worldId)) return [];
  return [PREVIOUS_WORLD_BOSS_REQUIREMENT];
}

export function getUnmetWorldUnlockRequirements(
  worldId: number,
  context: WorldUnlockContext
): WorldUnlockRequirement[] {
  if (isStartingWorld(worldId)) return [];

  const unmet: WorldUnlockRequirement[] = [];
  for (const requirement of getWorldUnlockRequirements(worldId)) {
    if (!isRequirementMet(requirement, context)) {
      unmet.push(requirement);
    }
  }
  return unmet;
}

export function canUnlockWorld(worldId: number, context: WorldUnlockContext): boolean {
  return getUnmetWorldUnlockRequirements(worldId, context).length === 0;
}

export function buildWorldProgressionMap(): WorldProgressionEntry[] {
  const entries: WorldProgressionEntry[] = [];
  for (let worldId = 1; worldId <= WORLD_COUNT; worldId++) {
    const tierRule = getWorldTierRule(worldId);
    entries.push({
      worldId,
      tier: tierRule.tier,
      isStartingWorld: isStartingWorld(worldId),
      isDemonlordWorld: isDemonlordWorld(worldId),
      recommendedLevel: tierRule.recommendedLevel,
      requirements: getWorldUnlockRequirements(worldId),
    });
  }
  return entries;
}

export function getWorldCompletionCriteria(_worldId: number): WorldUnlockRequirement[] {
  return [
    {
      type: 'previous_world_boss',
      description: 'Defeat the World Boss of the central dungeon tower.',
    },
  ];
}

export function evaluateWorldCompletion(state: WorldCompletionState): boolean {
  return state.worldBossDefeated;
}

export function isWorldComplete(worldId: number, bossDefeated: boolean): boolean {
  return evaluateWorldCompletion({ worldBossDefeated: bossDefeated });
}

export function unlockWorld(playerCore: PlayerCoreState, worldId: number): PlayerCoreState {
  if (worldId < 1 || worldId > WORLD_COUNT) return playerCore;
  if (playerCore.worldUnlocks.unlockedWorlds.includes(worldId)) return playerCore;

  return {
    ...playerCore,
    worldUnlocks: {
      ...playerCore.worldUnlocks,
      unlockedWorlds: [...playerCore.worldUnlocks.unlockedWorlds, worldId],
    },
    statistics: applyPlayerStatisticEvent(playerCore.statistics, {
      type: 'WorldUnlocked',
      worldId,
    }),
  };
}

export function applyWorldBossCompletion(
  playerCore: PlayerCoreState,
  completedWorldId: number
): PlayerCoreState {
  const nextWorldId = getNextWorldId(completedWorldId);
  if (nextWorldId === null) return playerCore;
  return unlockWorld(playerCore, nextWorldId);
}

const PREVIOUS_WORLD_BOSS_REQUIREMENT: WorldUnlockRequirement = {
  type: 'previous_world_boss',
  description: 'Defeat the World Boss of the previous world.',
};

function isRequirementMet(
  requirement: WorldUnlockRequirement,
  context: WorldUnlockContext
): boolean {
  switch (requirement.type) {
    case 'previous_world_boss':
      return context.previousWorldBossDefeated;
    case 'min_player_level':
      return context.playerLevel >= (requirement.value ?? 0);
    case 'demonlord_title':
      return context.hasDemonlordTitle;
    default:
      return false;
  }
}

function describeTier(tier: number, firstWorld: number, lastWorld: number): string {
  if (tier === Math.ceil(WORLD_COUNT / WORLD_TIER_SIZE) && lastWorld === WORLD_COUNT) {
    return `End-game tier (World ${firstWorld}-${lastWorld}); World ${WORLD_COUNT} is the Demonlord Throne floor.`;
  }
  return `Worlds ${firstWorld}-${lastWorld}.`;
}
