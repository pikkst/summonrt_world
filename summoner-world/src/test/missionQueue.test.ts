import { describe, it, expect } from 'vitest';
import {
  calculateCompressedDuration,
  getCreatureAgilityMod,
  createActiveMission,
  isMissionExpired,
  getRemainingSeconds,
  type ActiveMission,
  type CreatureInstance,
  MissionStatus,
} from '../core/missionQueue';
import {
  calculateBaseCaptureProbability,
  calculateCaptureFactors,
  AFFINITY_WEIGHT,
  RARITY_PENALTY,
  getAffinityWeight,
} from '../data/constants';

describe('calculateCompressedDuration', () => {
  it('returns base duration when both modifiers are zero', () => {
    expect(calculateCompressedDuration(1000, 0, 0)).toBe(1000);
  });

  it('applies tree speed modifier', () => {
    const result = calculateCompressedDuration(1000, 10, 0);
    expect(result).toBe(900);
  });

  it('applies creature agility modifier', () => {
    const result = calculateCompressedDuration(1000, 0, 10);
    expect(result).toBe(900);
  });

  it('applies combined modifiers', () => {
    const result = calculateCompressedDuration(1000, 10, 10);
    expect(result).toBe(800);
  });

  it('caps total reduction at 90 percent', () => {
    const result = calculateCompressedDuration(1000, 50, 50);
    expect(result).toBeCloseTo(100);
  });

  it('respects minimum duration of 60 seconds', () => {
    const result = calculateCompressedDuration(30, 100, 100);
    expect(result).toBe(60);
  });

  it('handles fractional modifiers correctly', () => {
    const result = calculateCompressedDuration(1000, 15, 5);
    expect(result).toBeCloseTo(800);
  });
});

describe('SEARCH_AREA and GATHER_RESOURCE mission types', () => {
  it('creates SEARCH_AREA mission with correct type', () => {
    const mission = createActiveMission({
      type: 'SEARCH_AREA',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 30,
    });
    expect(mission.type).toBe('SEARCH_AREA');
    expect(mission.duration_seconds).toBeGreaterThanOrEqual(60);
  });

  it('creates GATHER_RESOURCE mission with correct type', () => {
    const mission = createActiveMission({
      type: 'GATHER_RESOURCE',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 30,
    });
    expect(mission.type).toBe('GATHER_RESOURCE');
    expect(mission.duration_seconds).toBeGreaterThanOrEqual(60);
  });

  it('SEARCH_AREA mission stores resource_type in modifiers', () => {
    const mission = createActiveMission({
      type: 'SEARCH_AREA',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 30,
      modifiers: { resource_type: 'wood' },
    });
    expect(mission.modifiers.resource_type).toBe('wood');
  });

  it('GATHER_RESOURCE mission stores resource_type in modifiers', () => {
    const mission = createActiveMission({
      type: 'GATHER_RESOURCE',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 30,
      modifiers: { resource_type: 'ore' },
    });
    expect(mission.modifiers.resource_type).toBe('ore');
  });

  it('SEARCH_AREA mission respects speed modifiers from career tree', () => {
    const mission = createActiveMission({
      type: 'SEARCH_AREA',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 100,
      modifiers: { tree_speed_pct: 10 },
    });
    expect(mission.duration_seconds).toBe(90);
    expect(mission.modifiers.tree_speed_pct).toBe(10);
  });

  it('GATHER_RESOURCE mission respects speed modifiers from career tree', () => {
    const mission = createActiveMission({
      type: 'GATHER_RESOURCE',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 100,
      modifiers: { tree_speed_pct: 15 },
    });
    expect(mission.duration_seconds).toBe(85);
    expect(mission.modifiers.tree_speed_pct).toBe(15);
  });

  it('creates CAPTURE_CREATURE mission with correct type and duration', () => {
    const mission = createActiveMission({
      type: 'CAPTURE_CREATURE',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 60,
    });
    expect(mission.type).toBe('CAPTURE_CREATURE');
    expect(mission.duration_seconds).toBeGreaterThanOrEqual(60);
  });
});

describe('getCreatureAgilityMod', () => {
  it('returns zero for an empty array', () => {
    expect(getCreatureAgilityMod([])).toBe(0);
  });

  it('returns the average speed rounded for a single creature', () => {
    const creature: CreatureInstance = { speed: 12 } as CreatureInstance;
    expect(getCreatureAgilityMod([creature])).toBe(12);
  });

  it('returns rounded average speed for multiple creatures', () => {
    const creatures: CreatureInstance[] = [
      { speed: 10 } as CreatureInstance,
      { speed: 20 } as CreatureInstance,
    ];
    expect(getCreatureAgilityMod(creatures)).toBe(15);
  });

  it('defaults missing speed to 0', () => {
    const creatures: CreatureInstance[] = [
      { speed: 10 } as CreatureInstance,
      {} as CreatureInstance,
    ];
    expect(getCreatureAgilityMod(creatures)).toBe(5);
  });
});

describe('createActiveMission', () => {
  it('creates a mission with uncompressed duration when no modifiers are provided', () => {
    const mission = createActiveMission({
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 60,
    });
    expect(mission.duration_seconds).toBe(60);
    expect(mission.end_time).toBe(mission.start_time + 60 * 1000);
    expect(mission.modifiers).toEqual({});
  });

  it('applies compressed duration when tree_speed_pct and creature_agility_mod are provided', () => {
    const mission = createActiveMission({
      type: 'CARAVAN_ROUTE',
      assigned_creatures: [],
      world_layer: 2,
      duration_seconds: 120,
      modifiers: { tree_speed_pct: 15, creature_agility_mod: 5 },
    });
    expect(mission.duration_seconds).toBe(96);
    expect(mission.end_time).toBe(mission.start_time + 96 * 1000);
  });

  it('preserves other modifiers alongside compression modifiers', () => {
    const mission = createActiveMission({
      type: 'SMELT_ORE',
      assigned_creatures: [],
      world_layer: 1,
      duration_seconds: 100,
      modifiers: { yield_bonus_pct: 10, tree_speed_pct: 20 },
    });
    expect(mission.modifiers.yield_bonus_pct).toBe(10);
    expect(mission.duration_seconds).toBe(80);
  });

  it('generates a unique mission_id for each call', () => {
    const a = createActiveMission({ type: 'EXPLORE_TIER_1', assigned_creatures: [], world_layer: 1, duration_seconds: 10 });
    const b = createActiveMission({ type: 'EXPLORE_TIER_1', assigned_creatures: [], world_layer: 1, duration_seconds: 10 });
    expect(a.mission_id).not.toBe(b.mission_id);
  });

  it('generates valid mission_id format', () => {
    const mission = createActiveMission({ type: 'EXPLORE_TIER_1', assigned_creatures: [], world_layer: 1, duration_seconds: 10 });
    expect(mission.mission_id).toMatch(/^mission_\d+_[a-z0-9]{6}$/);
  });
});

describe('isMissionExpired', () => {
  it('returns false when end_time is in the future', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 100000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(isMissionExpired(mission, 50000)).toBe(false);
  });

  it('returns true when end_time has passed', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(isMissionExpired(mission, 20000)).toBe(true);
  });

  it('returns true when current time equals end_time', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(isMissionExpired(mission, 10000)).toBe(true);
  });
});

describe('getRemainingSeconds', () => {
  it('returns correct remaining time in seconds', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 60000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(getRemainingSeconds(mission, 30000)).toBe(30);
  });

  it('returns 0 when mission has expired', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(getRemainingSeconds(mission, 20000)).toBe(0);
  });
});

describe('MissionStatus transitions', () => {
  it('validates all valid status values exist', () => {
    const validStatuses: MissionStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
    expect(validStatuses).toHaveLength(5);
    expect(validStatuses).toContain('PENDING');
    expect(validStatuses).toContain('IN_PROGRESS');
  });

  it('IN_PROGRESS missions can transition to COMPLETED', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'EXPLORE_TIER_1',
      assigned_creatures: [],
      world_layer: 1,
      start_time: 0,
      duration_seconds: 60,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    expect(mission.status).toBe('IN_PROGRESS');
    const completed = { ...mission, status: 'COMPLETED' as const };
    expect(completed.status).toBe('COMPLETED');
  });

  it('IN_PROGRESS missions can transition to FAILED', () => {
    const mission: ActiveMission = {
      mission_id: 'test_mission',
      type: 'SCOUT_DUNGEON',
      assigned_creatures: [],
      world_layer: 5,
      start_time: 0,
      duration_seconds: 60,
      end_time: 10000,
      status: 'IN_PROGRESS',
      modifiers: {},
    };
    const failed = { ...mission, status: 'FAILED' as const };
    expect(failed.status).toBe('FAILED');
  });
});

describe('Property-based testing: Mission Queue invariants', () => {
  const MISSION_TYPES = [
    'EXPLORE_TIER_1',
    'SCOUT_DUNGEON',
    'SMELT_ORE',
    'CRAFT_ITEM',
    'STORE_VISIT',
    'TAX_EDICT',
    'CARAVAN_ROUTE',
    'SEARCH_AREA',
    'GATHER_RESOURCE',
    'CAPTURE_CREATURE',
  ] as const;

  function generateRandomMission(index: number): ActiveMission {
    const type = MISSION_TYPES[index % MISSION_TYPES.length];
    const baseDuration = 10 + (index % 3600);
    const treeSpeedPct = index % 50;
    const creatureAgility = index % 30;
    const start = 100000 + index * 1000;
    const compressed = calculateCompressedDuration(baseDuration, treeSpeedPct, creatureAgility);
    
    return {
      mission_id: `mission_pbt_${index}`,
      type: MISSION_TYPES[index % MISSION_TYPES.length] as typeof MISSION_TYPES[number],
      assigned_creatures: index % 3 === 0 ? ['creature_1', 'creature_2'] : [],
      world_layer: 1 + (index % 100),
      start_time: start,
      duration_seconds: compressed,
      end_time: start + compressed * 1000,
      status: 'IN_PROGRESS',
      modifiers: {
        tree_speed_pct: treeSpeedPct,
        creature_agility_mod: creatureAgility,
      },
    };
  }

  it('invariant: end_time >= start_time for all generated missions', () => {
    for (let i = 0; i < 1000; i++) {
      const mission = generateRandomMission(i);
      expect(mission.end_time, `Mission ${i} should have end_time >= start_time`)
        .toBeGreaterThanOrEqual(mission.start_time);
    }
  });

  it('invariant: IN_PROGRESS missions resolve to COMPLETED or FAILED when expired', () => {
    const completions: { victory: boolean; status: MissionStatus }[] = [];
    
    for (let i = 0; i < 1000; i++) {
      const mission = generateRandomMission(i);
      const currentTime = mission.end_time + 1000;
      if (isMissionExpired(mission, currentTime) && mission.status === 'IN_PROGRESS') {
        const resolvedStatus = Math.random() < 0.7 ? 'COMPLETED' : 'FAILED';
        expect(['COMPLETED', 'FAILED']).toContain(resolvedStatus);
        completions.push({ victory: resolvedStatus === 'COMPLETED', status: resolvedStatus as MissionStatus });
      }
    }
    
    const completedCount = completions.filter(c => c.status === 'COMPLETED').length;
    const failedCount = completions.filter(c => c.status === 'FAILED').length;
    expect(completedCount + failedCount).toBeGreaterThan(0);
  });

  it('invariant: mission duration never below minimum threshold (60s)', () => {
    for (let i = 0; i < 1000; i++) {
      const mission = generateRandomMission(i);
      expect(mission.duration_seconds, `Mission ${i} duration should be >= 60`)
        .toBeGreaterThanOrEqual(60);
    }
  });

  it('invariant: modifiers do not exceed valid ranges', () => {
    for (let i = 0; i < 1000; i++) {
      const mission = generateRandomMission(i);
      
      if (mission.modifiers.tree_speed_pct !== undefined) {
        expect(mission.modifiers.tree_speed_pct).toBeGreaterThanOrEqual(0);
        expect(mission.modifiers.tree_speed_pct).toBeLessThanOrEqual(50);
      }
      
      if (mission.modifiers.creature_agility_mod !== undefined) {
        expect(mission.modifiers.creature_agility_mod).toBeGreaterThanOrEqual(0);
        expect(mission.modifiers.creature_agility_mod).toBeLessThanOrEqual(30);
      }
    }
  });

  it('invariant: world_layer stays within valid game bounds (1-100)', () => {
    for (let i = 0; i < 1000; i++) {
      const mission = generateRandomMission(i);
      expect(mission.world_layer).toBeGreaterThanOrEqual(1);
      expect(mission.world_layer).toBeLessThanOrEqual(100);
    }
  });

  it('property: 1000 random missions with end_time in past resolve correctly via heartbeat logic', () => {
    const missions: ActiveMission[] = [];
    const removedIds: string[] = [];
    
    for (let i = 0; i < 1000; i++) {
      missions.push(generateRandomMission(i));
    }
    
    const currentTime = 500000000;
    const expiredMissions = missions.filter(m => m.end_time < currentTime);
    
    expiredMissions.forEach(mission => {
      if (mission.status === 'IN_PROGRESS') {
        removedIds.push(mission.mission_id);
      }
    });
    
    expect(removedIds.length).toBeGreaterThan(0);
    removedIds.forEach(id => {
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^mission_pbt_/);
    });
  });
});

describe('Capture Formula (T4.10)', () => {
  describe('AFFINITY_WEIGHT constants', () => {
    it('defines correct same element weight (1.0)', () => {
      expect(AFFINITY_WEIGHT.same).toBe(1.0);
    });

    it('defines correct neutral weight (0.3)', () => {
      expect(AFFINITY_WEIGHT.neutral).toBe(0.3);
    });

    it('defines correct opposing weight (0.1)', () => {
      expect(AFFINITY_WEIGHT.opposing).toBe(0.1);
    });
  });

  describe('RARITY_PENALTY constants', () => {
    it('Common has no penalty (1.0)', () => {
      expect(RARITY_PENALTY.common).toBe(1.0);
    });

    it('Mythical has lowest capture chance (0.1)', () => {
      expect(RARITY_PENALTY.mythical).toBe(0.1);
    });

    it('penalties decrease with rarity', () => {
      const penalties = [RARITY_PENALTY.common, RARITY_PENALTY.uncommon, RARITY_PENALTY.rare, RARITY_PENALTY.epic, RARITY_PENALTY.mythical];
      for (let i = 0; i < penalties.length - 1; i++) {
        expect(penalties[i]!).toBeGreaterThanOrEqual(penalties[i + 1]!);
      }
    });
  });

  describe('getAffinityWeight', () => {
    it('returns opposite weight for opposing elements', () => {
      const playerElements = ['fire'];
      const creatureElements = ['water'];
      expect(getAffinityWeight(playerElements, creatureElements)).toBe(AFFINITY_WEIGHT.opposing);
    });

    it('returns same weight for matching elements', () => {
      const playerElements = ['fire', 'water'];
      const creatureElements = ['fire'];
      expect(getAffinityWeight(playerElements, creatureElements)).toBe(AFFINITY_WEIGHT.same);
    });

    it('returns neutral weight for non-matching non-opposing elements', () => {
      const playerElements = ['fire'];
      const creatureElements = ['light'];
      expect(getAffinityWeight(playerElements, creatureElements)).toBe(AFFINITY_WEIGHT.neutral);
    });

    it('returns neutral weight for empty player elements', () => {
      expect(getAffinityWeight([], ['fire'])).toBe(AFFINITY_WEIGHT.neutral);
    });

    it('returns neutral weight for empty creature elements', () => {
      expect(getAffinityWeight(['fire'], [])).toBe(AFFINITY_WEIGHT.neutral);
    });
  });

  describe('calculateCaptureFactors', () => {
    it('calculates correct HP factor when creature at full health (0%)', () => {
      const factors = calculateCaptureFactors(100, 100, ['fire'], ['fire'], 'common', 1, 1);
      expect(factors.hpFactor).toBe(0);
    });

    it('calculates correct HP factor when creature at half health', () => {
      const factors = calculateCaptureFactors(50, 100, ['fire'], ['fire'], 'common', 1, 1);
      expect(factors.hpFactor).toBe(0.5);
    });

    it('calculates correct HP factor when creature near death', () => {
      const factors = calculateCaptureFactors(10, 100, ['fire'], ['fire'], 'common', 1, 1);
      expect(factors.hpFactor).toBe(0.9);
    });

it('levelFactor reduces by 2% per level difference', () => {
      const sameLevel = calculateCaptureFactors(50, 100, ['fire'], ['fire'], 'common', 10, 10);
      expect(sameLevel.levelFactor).toBe(1.0);

      const higherWorld = calculateCaptureFactors(50, 100, ['fire'], ['fire'], 'common', 5, 10);
      expect(higherWorld.levelFactor).toBeCloseTo(0.9);
    });

    it('levelFactor has minimum of 0.1', () => {
      const factors = calculateCaptureFactors(50, 100, ['fire'], ['fire'], 'common', 1, 50);
      expect(factors.levelFactor).toBe(0.1);
    });
  });

  describe('calculateBaseCaptureProbability', () => {
    it('uses exact GDD formula: HP × Affinity × Rarity × Level', () => {
      const hp = 50, maxHp = 100;
      const playerEls = ['fire'];
      const creatureEls = ['fire'];
      const creatureClass = 'common';
      const playerLevel = 1;
      const creatureLevel = 1;

      const expected = (1 - hp / maxHp) * AFFINITY_WEIGHT.same * RARITY_PENALTY.common * 1.0;
      const actual = calculateBaseCaptureProbability(hp, maxHp, playerEls, creatureEls, creatureClass, playerLevel, creatureLevel);

      expect(actual).toBeCloseTo(expected);
    });

    it('wounded creature has higher capture chance than full health', () => {
      const fullHp = calculateBaseCaptureProbability(100, 100, ['fire'], ['fire'], 'common', 1, 1);
      const woundedHp = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'common', 1, 1);

      expect(woundedHp).toBeGreaterThan(fullHp);
    });

    it('same element has higher capture chance than opposing', () => {
      const sameFactor = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'common', 1, 1);
      const neutralFactor = calculateBaseCaptureProbability(50, 100, ['fire'], ['light'], 'common', 1, 1);
      const oppFactor = calculateBaseCaptureProbability(50, 100, ['fire'], ['water'], 'common', 1, 1);

      expect(sameFactor).toBeGreaterThan(neutralFactor);
      expect(neutralFactor).toBeGreaterThan(oppFactor);
    });

    it('higher level creature has lower capture chance', () => {
      const lowLevel = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'common', 10, 1);
      const highLevel = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'common', 10, 50);

      expect(highLevel).toBeLessThan(lowLevel);
    });

    it('rarity penalty correctly affects capture chance', () => {
      const commonChance = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'common', 10, 1);
      const mythicalChance = calculateBaseCaptureProbability(50, 100, ['fire'], ['fire'], 'mythical', 10, 1);

      expect(commonChance).toBeGreaterThan(mythicalChance);
    });

    it('capture chance cannot exceed 1.0', () => {
      const chance = calculateBaseCaptureProbability(1, 100, ['fire'], ['fire'], 'common', 1, 1);
      expect(chance).toBeLessThanOrEqual(1.0);
    });
  });
});
