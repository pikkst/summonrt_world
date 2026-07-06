import type { WorldData } from '../types/game';
import { worldEventBus } from './worldEventBus.ts';

export const MINUTES_PER_TURN = 6;
export const TURNS_PER_DAY = 1440 / MINUTES_PER_TURN;

export const RESOURCE_MAX_QTY = 5;

export const PLANT_RESOURCE_TYPES = ['wood', 'herbs'] as const;
export const ORE_RESOURCE_TYPES = ['stone', 'ore', 'crystal', 'essence'] as const;

export const PLANT_RESPAWN_DAYS = 30;
export const ORE_RESPAWN_DAYS = 90;

export function getRespawnDays(resourceType: string): number {
  if ((PLANT_RESOURCE_TYPES as readonly string[]).includes(resourceType)) return PLANT_RESPAWN_DAYS;
  return ORE_RESPAWN_DAYS;
}

export interface WorldTickStats {
  turnCount: number;
  gameTimeMinutes: number;
  dayCount: number;
}

export interface WorldTickParams {
  currentRealTime: number;
  lastWorldTickTime: number;
  turnCount: number;
  gameTimeMinutes: number;
  dayCount: number;
}

export function calculateWorldTicks(params: WorldTickParams): WorldTickStats {
  const { currentRealTime, lastWorldTickTime, turnCount, gameTimeMinutes, dayCount } = params;
  const elapsedMs = currentRealTime - lastWorldTickTime;
  const elapsedMinutes = elapsedMs / (1000 * 60);
  const turnsElapsed = Math.floor(elapsedMinutes / MINUTES_PER_TURN);

  if (turnsElapsed <= 0) {
    return { turnCount, gameTimeMinutes, dayCount };
  }

  const totalMinutesAdvanced = turnsElapsed * MINUTES_PER_TURN;
  const newGameTimeMinutes = (gameTimeMinutes + totalMinutesAdvanced) % 1440;
  const fullDaysPassed = (gameTimeMinutes + totalMinutesAdvanced) >= 1440;
  const newDayCount = dayCount + (fullDaysPassed ? Math.floor((gameTimeMinutes + totalMinutesAdvanced) / 1440) : 0);
  const newTurnCount = turnCount + turnsElapsed;

  return {
    turnCount: newTurnCount,
    gameTimeMinutes: newGameTimeMinutes,
    dayCount: newDayCount,
  };
}

export interface WorldTickCallbacks {
  onWorldTick?: (turnCount: number, gameTimeMinutes: number, dayCount: number) => void;
  getMissions: () => { mission_id: string; end_time: number }[];
  onMissionsProgress: (minutesElapsed: number) => void;
}

export function processWorldTick(
  callbacks: WorldTickCallbacks,
  params: WorldTickParams
): WorldTickStats {
  const stats = calculateWorldTicks(params);

  const turnsAdvanced = stats.turnCount - params.turnCount;
  if (turnsAdvanced > 0 && callbacks.onWorldTick) {
    callbacks.onWorldTick(stats.turnCount, stats.gameTimeMinutes, stats.dayCount);
  }

  const minutesElapsed = (params.currentRealTime - params.lastWorldTickTime) / (1000 * 60);
  callbacks.onMissionsProgress(minutesElapsed);

  return stats;
}

export function processResourceRespawn(
  params: {
    dayCount: number;
    worlds: Map<number, WorldData>;
    currentWorldId: number;
    turnCount?: number;
    gameTimeMinutes?: number;
  }
): void {
  const world = params.worlds.get(params.currentWorldId);
  if (!world) return;

  world.tiles.forEach(tile => {
    if (tile.resourceQty === undefined || tile.resourceQty >= RESOURCE_MAX_QTY) return;

    const resourceType = tile.resourceType;
    if (!resourceType) return;

    const respawnDay = tile.resourceRespawnTurn;
    if (respawnDay !== undefined && params.dayCount >= respawnDay) {
      tile.resourceQty = (tile.resourceQty || 0) + 1;
      if (tile.resourceQty < RESOURCE_MAX_QTY) {
        tile.resourceRespawnTurn = params.dayCount + getRespawnDays(resourceType);
      } else {
        tile.resourceRespawnTurn = undefined;
      }
      if (tile.resourceQty > 0) {
        worldEventBus.publish({
          type: 'ResourceSpawned',
          worldId: params.currentWorldId,
          x: tile.x,
          y: tile.y,
          resourceType,
          quantity: tile.resourceQty,
          gameTimeMinutes: params.gameTimeMinutes ?? 0,
          turnCount: params.turnCount ?? 0,
        });
      }
    }
  });
}

export function getTurnTime(currentRealTime: number, turnCount: number): number {
  return currentRealTime - (turnCount * MINUTES_PER_TURN * 60 * 1000);
}

export function getTimeUntilNextTurn(currentRealTime: number, lastWorldTickTime: number): number {
  const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
  const elapsed = currentRealTime - lastWorldTickTime;
  return Math.max(0, msPerTurn - (elapsed % msPerTurn));
}
