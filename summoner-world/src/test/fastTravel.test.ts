import { describe, expect, it } from 'vitest';
import type { FastTravelState, FastTravelPoint } from '../types/game';
import {
  createFastTravelPoint,
  calculateTravelDuration,
  discoverSettlement,
  unlockFastTravelPoint,
  canFastTravelToPoint,
  getFastTravelPointsNear,
  getNearestFastTravelPoint,
  isOnRoad,
  startWorldTravel,
  startFastTravel,
  finishTravel,
  createDefaultFastTravelState,
  canTravelByBoat,
  canTravelByPortal,
  canTravelByAir,
  canTravelByWorldGate,
  TRAVEL_MODE_SPEED_BONUS,
  TRAVEL_MODE_MIN_DURATION_MS,
  type TravelMode,
} from '../core/fastTravel';

describe('T7.5 - Fast Travel System', () => {
  describe('createFastTravelPoint', () => {
    it('creates a settlement point with correct properties', () => {
      const point = createFastTravelPoint('settlement', 1, 100, 200, {
        id: 'settlement_1_100_200',
        description: 'A bustling town',
      });

      expect(point.id).toBe('settlement_1_100_200');
      expect(point.type).toBe('settlement');
      expect(point.worldId).toBe(1);
      expect(point.x).toBe(100);
      expect(point.y).toBe(200);
      expect(point.unlocked).toBe(false);
      expect(point.description).toBe('A bustling town');
    });

    it('creates a road point with default id', () => {
      const point = createFastTravelPoint('road', 1, 150, 250);

      expect(point.type).toBe('road');
      expect(point.id).toBe('road_1_150_250');
    });

    it('creates a creature mount point with element bonus', () => {
      const point = createFastTravelPoint('creature_mount', 1, 50, 50, {
        elementBonus: 'air',
      });

      expect(point.type).toBe('creature_mount');
      expect(point.elementBonus).toBe('air');
    });

    it('creates a boat point with default id', () => {
      const point = createFastTravelPoint('boat', 2, 300, 400);
      expect(point.type).toBe('boat');
      expect(point.id).toBe('boat_2_300_400');
    });

    it('creates a portal point with requiresItem', () => {
      const point = createFastTravelPoint('portal', 3, 500, 600, {
        id: 'portal_3_500_600',
        requiresItem: 'portal_scroll',
      });
      expect(point.type).toBe('portal');
      expect(point.requiresItem).toBe('portal_scroll');
    });

    it('creates an air point with element bonus', () => {
      const point = createFastTravelPoint('air', 4, 700, 800, {
        elementBonus: 'air',
      });
      expect(point.type).toBe('air');
      expect(point.elementBonus).toBe('air');
    });

    it('creates a world_gate point pointing to another world', () => {
      const point = createFastTravelPoint('world_gate', 5, 0, 0, {
        id: 'gate_5_to_6',
        requiresWorldId: 6,
      });
      expect(point.type).toBe('world_gate');
      expect(point.requiresWorldId).toBe(6);
    });
  });

  describe('T7.13.1 - Walking travel', () => {
    it('calculates base walking duration by distance', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'walking' });
      expect(duration).toBe(10000);
    });

    it('applies no speed bonus for walking', () => {
      const walkingDuration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'walking' });
      const mountDuration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'mount' });
      expect(walkingDuration).toBeGreaterThan(mountDuration);
    });
  });

  describe('T7.13.2 - Mount creature travel', () => {
    it('calculates mount travel with speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'mount' });
      expect(duration).toBe(5000);
    });

    it('starts an active mount travel via startFastTravel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startFastTravel(state, destination, 0, 0, { isMount: true });
      expect(newState.activeTravel).toBeDefined();
      expect(newState.activeTravel!.travelType).toBe('mount');
      expect(newState.activeTravel!.duration).toBeGreaterThan(0);
    });
  });

  describe('T7.13.3 - Road travel bonuses', () => {
    it('applies road speed bonus when on road', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, {
        travelMode: 'walking',
        isOnRoad: true,
      });
      expect(duration).toBe(7000);
    });

    it('returns true when point is on the line between two points', () => {
      const fromX = 0, fromY = 0;
      const toX = 100, toY = 0;
      const roadPoints = [{ x: 50, y: 0 }];

      expect(isOnRoad(fromX, fromY, toX, toY, roadPoints)).toBe(true);
    });

    it('returns false when point is not on the line', () => {
      const fromX = 0, fromY = 0;
      const toX = 100, toY = 0;
      const roadPoints = [{ x: 50, y: 50 }];

      expect(isOnRoad(fromX, fromY, toX, toY, roadPoints)).toBe(false);
    });
  });

  describe('T7.13.4 - Boat travel', () => {
    it('allows boat travel when a boat point is unlocked in the world', () => {
      const points = [
        createFastTravelPoint('boat', 1, 100, 100, { id: 'boat_1' }),
      ];
      const state: FastTravelState = {
        points,
        discoveredPointIds: new Set(['boat_1']),
      };
      const unlockedState = unlockFastTravelPoint(state, 'boat_1');
      expect(canTravelByBoat(0, 0, 200, 0, 1, unlockedState.points)).toBe(true);
    });

    it('rejects boat travel when no boat point is unlocked', () => {
      const points: FastTravelPoint[] = [];
      const state: FastTravelState = {
        points,
        discoveredPointIds: new Set(),
      };
      expect(canTravelByBoat(0, 0, 200, 0, 1, state.points)).toBe(false);
    });

    it('calculates boat travel duration with speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'boat' });
      expect(duration).toBe(6000);
    });
  });

  describe('T7.13.5 - Portal travel', () => {
    it('calculates near-instant portal duration', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'portal' });
      expect(duration).toBe(500);
    });

    it('requires unlocked portal destination', () => {
      const points = [
        createFastTravelPoint('portal', 1, 100, 100, { id: 'portal_1' }),
      ];
      const baseState: FastTravelState = {
        points,
        discoveredPointIds: new Set(),
      };
      const unlockedState = unlockFastTravelPoint(baseState, 'portal_1');

      expect(canTravelByPortal({ worldId: 1, x: 100, y: 100, pointId: 'portal_1' }, unlockedState)).toBe(true);
      expect(canTravelByPortal({ worldId: 1, x: 100, y: 100, pointId: 'portal_1' }, baseState)).toBe(false);
      expect(canTravelByPortal({ worldId: 1, x: 100, y: 100, pointId: 'missing' }, unlockedState)).toBe(false);
    });

    it('starts active portal travel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startWorldTravel(state, destination, 'portal', 0, 0);
      expect(newState.activeTravel).toBeDefined();
      expect(newState.activeTravel!.travelType).toBe('portal');
      expect(newState.activeTravel!.duration).toBe(500);
    });
  });

  describe('T7.13.6 - Air travel', () => {
    it('allows air travel with air affinity', () => {
      expect(canTravelByAir(0, 0, 100, 100, true, false)).toBe(true);
    });

    it('allows air travel with flying mount', () => {
      expect(canTravelByAir(0, 0, 100, 100, false, true)).toBe(true);
    });

    it('rejects air travel beyond range', () => {
      expect(canTravelByAir(0, 0, 900, 900, true, false)).toBe(false);
    });

    it('calculates air travel duration with high speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'air' });
      expect(duration).toBeGreaterThanOrEqual(3000);
    });

    it('starts active air travel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startWorldTravel(state, destination, 'air', 0, 0);
      expect(newState.activeTravel!.travelType).toBe('air');
      expect(newState.activeTravel!.duration).toBeGreaterThan(0);
    });
  });

  describe('T7.13.7 - World gates', () => {
    it('allows world gate to unlocked target world', () => {
      const unlockedWorlds = [1, 2, 3, 4];
      expect(canTravelByWorldGate(1, 2, unlockedWorlds)).toBe(true);
    });

    it('rejects world gate to locked world', () => {
      const unlockedWorlds = [1, 2];
      expect(canTravelByWorldGate(1, 5, unlockedWorlds)).toBe(false);
    });

    it('allows world gate within same world', () => {
      const unlockedWorlds = [1];
      expect(canTravelByWorldGate(1, 1, unlockedWorlds)).toBe(true);
    });

    it('calculates world gate travel duration', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { travelMode: 'world_gate' });
      expect(duration).toBeLessThanOrEqual(2000);
    });

    it('starts active world gate travel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 2, x: 100, y: 100 };

      const newState = startWorldTravel(state, destination, 'world_gate', 0, 0);
      expect(newState.activeTravel!.travelType).toBe('world_gate');
      expect(newState.activeTravel!.duration).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Travel mode constants', () => {
    it('has speed bonuses defined for every travel mode', () => {
      const modes: TravelMode[] = [
        'walking', 'mount', 'road', 'boat', 'portal', 'air', 'world_gate', 'fast_travel',
      ];
      for (const mode of modes) {
        expect(TRAVEL_MODE_SPEED_BONUS[mode]).toBeGreaterThanOrEqual(0);
        expect(TRAVEL_MODE_SPEED_BONUS[mode]).toBeLessThanOrEqual(90);
      }
    });

    it('has minimum durations defined for every travel mode', () => {
      const modes: TravelMode[] = [
        'walking', 'mount', 'road', 'boat', 'portal', 'air', 'world_gate', 'fast_travel',
      ];
      for (const mode of modes) {
        expect(TRAVEL_MODE_MIN_DURATION_MS[mode]).toBeGreaterThanOrEqual(500);
      }
    });
  });

  describe('startFastTravel and finishTravel', () => {
    it('starts an active travel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startFastTravel(state, destination, 0, 0);
      expect(newState.activeTravel).toBeDefined();
      expect(newState.activeTravel!.destination).toEqual(destination);
      expect(newState.activeTravel!.travelType).toBe('fast_travel');
    });

    it('finishes travel and returns state without active travel', () => {
      const state: FastTravelState = {
        points: [],
        discoveredPointIds: new Set(),
        activeTravel: {
          destination: { worldId: 1, x: 100, y: 100 },
          startTime: Date.now() - 5000,
          duration: 5000,
          travelType: 'fast_travel',
        },
      };

      const newState = finishTravel(state);
      expect(newState.activeTravel).toBeUndefined();
    });
  });

  describe('integration: fast travel flow', () => {
    it('allows discovery and travel to settlements', () => {
      const settlementPoint = createFastTravelPoint('settlement', 1, 100, 100, {
        id: 'settlement_center',
        description: 'Central Settlement',
      });

      let state: FastTravelState = {
        points: [settlementPoint],
        discoveredPointIds: new Set(),
      };

      state = discoverSettlement(state, 'settlement_center');
      expect(state.discoveredPointIds.has('settlement_center')).toBe(true);

      state = unlockFastTravelPoint(state, 'settlement_center');
      expect(canFastTravelToPoint(state, 'settlement_center')).toBe(true);

      const nearPoints = getFastTravelPointsNear(state, 100, 100);
      expect(nearPoints[0]?.id).toBe('settlement_center');
    });
  });
});
