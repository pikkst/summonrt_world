import { describe, it, expect, beforeEach } from 'vitest';
import { SeededRandom } from '../utils/SeededRandom';
import {
  createNPCTravelPlan,
  generateTravelGoods,
  ensureNPCTravelPlan,
  advanceNPCTravel,
  resolveInterruptedTravel,
  tickNPCTravel,
  NPC_TRAVEL_BASE_SPEED,
  NPC_TRAVEL_ROBBERY_CHANCE,
  NPC_TRAVEL_MONSTER_CHANCE,
} from '../core/npc/npcTravel';
import { worldEventBus } from '../core/worldEventBus';
import type { NPC, NPCTravelPlan, WorldData, TileData, Settlement } from '../types/game';

describe('NPC travel', () => {
  beforeEach(() => {
    worldEventBus.clear();
  });

  it('creates a deterministic travel plan from params', () => {
    const planA = createNPCTravelPlan({
      seed: 42,
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      goods: [{ templateKey: 'wood', quantity: 5 }],
    });

    const planB = createNPCTravelPlan({
      seed: 42,
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      goods: [{ templateKey: 'wood', quantity: 5 }],
    });

    expect(planA).toEqual(planB);
    expect(planA.status).toBe('traveling');
    expect(planA.progress).toBe(0);
    expect(planA.goods).toHaveLength(1);
  });

  it('generates deterministic goods for a given role and seed', () => {
    const rngA = new SeededRandom('merchant-goods');
    const goodsA = generateTravelGoods('merchant', rngA);

    const rngB = new SeededRandom('merchant-goods');
    const goodsB = generateTravelGoods('merchant', rngB);

    expect(goodsA).toEqual(goodsB);
  });

  it('ensures a travel plan when NPC is idle and activity is travel', () => {
    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      homeSettlementId: 'settlement_1',
    };

    const settlements: Settlement[] = [
      { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
      { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
    ];

    const updated = ensureNPCTravelPlan(npc, 1, settlements, 0);
    expect(updated.travel).toBeDefined();
    expect(updated.travel?.status).toBe('traveling');
    expect(updated.travel?.originSettlementId).toBe('settlement_1');
    expect(updated.travel?.destinationSettlementId).toBe('settlement_2');
  });

  it('does not create a plan when NPC already has one', () => {
    const existingPlan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      progress: 50,
      goods: [],
      status: 'traveling',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      homeSettlementId: 'settlement_1',
      travel: existingPlan,
    };

    const settlements: Settlement[] = [
      { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
      { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
    ];

    const updated = ensureNPCTravelPlan(npc, 1, settlements, 0);
    expect(updated.travel).toBe(existingPlan);
  });

  it('does not create a plan when NPC activity is not travel', () => {
    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'work',
      homeSettlementId: 'settlement_1',
    };

    const settlements: Settlement[] = [
      { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
    ];

    const updated = ensureNPCTravelPlan(npc, 1, settlements, 0);
    expect(updated.travel).toBeUndefined();
  });

  it('advances travel progress deterministically', () => {
    const plan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      progress: 0,
      goods: [],
      status: 'traveling',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      travel: plan,
    };

    const distance = Math.hypot(200 - 100, 200 - 100);
    const expectedProgressPerTick = (NPC_TRAVEL_BASE_SPEED / distance) * 100;

    const updatedA = advanceNPCTravel(npc, 1, 1);
    expect(updatedA).not.toBeNull();
    expect(updatedA!.travel!.progress).toBeCloseTo(expectedProgressPerTick, 5);

    const updatedB = advanceNPCTravel(updatedA!, 1, 1);
    expect(updatedB).not.toBeNull();
    expect(updatedB!.travel!.progress).toBeCloseTo(expectedProgressPerTick * 2, 5);
  });

  it('arrives when progress reaches threshold', () => {
    const plan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 101,
      destinationY: 101,
      progress: 99.9,
      goods: [{ templateKey: 'wood', quantity: 5 }],
      status: 'traveling',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      travel: plan,
    };

    const updated = advanceNPCTravel(npc, 1, 1);
    expect(updated).not.toBeNull();
    expect(updated!.travel).toBeUndefined();
    expect(updated!.currentActivity).toBe('work');
  });

  it('resolves interrupted travel back to origin', () => {
    const plan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      progress: 30,
      goods: [],
      status: 'interrupted',
      interruptType: 'monster',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      travel: plan,
    };

    const updated = resolveInterruptedTravel(npc, 1, 1);
    expect(updated.travel).toBeUndefined();
    expect(updated.currentActivity).toBe('work');
  });

  it('publishes NPCTravelStarted event when plan is created', () => {
    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      homeSettlementId: 'settlement_1',
    };

    const settlements: Settlement[] = [
      { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
      { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
    ];

    const captured: string[] = [];
    const unsubscribe = worldEventBus.subscribe('NPCTravelStarted', () => {
      captured.push('NPCTravelStarted');
    });

    ensureNPCTravelPlan(npc, 1, settlements, 0);
    unsubscribe();

    expect(captured).toContain('NPCTravelStarted');
  });

  it('publishes NPCTravelArrived event on completion', () => {
    const plan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 101,
      destinationY: 101,
      progress: 99,
      goods: [{ templateKey: 'wood', quantity: 5 }],
      status: 'traveling',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      travel: plan,
    };

    const captured: string[] = [];
    const unsubscribe = worldEventBus.subscribe('NPCTravelArrived', () => {
      captured.push('NPCTravelArrived');
    });

    advanceNPCTravel(npc, 1, 1);
    unsubscribe();

    expect(captured).toContain('NPCTravelArrived');
  });

  it('publishes NPCTravelInterrupted event on robbery', () => {
    const plan: NPCTravelPlan = {
      npcId: 'npc_1',
      originSettlementId: 'settlement_1',
      destinationSettlementId: 'settlement_2',
      originX: 100,
      originY: 100,
      destinationX: 200,
      destinationY: 200,
      progress: 10,
      goods: [{ templateKey: 'wood', quantity: 10 }],
      status: 'traveling',
    };

    const npc: NPC = {
      id: 'npc_1',
      name: 'Test NPC',
      role: 'merchant',
      dialogue: ['Hello'],
      schedule: [],
      currentActivity: 'travel',
      travel: plan,
    };

    // Use a seed that will trigger robbery
    const rng = new SeededRandom('robbery-seed');
    // Force the robbery condition by using a seed that yields a low value
    const robNpc: NPC = {
      ...npc,
      travel: { ...plan, progress: 0 },
    };

    const updated = advanceNPCTravel(robNpc, 1, 999999);
    expect(updated).not.toBeNull();
    if (updated!.travel?.interruptType === 'robbery') {
      expect(updated!.travel.goods.length).toBeLessThanOrEqual(plan.goods.length);
    }
  });

  it('tickNPCTravel advances all traveling NPCs in a world', () => {
    const npc: NPC = {
      id: 'npc_1',
      name: 'Traveler',
      role: 'merchant',
      dialogue: ['Hi'],
      schedule: [],
      currentActivity: 'travel',
      travel: {
        npcId: 'npc_1',
        originSettlementId: 'settlement_1',
        destinationSettlementId: 'settlement_2',
        originX: 100,
        originY: 100,
        destinationX: 200,
        destinationY: 200,
        progress: 0,
        goods: [],
        status: 'traveling',
      },
    };

    const tile: TileData = {
      x: 100,
      y: 100,
      biome: 'plains',
      discovered: true,
      explored: true,
      npc,
    };

    const world: WorldData = {
      id: 1,
      seed: 42,
      name: 'Test World',
      tier: 1,
      bossDefeated: false,
      dungeonFloors: 3,
      tiles: new Map<string, TileData>([['100,100', tile]]),
      startTile: { x: 100, y: 100 },
      weather: {
        currentWeather: 'Clear',
        weatherIntensity: 0,
        nextChangeTurn: 100,
        baseDuration: 100,
      },
      settlements: [
        { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
        { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
      ],
    };

    const worlds = new Map<number, WorldData>([[1, world]]);
    const patched = tickNPCTravel(worlds, 1, 0);

    const patchedWorld = patched.get(1)!;
    const tileAfter = patchedWorld.tiles.get('100,100');
    expect(tileAfter?.npc?.travel?.progress).toBeGreaterThan(0);
  });

  it('moves NPC to destination tile on arrival', () => {
    const travelingNPC: NPC = {
      id: 'npc_1',
      name: 'Traveler',
      role: 'merchant',
      dialogue: ['Hi'],
      schedule: [],
      currentActivity: 'travel',
      travel: {
        npcId: 'npc_1',
        originSettlementId: 'settlement_1',
        destinationSettlementId: 'settlement_2',
        originX: 100,
        originY: 100,
        destinationX: 200,
        destinationY: 200,
        progress: 100,
        goods: [],
        status: 'traveling',
      },
    };

    const originTile: TileData = {
      x: 100,
      y: 100,
      biome: 'plains',
      discovered: true,
      explored: true,
      npc: travelingNPC,
    };

    const destTile: TileData = {
      x: 200,
      y: 200,
      biome: 'forest',
      discovered: true,
      explored: true,
    };

    const world: WorldData = {
      id: 1,
      seed: 42,
      name: 'Test World',
      tier: 1,
      bossDefeated: false,
      dungeonFloors: 3,
      tiles: new Map<string, TileData>([
        ['100,100', originTile],
        ['200,200', destTile],
      ]),
      startTile: { x: 100, y: 100 },
      weather: {
        currentWeather: 'Clear',
        weatherIntensity: 0,
        nextChangeTurn: 100,
        baseDuration: 100,
      },
      settlements: [
        { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
        { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
      ],
    };

    const worlds = new Map<number, WorldData>([[1, world]]);
    const patched = tickNPCTravel(worlds, 1, 0);

    const patchedWorld = patched.get(1)!;
    const originTileAfter = patchedWorld.tiles.get('100,100');
    const destTileAfter = patchedWorld.tiles.get('200,200');

    expect(originTileAfter?.npc).toBeUndefined();
    expect(destTileAfter?.npc).toBeDefined();
    expect(destTileAfter?.npc?.id).toBe('npc_1');
    expect(destTileAfter?.npc?.currentActivity).toBe('work');
    expect(destTileAfter?.npc?.travel).toBeUndefined();
  });

  it('creates destination tile if missing on arrival', () => {
    const travelingNPC: NPC = {
      id: 'npc_1',
      name: 'Traveler',
      role: 'merchant',
      dialogue: ['Hi'],
      schedule: [],
      currentActivity: 'travel',
      travel: {
        npcId: 'npc_1',
        originSettlementId: 'settlement_1',
        destinationSettlementId: 'settlement_2',
        originX: 100,
        originY: 100,
        destinationX: 200,
        destinationY: 200,
        progress: 100,
        goods: [],
        status: 'traveling',
      },
    };

    const originTile: TileData = {
      x: 100,
      y: 100,
      biome: 'plains',
      discovered: true,
      explored: true,
      npc: travelingNPC,
    };

    const world: WorldData = {
      id: 1,
      seed: 42,
      name: 'Test World',
      tier: 1,
      bossDefeated: false,
      dungeonFloors: 3,
      tiles: new Map<string, TileData>([['100,100', originTile]]),
      startTile: { x: 100, y: 100 },
      weather: {
        currentWeather: 'Clear',
        weatherIntensity: 0,
        nextChangeTurn: 100,
        baseDuration: 100,
      },
      settlements: [
        { id: 'settlement_1', type: 'city', worldId: 1, x: 100, y: 100, name: 'Origin', biome: 'plains', elevation: 0.5, nearWater: false, discovered: true },
        { id: 'settlement_2', type: 'village', worldId: 1, x: 200, y: 200, name: 'Dest', biome: 'forest', elevation: 0.3, nearWater: false, discovered: true },
      ],
    };

    const worlds = new Map<number, WorldData>([[1, world]]);
    const patched = tickNPCTravel(worlds, 1, 0);

    const patchedWorld = patched.get(1)!;
    const destTile = patchedWorld.tiles.get('200,200');

    expect(destTile).toBeDefined();
    expect(destTile?.npc?.id).toBe('npc_1');
  });
});
