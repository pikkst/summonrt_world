import type { Element } from '../types/game';

export type FastTravelPointType = 'settlement' | 'road' | 'creature_mount';

export interface FastTravelPoint {
  id: string;
  type: FastTravelPointType;
  worldId: number;
  x: number;
  y: number;
  unlocked: boolean;
  unlockCost?: number;
  elementBonus?: Element;
  description?: string;
}

export interface FastTravelDestination {
  worldId: number;
  x: number;
  y: number;
  pointId?: string;
}

export interface FastTravelState {
  points: FastTravelPoint[];
  discoveredPointIds: Set<string>;
  activeTravel?: {
    destination: FastTravelDestination;
    startTime: number;
    duration: number;
    travelType: 'walking' | 'fast_travel' | 'mount';
  };
}

export const FAST_TRAVEL_BASE_DURATION_MS = 5000;
export const FAST_TRAVEL_SPEED_BONUS = 20;
export const MOUNT_SPEED_BONUS = 50;
export const ROAD_SPEED_BONUS = 30;
export const SETTLEMENT_SPEED_BONUS = 40;

export function createFastTravelPoint(
  type: FastTravelPointType,
  worldId: number,
  x: number,
  y: number,
  options?: {
    id?: string;
    unlockCost?: number;
    elementBonus?: Element;
    description?: string;
  }
): FastTravelPoint {
  const id = options?.id ?? `${type}_${worldId}_${x}_${y}`;
  return {
    id,
    type,
    worldId,
    x,
    y,
    unlocked: false,
    unlockCost: options?.unlockCost,
    elementBonus: options?.elementBonus,
    description: options?.description,
  };
}

export function calculateTravelDuration(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  options?: {
    isFastTravel?: boolean;
    isMount?: boolean;
    isOnRoad?: boolean;
    isNearSettlement?: boolean;
    elementTravelSpeedPct?: number;
  }
): number {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const baseDuration = distance * 100;

  let speedBonus = 0;
  if (options?.isFastTravel) speedBonus += FAST_TRAVEL_SPEED_BONUS;
  if (options?.isMount) speedBonus += MOUNT_SPEED_BONUS;
  if (options?.isOnRoad) speedBonus += ROAD_SPEED_BONUS;
  if (options?.isNearSettlement) speedBonus += SETTLEMENT_SPEED_BONUS;
  if (options?.elementTravelSpeedPct) speedBonus += options.elementTravelSpeedPct;

  const finalDuration = baseDuration * (1 - Math.min(0.9, speedBonus / 100));
  return Math.max(1000, finalDuration);
}

export function discoverSettlement(
  state: FastTravelState,
  settlementId: string
): FastTravelState {
  if (state.discoveredPointIds.has(settlementId)) {
    return state;
  }
  return {
    ...state,
    discoveredPointIds: new Set(state.discoveredPointIds).add(settlementId),
  };
}

export function unlockFastTravelPoint(
  state: FastTravelState,
  pointId: string
): FastTravelState {
  const points = state.points.map(p =>
    p.id === pointId ? { ...p, unlocked: true } : p
  );
  return {
    ...state,
    points,
    discoveredPointIds: new Set(state.discoveredPointIds).add(pointId),
  };
}

export function canFastTravelToPoint(
  state: FastTravelState,
  pointId: string
): boolean {
  const point = state.points.find(p => p.id === pointId);
  if (!point || !point.unlocked) return false;
  return state.discoveredPointIds.has(pointId);
}

export function getFastTravelPointsNear(
  state: FastTravelState,
  x: number,
  y: number,
  maxDistance: number = 100
): FastTravelPoint[] {
  return state.points.filter(p => {
    const distance = Math.hypot(p.x - x, p.y - y);
    return distance <= maxDistance && state.discoveredPointIds.has(p.id);
  });
}

export function getNearestFastTravelPoint(
  state: FastTravelState,
  x: number,
  y: number,
  worldId: number
): FastTravelPoint | null {
  const pointsInWorld = state.points.filter(
    p => p.worldId === worldId && state.discoveredPointIds.has(p.id)
  );

  if (pointsInWorld.length === 0) return null;

  let nearest: FastTravelPoint = pointsInWorld[0]!;
  let minDistance = Math.hypot(nearest.x - x, nearest.y - y);

  for (let i = 1; i < pointsInWorld.length; i++) {
    const p = pointsInWorld[i]!;
    const distance = Math.hypot(p.x - x, p.y - y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = p;
    }
  }

  return nearest;
}

export function isOnRoad(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  roadPoints: { x: number; y: number }[],
  threshold: number = 50
): boolean {
  for (const roadPoint of roadPoints) {
    const distToLine = Math.abs(
      (toY - fromY) * roadPoint.x -
      (toX - fromX) * roadPoint.y +
      toX * fromY - fromY * toX
    ) / Math.hypot(toY - fromY, toX - fromX);

    if (distToLine < threshold) {
      const pointOnLine = Math.hypot(roadPoint.x - fromX, roadPoint.y - fromY) /
        Math.hypot(toX - fromX, toY - fromY);
      if (pointOnLine >= 0 && pointOnLine <= 1) {
        return true;
      }
    }
  }
  return false;
}

export function startFastTravel(
  state: FastTravelState,
  destination: FastTravelDestination,
  fromX: number,
  fromY: number,
  options?: {
    isMount?: boolean;
    elementTravelSpeedPct?: number;
  }
): FastTravelState {
  const now = Date.now();
  let duration: number;

  if (state.activeTravel?.travelType === 'fast_travel') {
    duration = state.activeTravel.duration;
  } else if (options?.isMount) {
    duration = calculateTravelDuration(fromX, fromY, destination.x, destination.y, { isMount: true, elementTravelSpeedPct: options.elementTravelSpeedPct });
  } else {
    duration = FAST_TRAVEL_BASE_DURATION_MS;
  }

  return {
    ...state,
    activeTravel: {
      destination,
      startTime: now,
      duration,
      travelType: options?.isMount ? 'mount' : 'fast_travel',
    },
  };
}

export function finishTravel(state: FastTravelState): FastTravelState {
  if (!state.activeTravel) return state;

  const travel = state.activeTravel;
  const newX = travel.destination.x;
  const newY = travel.destination.y;
  const newWorldId = travel.destination.worldId;

  return {
    ...state,
    activeTravel: undefined,
    points: state.points.map(p => ({ ...p })),
    discoveredPointIds: new Set(state.discoveredPointIds),
  };
}

export function createDefaultFastTravelState(): FastTravelState {
  return {
    points: [],
    discoveredPointIds: new Set(),
    activeTravel: undefined,
  };
}