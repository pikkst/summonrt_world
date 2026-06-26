import type { ActiveMission, MissionStatus } from './missionQueue';
import type { MissionResult } from '../types/game';

export interface HeartbeatCallbacks {
  getCurrentTime: () => number;
  getMissions: () => ActiveMission[];
  removeMission: (missionId: string) => void;
  getMissionById: (missionId: string) => ActiveMission | undefined;
  resolveMissionCallbacks: {
    EXPLORE_TIER_1: (mission: ActiveMission) => void;
    SCOUT_DUNGEON: (mission: ActiveMission) => void;
    SMELT_ORE: (mission: ActiveMission) => void;
    CRAFT_ITEM: (mission: ActiveMission) => void;
    STORE_VISIT: (mission: ActiveMission) => void;
    TAX_EDICT: (mission: ActiveMission) => void;
    CARAVAN_ROUTE: (mission: ActiveMission) => void;
    SEARCH_AREA: (mission: ActiveMission) => void;
    GATHER_RESOURCE: (mission: ActiveMission) => void;
  };
}

export interface HeartbeatInstance {
  start: () => void;
  stop: () => void;
  tick: () => void;
}

export function createHeartbeat(callbacks: HeartbeatCallbacks): HeartbeatInstance {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const tick = (): void => {
    const now = callbacks.getCurrentTime();
    const missions = [...callbacks.getMissions()];

    for (const mission of missions) {
      if (now >= mission.end_time && mission.status === 'IN_PROGRESS') {
        resolveMission(mission, callbacks);
      }
    }
  };

  const start = (): void => {
    if (running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    running = false;
  };

  return { start, stop, tick };
}

export function resolveMission(
  mission: ActiveMission,
  callbacks: HeartbeatCallbacks
): MissionResult {
  const result: MissionResult = {
    victory: true,
    battle_log: [],
    rewards: [],
    xp: 0,
  };

  const callbackKey = mission.type as keyof typeof callbacks.resolveMissionCallbacks;
  const callback = callbacks.resolveMissionCallbacks[callbackKey];

  if (callback) {
    callback(mission);
  }

  callbacks.removeMission(mission.mission_id);

  return result;
}

export function updateMissionStatus(
  mission: ActiveMission,
  newStatus: MissionStatus
): ActiveMission {
  return { ...mission, status: newStatus };
}

export function processMissionResult(
  mission: ActiveMission,
  result: MissionResult
): { rewards: unknown[]; completed: boolean } {
  return {
    rewards: result.rewards,
    completed: result.victory,
  };
}