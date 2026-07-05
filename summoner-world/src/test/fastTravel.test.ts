import { describe, expect, it } from 'vitest';
import {
  createFastTravelPoint,
  calculateTravelDuration,
  discoverSettlement,
  unlockFastTravelPoint,
  canFastTravelToPoint,
  getFastTravelPointsNear,
  getNearestFastTravelPoint,
  isOnRoad,
  startFastTravel,
  finishTravel,
  createDefaultFastTravelState,
  type FastTravelState,
  type FastTravelPoint,
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
  });

  describe('calculateTravelDuration', () => {
    it('calculates base travel time by distance', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0);
      expect(duration).toBe(10000);
    });

    it('applies fast travel speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { isFastTravel: true });
      expect(duration).toBe(8000);
    });

    it('applies mount speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { isMount: true });
      expect(duration).toBe(5000);
    });

    it('applies element travel speed bonus', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { elementTravelSpeedPct: 10 });
      expect(duration).toBeLessThan(10000);
    });

    it('caps duration at minimum 1000ms', () => {
      const duration = calculateTravelDuration(0, 0, 100, 0, { 
        isMount: true, 
        isFastTravel: true,
        elementTravelSpeedPct: 50 
      });
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('discoverSettlement', () => {
    it('adds a new settlement to discovered points', () => {
      const state: FastTravelState = {
        points: [],
        discoveredPointIds: new Set(),
      };

      const newState = discoverSettlement(state, 'settlement_1_100_200');
      expect(newState.discoveredPointIds.has('settlement_1_100_200')).toBe(true);
    });

    it('does not duplicate already discovered settlements', () => {
      const state: FastTravelState = {
        points: [],
        discoveredPointIds: new Set(['settlement_1_100_200']),
      };

      const newState = discoverSettlement(state, 'settlement_1_100_200');
      expect(newState.discoveredPointIds.size).toBe(1);
    });
  });

  describe('unlockFastTravelPoint', () => {
    it('unlocks a fast travel point', () => {
      const state: FastTravelState = {
        points: [createFastTravelPoint('settlement', 1, 100, 200, { id: 'pt_1' })],
        discoveredPointIds: new Set(),
      };

      const newState = unlockFastTravelPoint(state, 'pt_1');
      expect(newState.points[0]!.unlocked).toBe(true);
      expect(newState.discoveredPointIds.has('pt_1')).toBe(true);
    });
  });

  describe('canFastTravelToPoint', () => {
    it('returns true for unlocked and discovered points', () => {
      const state: FastTravelState = {
        points: [createFastTravelPoint('settlement', 1, 100, 200, { id: 'pt_1' })],
        discoveredPointIds: new Set(['pt_1']),
      };

      const newState = unlockFastTravelPoint(state, 'pt_1');
      expect(canFastTravelToPoint(newState, 'pt_1')).toBe(true);
    });

    it('returns false for undiscovered points', () => {
      const state: FastTravelState = {
        points: [createFastTravelPoint('settlement', 1, 100, 200, { id: 'pt_1' })],
        discoveredPointIds: new Set(),
      };

      expect(canFastTravelToPoint(state, 'pt_1')).toBe(false);
    });

    it('returns false for non-existent points', () => {
      const state = createDefaultFastTravelState();
      expect(canFastTravelToPoint(state, 'nonexistent')).toBe(false);
    });
  });

  describe('getFastTravelPointsNear', () => {
    it('returns points within distance threshold', () => {
      const state: FastTravelState = {
        points: [
          createFastTravelPoint('settlement', 1, 100, 100, { id: 'near' }),
          createFastTravelPoint('settlement', 1, 500, 500, { id: 'far' }),
        ],
        discoveredPointIds: new Set(['near', 'far']),
      };

      const nearPoints = getFastTravelPointsNear(state, 100, 100, 100);
      expect(nearPoints.length).toBe(1);
      expect(nearPoints[0]!.id).toBe('near');
    });
  });

  describe('getNearestFastTravelPoint', () => {
    it('finds the closest point in the same world', () => {
      const state: FastTravelState = {
        points: [
          createFastTravelPoint('settlement', 1, 100, 100, { id: 'pt_1' }),
          createFastTravelPoint('settlement', 1, 500, 500, { id: 'pt_2' }),
          createFastTravelPoint('settlement', 2, 100, 100, { id: 'pt_3' }),
        ],
        discoveredPointIds: new Set(['pt_1', 'pt_2', 'pt_3']),
      };

      const nearest = getNearestFastTravelPoint(state, 90, 90, 1);
      expect(nearest?.id).toBe('pt_1');
    });

    it('returns null when no points discovered', () => {
      const state: FastTravelState = {
        points: [createFastTravelPoint('settlement', 1, 100, 100, { id: 'pt_1' })],
        discoveredPointIds: new Set(),
      };

      expect(getNearestFastTravelPoint(state, 100, 100, 1)).toBeNull();
    });
  });

  describe('isOnRoad', () => {
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

  describe('startFastTravel and finishTravel', () => {
    it('starts an active travel', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startFastTravel(state, destination, 0, 0);
      expect(newState.activeTravel).toBeDefined();
      expect(newState.activeTravel!.destination).toEqual(destination);
      expect(newState.activeTravel!.travelType).toBe('fast_travel');
    });

    it('starts mount travel with isMount option', () => {
      const state = createDefaultFastTravelState();
      const destination = { worldId: 1, x: 100, y: 100 };

      const newState = startFastTravel(state, destination, 0, 0, { isMount: true });
      expect(newState.activeTravel!.travelType).toBe('mount');
      expect(newState.activeTravel!.duration).toBeGreaterThan(0);
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