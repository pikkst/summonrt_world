import type {
  Element,
  FastTravelPointType,
  FastTravelPoint,
  FastTravelDestination,
} from '../types/game';

export type TravelMode =
  | 'walking'
  | 'mount'
  | 'road'
  | 'boat'
  | 'portal'
  | 'air'
  | 'world_gate'
  | 'fast_travel';

export const TRAVEL_MODE_SPEED_BONUS: Record<TravelMode, number> = {
  walking: 0,
  mount: 50,
  road: 30,
  boat: 40,
  portal: 90,
  air: 70,
  world_gate: 85,
  fast_travel: 20,
};

export const TRAVEL_MODE_MIN_DURATION_MS: Record<TravelMode, number> = {
  walking: 1000,
  mount: 1000,
  road: 1000,
  boat: 1000,
  portal: 500,
  air: 1000,
  world_gate: 2000,
  fast_travel: 500,
};

export const TRAVEL_MODE_REQUIREMENTS: Record<TravelMode, string> = {
  walking: 'None',
  mount: 'Contracted mount creature in active slots',
  road: 'Path must run along a known road',
  boat: 'Origin or destination must be on water/coast',
  portal: 'Portal point must be discovered and unlocked',
  air: 'Air-aligned affinity or flying mount creature',
  world_gate: 'Target world must be unlocked in worldUnlocks',
  fast_travel: 'Destination point must be unlocked and discovered',
};

export interface FastTravelState {
  points: FastTravelPoint[];
  discoveredPointIds: Set<string>;
  activeTravel?: {
    destination: FastTravelDestination;
    startTime: number;
    duration: number;
    travelType: TravelMode;
  };
}

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
    requiresWorldId?: number;
    requiresItem?: string;
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
    requiresWorldId: options?.requiresWorldId,
    requiresItem: options?.requiresItem,
  };
}

export function calculateTravelDuration(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  options?: {
    travelMode?: TravelMode;
    isOnRoad?: boolean;
    elementTravelSpeedPct?: number;
  }
): number {
  const travelMode = options?.travelMode || 'walking';

  if (travelMode === 'portal' || travelMode === 'world_gate' || travelMode === 'fast_travel') {
    return TRAVEL_MODE_MIN_DURATION_MS[travelMode];
  }

  const distance = Math.hypot(toX - fromX, toY - fromY);
  const baseDuration = distance * 100;
  const modeBonus = TRAVEL_MODE_SPEED_BONUS[travelMode] || 0;

  let speedBonus = modeBonus;
  if (options?.isOnRoad && travelMode !== 'road') {
    speedBonus += 30;
  }
  if (options?.elementTravelSpeedPct) {
    speedBonus += options.elementTravelSpeedPct;
  }

  const finalDuration = baseDuration * (1 - Math.min(0.9, speedBonus / 100));
  const minDuration = TRAVEL_MODE_MIN_DURATION_MS[travelMode] || 1000;
  return Math.max(minDuration, finalDuration);
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
  const denominator = Math.hypot(toY - fromY, toX - fromX);
  if (denominator === 0) return false;

  for (const roadPoint of roadPoints) {
    const distToLine = Math.abs(
      (toY - fromY) * roadPoint.x -
      (toX - fromX) * roadPoint.y +
      toX * fromY - fromY * toX
    ) / denominator;

    if (distToLine < threshold) {
      const pointOnLine = Math.hypot(roadPoint.x - fromX, roadPoint.y - fromY) /
        denominator;
      if (pointOnLine >= 0 && pointOnLine <= 1) {
        return true;
      }
    }
  }
  return false;
}

export function canTravelByBoat(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  worldId: number,
  _points: FastTravelPoint[]
): boolean {
  const hasBoatPoint = _points.some(
    p => p.worldId === worldId && p.type === 'boat' && p.unlocked
  );
  if (!hasBoatPoint) return false;
  return Math.hypot(toX - fromX, toY - fromY) > 50;
}

export function canTravelByPortal(
  destination: FastTravelDestination,
  state: FastTravelState
): boolean {
  if (!destination.pointId) return false;
  const point = state.points.find(p => p.id === destination.pointId);
  if (!point || point.type !== 'portal') return false;
  return point.unlocked && state.discoveredPointIds.has(destination.pointId);
}

export function canTravelByAir(
  _fromX: number,
  _fromY: number,
  toX: number,
  toY: number,
  hasAirAffinity: boolean,
  hasFlyingMount: boolean
): boolean {
  const distance = Math.hypot(toX - _fromX, toY - _fromY);
  if (distance > 800) return false;
  return hasAirAffinity || hasFlyingMount;
}

export function canTravelByWorldGate(
  fromWorldId: number,
  toWorldId: number,
  unlockedWorlds: number[]
): boolean {
  if (fromWorldId === toWorldId) return true;
  const targetUnlocked = unlockedWorlds.includes(toWorldId);
  const adjacentWorld =
    Math.abs(toWorldId - fromWorldId) === 1 ||
    unlockedWorlds.includes(toWorldId);
  return targetUnlocked && adjacentWorld;
}

export function startWorldTravel(
  state: FastTravelState,
  destination: FastTravelDestination,
  travelMode: TravelMode,
  fromX: number,
  fromY: number,
  options?: {
    isOnRoad?: boolean;
    elementTravelSpeedPct?: number;
  }
): FastTravelState {
  const now = Date.now();
  const duration = calculateTravelDuration(fromX, fromY, destination.x, destination.y, {
    travelMode,
    isOnRoad: options?.isOnRoad,
    elementTravelSpeedPct: options?.elementTravelSpeedPct,
  });

  return {
    ...state,
    activeTravel: {
      destination,
      startTime: now,
      duration,
      travelType: travelMode,
    },
  };
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
  const travelMode: TravelMode = options?.isMount ? 'mount' : 'fast_travel';
  return startWorldTravel(state, destination, travelMode, fromX, fromY, {
    elementTravelSpeedPct: options?.elementTravelSpeedPct,
  });
}

export function finishTravel(state: FastTravelState): FastTravelState {
  if (!state.activeTravel) return state;

  const travel = state.activeTravel;

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
