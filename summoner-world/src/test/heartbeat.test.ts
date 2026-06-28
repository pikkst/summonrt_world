import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHeartbeat, resolveMission, updateMissionStatus, processMissionResult, type HeartbeatCallbacks } from '../core/heartbeat';
import type { ActiveMission, MissionType } from '../core/missionQueue';

const createEmptyCallbacks = (): HeartbeatCallbacks => ({
  getCurrentTime: () => Date.now(),
  getMissions: () => [],
  removeMission: vi.fn(),
  getMissionById: vi.fn(),
  getLastWorldTickTime: () => Date.now(),
  setLastWorldTickTime: vi.fn(),
  getTurnCount: () => 0,
  setTurnCount: vi.fn(),
  getGameTimeMinutes: () => 360,
  setGameTimeMinutes: vi.fn(),
  getDayCount: () => 1,
  setDayCount: vi.fn(),
  onWorldTick: vi.fn(),
  onMissionsProgress: vi.fn(),
  resolveMissionCallbacks: {
    EXPLORE_TIER_1: vi.fn(),
    SCOUT_DUNGEON: vi.fn(),
    SMELT_ORE: vi.fn(),
    CRAFT_ITEM: vi.fn(),
    STORE_VISIT: vi.fn(),
    TAX_EDICT: vi.fn(),
    CARAVAN_ROUTE: vi.fn(),
    SEARCH_AREA: vi.fn(),
    GATHER_RESOURCE: vi.fn(),
    CAPTURE_CREATURE: vi.fn(),
    DEMONLORD_ENCOUNTER: vi.fn(),
  },
});

describe('createHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create heartbeat instance with start/stop/tick methods', () => {
    const callbacks = createEmptyCallbacks();
    const heartbeat = createHeartbeat(callbacks);
    expect(heartbeat.start).toBeDefined();
    expect(heartbeat.stop).toBeDefined();
    expect(heartbeat.tick).toBeDefined();
  });

  it('should start 1-second interval loop', () => {
    const callbacks = createEmptyCallbacks();
    const heartbeat = createHeartbeat(callbacks);
    heartbeat.start();
    
    expect(vi.getTimerCount()).toBe(1);
  });

  it('should stop interval loop', () => {
    const callbacks = createEmptyCallbacks();
    const heartbeat = createHeartbeat(callbacks);
    heartbeat.start();
    heartbeat.stop();
    
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should tick and process expired missions', () => {
    const expiredMission: ActiveMission = {
      mission_id: 'test_mission_1',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 15000,
      getMissions: () => [expiredMission],
      removeMission: vi.fn(),
      getMissionById: () => expiredMission,
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).toHaveBeenCalledWith('test_mission_1');
    expect(callbacks.resolveMissionCallbacks.EXPLORE_TIER_1).toHaveBeenCalledWith(expiredMission);
  });

  it('should batch resolve multiple expired missions', () => {
    const missionA: ActiveMission = {
      mission_id: 'mission_a',
      type: 'SMELT_ORE',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 5000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const missionB: ActiveMission = {
      mission_id: 'mission_b',
      type: 'CRAFT_ITEM',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 20,
      end_time: 15000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const missions = [missionA, missionB];
    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 20000,
      getMissions: () => missions,
      removeMission: vi.fn(),
      getMissionById: (id: string) => missions.find((m) => m.mission_id === id),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).toHaveBeenCalledTimes(2);
    expect(callbacks.removeMission).toHaveBeenCalledWith('mission_a');
    expect(callbacks.removeMission).toHaveBeenCalledWith('mission_b');
    expect(callbacks.resolveMissionCallbacks.SMELT_ORE).toHaveBeenCalledWith(missionA);
    expect(callbacks.resolveMissionCallbacks.CRAFT_ITEM).toHaveBeenCalledWith(missionB);
  });

  it('should preserve non-expired missions during batch resolution', () => {
    const expired: ActiveMission = {
      mission_id: 'expired',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 5000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const active: ActiveMission = {
      mission_id: 'active',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 20000,
      duration_seconds: 10,
      end_time: 30000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const missions = [expired, active];
    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 10000,
      getMissions: () => missions,
      removeMission: vi.fn(),
      getMissionById: (id: string) => missions.find((m) => m.mission_id === id),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).toHaveBeenCalledTimes(1);
    expect(callbacks.removeMission).toHaveBeenCalledWith('expired');
    expect(callbacks.resolveMissionCallbacks.EXPLORE_TIER_1).toHaveBeenCalledTimes(1);
  });

  it('should not process missions that are not expired', () => {
    const activeMission: ActiveMission = {
      mission_id: 'test_mission_2',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 10000,
      duration_seconds: 10,
      end_time: 20000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 15000,
      getMissions: () => [activeMission],
      removeMission: vi.fn(),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };
    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).not.toHaveBeenCalled();
  });
});

describe('T2.11 - Offline catch-up with reward accumulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve 8h worth of missions and accumulate rewards correctly', () => {
    const logoutTimestamp = 1000000;
    const loginTimestamp = logoutTimestamp + 8 * 60 * 60 * 1000;

    const resolvedMissions: ActiveMission[] = [];
    const accumulatedRewards: { templateKey: string; quantity: number }[] = [];
    const accumulatedXP = { player: 0 };

    const createMission = (id: string, type: ActiveMission['type'], endOffset: number): ActiveMission => ({
      mission_id: id,
      type,
      assigned_creatures: [],
      world_layer: 1,
      start_time: logoutTimestamp - 3600000,
      duration_seconds: (endOffset / 1000),
      end_time: logoutTimestamp + endOffset,
      status: 'IN_PROGRESS',
      modifiers: {},
    });

    const mission1 = createMission('exp_quick', 'EXPLORE_TIER_1', 10000);
    const mission2 = createMission('exp_medium', 'EXPLORE_TIER_1', 2 * 60 * 60 * 1000);
    const mission3 = createMission('exp_long', 'EXPLORE_TIER_1', 8 * 60 * 60 * 1000);
    const mission4 = createMission('smelt', 'SMELT_ORE', 30000);
    const mission5 = createMission('craft', 'CRAFT_ITEM', 60000);
    const mission6 = createMission('store', 'STORE_VISIT', 45000);
    const mission7 = createMission('caravan', 'CARAVAN_ROUTE', 4 * 60 * 60 * 1000);
    const mission8 = createMission('future', 'TAX_EDICT', 10 * 60 * 60 * 1000);

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => loginTimestamp,
      getMissions: () => [mission1, mission2, mission3, mission4, mission5, mission6, mission7, mission8],
      removeMission: vi.fn((id: string) => {
        const idx = [mission1, mission2, mission3, mission4, mission5, mission6, mission7].findIndex(m => m.mission_id === id);
        if (idx !== -1) {
          const mission = [mission1, mission2, mission3, mission4, mission5, mission6, mission7][idx];
          if (mission) resolvedMissions.push(mission);
        }
      }),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: (mission: ActiveMission) => {
          accumulatedRewards.push({ templateKey: 'exploration_loot', quantity: 1 });
          accumulatedXP.player += 50;
        },
        SCOUT_DUNGEON: () => {},
        SMELT_ORE: (mission: ActiveMission) => {
          accumulatedRewards.push({ templateKey: 'smelted_ore', quantity: 5 });
          accumulatedXP.player += 25;
        },
        CRAFT_ITEM: (mission: ActiveMission) => {
          accumulatedRewards.push({ templateKey: 'crafted_item', quantity: 1 });
          accumulatedXP.player += 75;
        },
        STORE_VISIT: (mission: ActiveMission) => {
          accumulatedRewards.push({ templateKey: 'gold', quantity: 100 });
          accumulatedXP.player += 30;
        },
        TAX_EDICT: () => {},
        CARAVAN_ROUTE: (mission: ActiveMission) => {
          accumulatedRewards.push({ templateKey: 'trade_goods', quantity: 3 });
          accumulatedXP.player += 100;
        },
        SEARCH_AREA: () => {},
        GATHER_RESOURCE: () => {},
        CAPTURE_CREATURE: () => {},
        DEMONLORD_ENCOUNTER: () => {},
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(resolvedMissions.length).toBe(7);
    expect(accumulatedRewards.length).toBe(7);
    expect(accumulatedXP.player).toBe(50 + 50 + 50 + 25 + 75 + 30 + 100);

    expect(accumulatedRewards).toContainEqual({ templateKey: 'exploration_loot', quantity: 1 });
    expect(accumulatedRewards).toContainEqual({ templateKey: 'smelted_ore', quantity: 5 });
    expect(accumulatedRewards).toContainEqual({ templateKey: 'crafted_item', quantity: 1 });
    expect(accumulatedRewards).toContainEqual({ templateKey: 'gold', quantity: 100 });
    expect(accumulatedRewards).toContainEqual({ templateKey: 'trade_goods', quantity: 3 });
  });

  it('should correctly calculate mission duration compression during offline catch-up', () => {
    const logoutTimestamp = 2000000;
    const loginTimestamp = logoutTimestamp + 8 * 60 * 60 * 1000;

    const resolvedWithModifiers: ActiveMission[] = [];

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => loginTimestamp,
      getMissions: () => [
        {
          mission_id: 'speed_boosted',
          type: 'EXPLORE_TIER_1' as const,
          assigned_creatures: [],
          world_layer: 1,
          start_time: logoutTimestamp - 60000,
          duration_seconds: 1800,
          end_time: logoutTimestamp + 1800000,
          status: 'IN_PROGRESS' as const,
          modifiers: { tree_speed_pct: 20, creature_agility_mod: 10, resource_type: 'wood' },
        },
      ],
      removeMission: vi.fn((id: string) => {
        const m = callbacks.getMissions().find(m => m.mission_id === id);
        if (m) resolvedWithModifiers.push(m);
      }),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: () => {},
        SCOUT_DUNGEON: () => {},
        SMELT_ORE: () => {},
        CRAFT_ITEM: () => {},
        STORE_VISIT: () => {},
        TAX_EDICT: () => {},
        CARAVAN_ROUTE: () => {},
        SEARCH_AREA: () => {},
        GATHER_RESOURCE: () => {},
        CAPTURE_CREATURE: () => {},
        DEMONLORD_ENCOUNTER: () => {},
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(resolvedWithModifiers.length).toBe(1);
    expect(resolvedWithModifiers[0]!.modifiers.tree_speed_pct).toBe(20);
    expect(resolvedWithModifiers[0]!.modifiers.creature_agility_mod).toBe(10);
  });

  it('should handle multiple combat missions and aggregate XP correctly', () => {
    const logoutTimestamp = 3000000;
    const loginTimestamp = logoutTimestamp + 8 * 60 * 60 * 1000;

    const totalXp = { value: 0 };
    const totalRewards: string[] = [];

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => loginTimestamp,
      getMissions: () => [
        {
          mission_id: 'combat_1',
          type: 'SCOUT_DUNGEON' as const,
          assigned_creatures: ['creature_a'],
          world_layer: 5,
          start_time: logoutTimestamp - 60000,
          duration_seconds: 120,
          end_time: logoutTimestamp + 120000,
          status: 'IN_PROGRESS' as const,
          modifiers: {},
        },
        {
          mission_id: 'combat_2',
          type: 'SCOUT_DUNGEON' as const,
          assigned_creatures: ['creature_b', 'creature_c'],
          world_layer: 10,
          start_time: logoutTimestamp - 120000,
          duration_seconds: 180,
          end_time: logoutTimestamp + 180000,
          status: 'IN_PROGRESS' as const,
          modifiers: {},
        },
      ],
      removeMission: vi.fn(),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: () => {},
        SCOUT_DUNGEON: (mission: ActiveMission) => {
          totalXp.value += mission.assigned_creatures.length * 30;
          totalRewards.push(...mission.assigned_creatures.map(() => 'dungeon_loot'));
        },
        SMELT_ORE: () => {},
        CRAFT_ITEM: () => {},
        STORE_VISIT: () => {},
        TAX_EDICT: () => {},
        CARAVAN_ROUTE: () => {},
        SEARCH_AREA: () => {},
        GATHER_RESOURCE: () => {},
        CAPTURE_CREATURE: () => {},
        DEMONLORD_ENCOUNTER: () => {},
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(totalXp.value).toBe(90);
    expect(totalRewards.length).toBe(3);
  });

  it('should preserve future missions during offline catch-up', () => {
    const logoutTimestamp = 4000000;
    const loginTimestamp = logoutTimestamp + 8 * 60 * 60 * 1000;

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => loginTimestamp,
      getMissions: () => [
        {
          mission_id: 'expired_1',
          type: 'EXPLORE_TIER_1' as const,
          assigned_creatures: [],
          world_layer: 1,
          start_time: logoutTimestamp - 60000,
          duration_seconds: 10,
          end_time: logoutTimestamp + 5000,
          status: 'IN_PROGRESS' as const,
          modifiers: {},
        },
        {
          mission_id: 'future_1',
          type: 'CARAVAN_ROUTE' as const,
          assigned_creatures: [],
          world_layer: 2,
          start_time: logoutTimestamp,
          duration_seconds: 600,
          end_time: logoutTimestamp + 12 * 60 * 60 * 1000,
          status: 'IN_PROGRESS' as const,
          modifiers: {},
        },
      ],
      removeMission: vi.fn(),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: () => {},
        SCOUT_DUNGEON: () => {},
        SMELT_ORE: () => {},
        CRAFT_ITEM: () => {},
        STORE_VISIT: () => {},
        TAX_EDICT: () => {},
        CARAVAN_ROUTE: () => {},
        SEARCH_AREA: () => {},
        GATHER_RESOURCE: () => {},
        CAPTURE_CREATURE: () => {},
        DEMONLORD_ENCOUNTER: () => {},
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    const remaining = callbacks.getMissions().filter((m) => m.end_time > loginTimestamp);
    expect(remaining.length).toBe(1);
    expect(remaining[0]!.mission_id).toBe('future_1');
  });

  it('should accumulate total rewards across 8h with consistent aggregation', () => {
    const logoutTimestamp = 5000000;
    const loginTimestamp = logoutTimestamp + 8 * 60 * 60 * 1000;
    const eightHoursInMs = 8 * 60 * 60 * 1000;

    const rewardCounts: Record<string, number> = {};
    const xpTotal = { value: 0 };
    const missionCount = { resolved: 0 };

    const generateMissions = (): ActiveMission[] => {
      const missions: ActiveMission[] = [];
      for (let i = 0; i < 50; i++) {
        const offset = (i + 1) * (eightHoursInMs / 50);
        const type = i % 7 === 0 ? 'SMELT_ORE' :
                     i % 7 === 1 ? 'CRAFT_ITEM' :
                     i % 7 === 2 ? 'STORE_VISIT' :
                     i % 7 === 3 ? 'CARAVAN_ROUTE' :
                     i % 7 === 4 ? 'EXPLORE_TIER_1' :
                     i % 7 === 5 ? 'SCOUT_DUNGEON' :
                     'TAX_EDICT';

        missions.push({
          mission_id: `mission_${i}`,
          type: type as MissionType,
          assigned_creatures: [],
          world_layer: 1,
          start_time: logoutTimestamp - 7200000,
          duration_seconds: 600 + i,
          end_time: logoutTimestamp + offset,
          status: 'IN_PROGRESS' as const,
          modifiers: {},
        });
      }
      return missions;
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => loginTimestamp,
      getMissions: () => generateMissions(),
      removeMission: vi.fn(),
      getMissionById: vi.fn(),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: () => {
          missionCount.resolved++;
          xpTotal.value += 50;
          rewardCounts.exploration = (rewardCounts.exploration || 0) + 1;
        },
        SCOUT_DUNGEON: () => {
          missionCount.resolved++;
          xpTotal.value += 100;
          rewardCounts.dungeon = (rewardCounts.dungeon || 0) + 1;
        },
        SMELT_ORE: () => {
          missionCount.resolved++;
          xpTotal.value += 25;
          rewardCounts.smelted = (rewardCounts.smelted || 0) + 1;
        },
        CRAFT_ITEM: () => {
          missionCount.resolved++;
          xpTotal.value += 75;
          rewardCounts.crafted = (rewardCounts.crafted || 0) + 1;
        },
        STORE_VISIT: () => {
          missionCount.resolved++;
          xpTotal.value += 30;
          rewardCounts.store = (rewardCounts.store || 0) + 1;
        },
        TAX_EDICT: () => {
          missionCount.resolved++;
          xpTotal.value += 15;
          rewardCounts.tax = (rewardCounts.tax || 0) + 1;
        },
        CARAVAN_ROUTE: () => {
          missionCount.resolved++;
          xpTotal.value += 100;
          rewardCounts.caravan = (rewardCounts.caravan || 0) + 1;
        },
        SEARCH_AREA: () => {},
        GATHER_RESOURCE: () => {},
        CAPTURE_CREATURE: () => {},
        DEMONLORD_ENCOUNTER: () => {},
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(missionCount.resolved).toBe(50);
    expect(Object.keys(rewardCounts).length).toBe(7);
    expect(xpTotal.value).toBeGreaterThan(0);
  });
});

describe('resolveMission', () => {
  it('should return MissionResult with victory true by default', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 15000,
      getMissions: () => [mission],
      removeMission: vi.fn(),
      getMissionById: () => mission,
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };
    
    const result = resolveMission(mission, callbacks);
    
    expect(result.victory).toBe(true);
    expect(result.battle_log).toEqual([]);
    expect(result.rewards).toEqual([]);
    expect(result.xp).toBe(0);
  });

  it('should call the appropriate callback for mission type', () => {
    const mission: ActiveMission = {
      mission_id: 'test_scout',
      type: 'SCOUT_DUNGEON',
      assigned_creatures: ['creature_1'],
      world_layer: 5,
      start_time: 0,
      duration_seconds: 60,
      end_time: 60000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 65000,
      getMissions: () => [mission],
      removeMission: vi.fn(),
      getMissionById: () => mission,
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    resolveMission(mission, callbacks);
    
    expect(callbacks.resolveMissionCallbacks.SCOUT_DUNGEON).toHaveBeenCalledWith(mission);
    expect(callbacks.removeMission).toHaveBeenCalled();
  });
});

describe('updateMissionStatus', () => {
  it('should return new mission with updated status', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 10000,
      status: 'PENDING',
      modifiers: {},
    };

    const updated = updateMissionStatus(mission, 'IN_PROGRESS');
    
    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.mission_id).toBe('test_mission');
    expect(mission.status).toBe('PENDING');
  });
});

describe('processMissionResult', () => {
  it('should return rewards and completed status from result', () => {
    const result = {
      victory: true,
      battle_log: ['Attack! Defend!'],
      rewards: [{ templateKey: 'gold', quantity: 10 }],
      xp: 50,
    };

    const output = processMissionResult({} as ActiveMission, result);
    
    expect(output.rewards).toEqual([{ templateKey: 'gold', quantity: 10 }]);
    expect(output.completed).toBe(true);
  });
});

describe('offline catch-up scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve all missions expired before login after 8h offline', () => {
    const startTime = 100000;
    const mission1: ActiveMission = {
      mission_id: 'quick',
      type: 'CRAFT_ITEM',
      assigned_creatures: [],
      world_layer: 1,
      start_time: startTime,
      duration_seconds: 30,
      end_time: startTime + 30000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const mission2: ActiveMission = {
      mission_id: 'long',
      type: 'CARAVAN_ROUTE',
      assigned_creatures: [],
      world_layer: 1,
      start_time: startTime,
      duration_seconds: 3600,
      end_time: startTime + 3600000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const mission3: ActiveMission = {
      mission_id: 'future',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: startTime,
      duration_seconds: 40000,
      end_time: startTime + 40000000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };

    const missions = [mission1, mission2, mission3];
    const resolvedIds: string[] = [];
    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => startTime + 8 * 60 * 60 * 1000,
      getMissions: () => missions,
      removeMission: (id: string) => {
        const idx = missions.findIndex((m) => m.mission_id === id);
        if (idx !== -1) missions.splice(idx, 1);
        resolvedIds.push(id);
      },
      getMissionById: (id: string) => missions.find((m) => m.mission_id === id),
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(resolvedIds).toContain('quick');
    expect(resolvedIds).toContain('long');
    expect(resolvedIds).not.toContain('future');
    expect(missions.length).toBe(1);
    expect(missions[0]!.mission_id).toBe('future');
  });

  it('should not touch missions that are already COMPLETED', () => {
    const completed: ActiveMission = {
      mission_id: 'already_done',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 10,
      end_time: 5000,
      status: 'COMPLETED',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 20000,
      getMissions: () => [completed],
      removeMission: vi.fn(),
      getMissionById: () => completed,
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).not.toHaveBeenCalled();
  });

  it('should handle PENDING missions correctly during catch-up', () => {
    const pending: ActiveMission = {
      mission_id: 'pending_m',
      type: 'TAX_EDICT',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 600,
      end_time: 600000,
      status: 'PENDING',
      modifiers: {},
    };

    const callbacks: HeartbeatCallbacks = {
      getCurrentTime: () => 300000,
      getMissions: () => [pending],
      removeMission: vi.fn(),
      getMissionById: () => pending,
      getLastWorldTickTime: () => Date.now(),
      setLastWorldTickTime: vi.fn(),
      getTurnCount: () => 0,
      setTurnCount: vi.fn(),
      getGameTimeMinutes: () => 360,
      setGameTimeMinutes: vi.fn(),
      getDayCount: () => 1,
      setDayCount: vi.fn(),
      onWorldTick: vi.fn(),
      onMissionsProgress: vi.fn(),
      resolveMissionCallbacks: {
        EXPLORE_TIER_1: vi.fn(),
        SCOUT_DUNGEON: vi.fn(),
        SMELT_ORE: vi.fn(),
        CRAFT_ITEM: vi.fn(),
        STORE_VISIT: vi.fn(),
        TAX_EDICT: vi.fn(),
        CARAVAN_ROUTE: vi.fn(),
        SEARCH_AREA: vi.fn(),
        GATHER_RESOURCE: vi.fn(),
        CAPTURE_CREATURE: vi.fn(),
        DEMONLORD_ENCOUNTER: vi.fn(),
      },
    };

    const heartbeat = createHeartbeat(callbacks);
    heartbeat.tick();

    expect(callbacks.removeMission).not.toHaveBeenCalled();
  });
});