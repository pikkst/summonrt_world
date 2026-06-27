export const MINUTES_PER_TURN = 6;
export const TURNS_PER_DAY = 1440 / MINUTES_PER_TURN;

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
  onWorldTick: (turnCount: number, gameTimeMinutes: number, dayCount: number) => void;
  getMissions: () => { mission_id: string; end_time: number }[];
  onMissionsProgress: (minutesElapsed: number) => void;
}

export function processWorldTick(
  callbacks: WorldTickCallbacks,
  params: WorldTickParams
): WorldTickStats {
  const stats = calculateWorldTicks(params);

  const turnsAdvanced = stats.turnCount - params.turnCount;
  if (turnsAdvanced > 0) {
    callbacks.onWorldTick(stats.turnCount, stats.gameTimeMinutes, stats.dayCount);
  }

  const minutesElapsed = (params.currentRealTime - params.lastWorldTickTime) / (1000 * 60);
  callbacks.onMissionsProgress(minutesElapsed);

  return stats;
}

export interface EcosystemState {
  overhuntingActive: boolean;
  overhuntingTurnsRemaining: number;
  baselineResourceLevel: number;
}

export interface EcosystemUpdate {
  overhuntingActive: boolean;
  overhuntingTurnsRemaining: number;
  biomeShifted?: boolean;
  sanctuaryTriggered?: boolean;
}

export const ECOSYSTEM_BASELINE_THRESHOLD = 0.1;
export const BIOME_SHIFT_THRESHOLD = 0.1;

export function updateEcosystem(
  params: {
    turnCount: number;
    worlds: Map<number, { tiles: Map<string, { resourceQty?: number; resourceRespawnTurn?: number }> }>;
    currentWorldId: number;
    ecosystem: EcosystemState;
  }
): EcosystemUpdate {
  const { turnCount, worlds, currentWorldId, ecosystem } = params;
  let overhuntingActive = ecosystem.overhuntingActive;
  let overhuntingTurnsRemaining = ecosystem.overhuntingTurnsRemaining;
  let sanctuaryTriggered = false;
  let biomeShifted = false;

  if (overhuntingActive && overhuntingTurnsRemaining > 0) {
    overhuntingTurnsRemaining--;
    if (overhuntingTurnsRemaining <= 0) {
      overhuntingActive = false;
    }
  }

  const world = worlds.get(currentWorldId);
  if (world) {
    let totalResourceQty = 0;
    let tileCount = 0;

    world.tiles.forEach(tile => {
      totalResourceQty += tile.resourceQty ?? 0;
      tileCount++;
    });

    const averageResource = tileCount > 0 ? totalResourceQty / tileCount : 1;
    const baselineRatio = averageResource / 5;

    if (baselineRatio < ECOSYSTEM_BASELINE_THRESHOLD && !overhuntingActive) {
      sanctuaryTriggered = true;
      overhuntingActive = true;
      overhuntingTurnsRemaining = 180;
    }

    world.tiles.forEach(tile => {
      if (tile.resourceQty !== undefined && tile.resourceQty < 5) {
        if (tile.resourceRespawnTurn === undefined || turnCount >= tile.resourceRespawnTurn) {
          const rng = Math.random();
          if (rng < 0.05) {
            tile.resourceQty = (tile.resourceQty || 0) + 1;
            tile.resourceRespawnTurn = turnCount + 30 + Math.floor(Math.random() * 60);
          }
        }
      }
    });
  }

  return {
    overhuntingActive,
    overhuntingTurnsRemaining,
    biomeShifted,
    sanctuaryTriggered,
  };
}

export function getTurnTime(currentRealTime: number, turnCount: number): number {
  return currentRealTime - (turnCount * MINUTES_PER_TURN * 60 * 1000);
}

export function getTimeUntilNextTurn(currentRealTime: number, lastWorldTickTime: number): number {
  const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
  const elapsed = currentRealTime - lastWorldTickTime;
  return Math.max(0, msPerTurn - (elapsed % msPerTurn));
}