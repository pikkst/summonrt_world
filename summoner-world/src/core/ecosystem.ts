import type { WorldData, TileData } from '../types/game';
import { worldEventBus } from './worldEventBus';
import { SeededRandom } from '../utils/SeededRandom';
import { PLANT_RESOURCE_TYPES, ORE_RESOURCE_TYPES, PLANT_RESPAWN_DAYS, ORE_RESPAWN_DAYS, RESOURCE_MAX_QTY } from './worldTick';

export interface EcosystemState {
  populations: Record<string, number>;
  carryingCapacity: Record<string, number>;
  overhuntingPenalties: Record<string, number>;
  deforestationLevel: number;
  pollutionLevel: number;
  lastTickDay: number;
}

export interface TileEcology {
  plantDensity: number;
  creatureDensity: number;
}

export interface EcosystemTickParams {
  dayCount: number;
  turnCount: number;
  gameTimeMinutes: number;
}

export const ECOSYSTEM_BASE_BIRTH_RATE = 0.02;
export const ECOSYSTEM_BASE_DEATH_RATE = 0.01;
export const ECOSYSTEM_MIGRATION_RATE = 0.05;
export const OVERHUNTING_PENALTY_DAYS = 60;
export const DEFORESTATION_HERBIVORE_IMPACT = 0.005;
export const POLLUTION_DEATH_IMPACT = 0.001;

export function createDefaultEcosystemState(): EcosystemState {
  return {
    populations: {},
    carryingCapacity: {},
    overhuntingPenalties: {},
    deforestationLevel: 0,
    pollutionLevel: 0,
    lastTickDay: 0,
  };
}

export function createDefaultTileEcology(): TileEcology {
  return {
    plantDensity: 0.5,
    creatureDensity: 0.5,
  };
}

export function initializeEcosystem(world: WorldData): EcosystemState {
  if (!world.ecosystem) {
    world.ecosystem = createDefaultEcosystemState();
  }

  const eco = world.ecosystem;
  const rng = new SeededRandom(world.seed);
  const biomeCreatures: Record<string, string[]> = {
    forest: ['wolf', 'deer', 'fox', 'bear'],
    plains: ['deer', 'rabbit', 'wolf', 'hawk'],
    mountains: ['goat', 'eagle', 'wolf'],
    swamp: ['frog', 'snake', 'gator'],
    desert: ['lizard', 'scorpion', 'snake'],
    tundra: ['wolf', 'fox', 'hare', 'bear'],
    coast: ['crab', 'seagull', 'fish', 'otter'],
    volcanic: ['lizard', 'fire_spirit', 'ash_hawk'],
    crystal_caves: ['crystal_spider', 'bat', 'mole'],
    sky_islands: ['hawk', 'wyvern', 'cloud_drake'],
  };

  const populations: Record<string, number> = {};
  const carryingCapacity: Record<string, number> = {};

  world.tiles.forEach((tile) => {
    if (!tile.ecology) {
      tile.ecology = createDefaultTileEcology();
    }

    const creatures = biomeCreatures[tile.biome] || [];
    creatures.forEach((creatureKey) => {
      if (!populations[creatureKey]) {
        populations[creatureKey] = 0;
        carryingCapacity[creatureKey] = 50 + rng.int(0, 100);
      }
      populations[creatureKey] += rng.int(0, 3);
    });

    tile.ecology.plantDensity = Math.max(0.1, Math.min(1, tile.ecology.plantDensity + rng.range(-0.2, 0.2)));
    tile.ecology.creatureDensity = Math.max(0.1, Math.min(1, tile.ecology.creatureDensity + rng.range(-0.2, 0.2)));
  });

  eco.populations = populations;
  eco.carryingCapacity = carryingCapacity;

  return eco;
}

export function processEcosystemTick(
  world: WorldData,
  params: EcosystemTickParams
): void {
  const eco = world.ecosystem ?? initializeEcosystem(world);

  const daysSinceLastTick = params.dayCount - eco.lastTickDay;

  if (daysSinceLastTick <= 0 && eco.lastTickDay !== 0) {
    return;
  }

  regenerateResources(world, params.dayCount, params.turnCount, params.gameTimeMinutes);
  simulatePopulationDynamics(world, params.dayCount, params.turnCount, daysSinceLastTick);
  updateEcologyFromTiles(world);

  eco.lastTickDay = params.dayCount;

  worldEventBus.publish({
    type: 'EcosystemTick',
    worldId: world.id,
    dayCount: params.dayCount,
    turnCount: params.turnCount,
    gameTimeMinutes: params.gameTimeMinutes,
  });
}

export function regenerateResources(
  world: WorldData,
  dayCount: number,
  turnCount: number,
  gameTimeMinutes: number
): void {
  world.tiles.forEach((tile) => {
    if (tile.resourceQty === undefined || tile.resourceQty >= RESOURCE_MAX_QTY) return;
    if (!tile.resourceType) return;

    const respawnDays = PLANT_RESOURCE_TYPES.includes(tile.resourceType as any) ? PLANT_RESPAWN_DAYS : ORE_RESPAWN_DAYS;
    const respawnTurn = tile.resourceRespawnTurn ?? dayCount;

    if (dayCount >= respawnTurn) {
      tile.resourceQty = Math.min(RESOURCE_MAX_QTY, (tile.resourceQty || 0) + 1);
      if (tile.resourceQty < RESOURCE_MAX_QTY) {
        tile.resourceRespawnTurn = dayCount + respawnDays;
      } else {
        tile.resourceRespawnTurn = undefined;
      }
      if (tile.resourceQty > 0) {
        worldEventBus.publish({
          type: 'ResourceSpawned',
          worldId: world.id,
          x: tile.x,
          y: tile.y,
          resourceType: tile.resourceType,
          quantity: tile.resourceQty,
          gameTimeMinutes,
          turnCount,
        });
      }
    }
  });
}

export function simulatePopulationDynamics(
  world: WorldData,
  dayCount: number,
  turnCount: number,
  daysElapsed: number
): void {
  const eco = world.ecosystem;
  if (!eco) return;

  Object.keys(eco.populations).forEach((creatureKey) => {
    let pop = eco.populations[creatureKey] ?? 0;
    const capacity = eco.carryingCapacity[creatureKey] || 50;
    const penalty = eco.overhuntingPenalties[creatureKey] || 0;

    for (let d = 0; d < daysElapsed; d++) {
      const currentDay = dayCount - daysElapsed + d + 1;
      const dayRng = new SeededRandom(world.seed + currentDay + turnCount + creatureKey.charCodeAt(0));

      const growthFactor = 1 - Math.abs(pop - capacity / 2) / (capacity / 2);
      const births = Math.max(0, Math.floor(pop * ECOSYSTEM_BASE_BIRTH_RATE * Math.max(0, growthFactor)));

      const pollutionImpact = eco.pollutionLevel * POLLUTION_DEATH_IMPACT;
      const baseDeaths = Math.floor(pop * (ECOSYSTEM_BASE_DEATH_RATE + pollutionImpact));
      const penaltyDeaths = penalty > 0 ? Math.floor(pop * 0.1) : 0;
      const deaths = baseDeaths + penaltyDeaths;

      const migration = Math.floor(dayRng.range(-1, 1) * ECOSYSTEM_MIGRATION_RATE * pop);

      pop = Math.max(0, pop + births - deaths + migration);

      if (penalty > 0) {
        eco.overhuntingPenalties[creatureKey] = Math.max(0, penalty - 1);
      }
    }

    const previousCount = eco.populations[creatureKey] ?? 0;
    eco.populations[creatureKey] = Math.max(0, pop);

    if (previousCount !== eco.populations[creatureKey]) {
      worldEventBus.publish({
        type: 'CreaturePopulationChanged',
        worldId: world.id,
        creatureKey,
        previousCount,
        newCount: eco.populations[creatureKey],
        gameTimeMinutes: 0,
        turnCount,
      });
    }
  });
}

export function updateEcologyFromTiles(world: WorldData): void {
  const eco = world.ecosystem;
  if (!eco) return;

  let depletedWoodTiles = 0;
  let depletedOreTiles = 0;
  let tileCount = 0;

  world.tiles.forEach((tile) => {
    tileCount++;
    if (tile.resourceType === 'wood' && (tile.resourceQty ?? 0) === 0) depletedWoodTiles++;
    if (['stone', 'ore', 'crystal', 'essence'].includes(tile.resourceType || '') && (tile.resourceQty ?? 0) === 0) depletedOreTiles++;
  });

  if (tileCount > 0) {
    eco.deforestationLevel = Math.min(100, (depletedWoodTiles / tileCount) * 200);
    eco.pollutionLevel = Math.min(100, (depletedOreTiles / tileCount) * 200);
  }

  Object.keys(eco.carryingCapacity).forEach((creatureKey) => {
    const isHerbivore = ['deer', 'rabbit', 'hare', 'goat', 'frog'].includes(creatureKey);
    if (isHerbivore) {
      const baseCapacity = 50 + new SeededRandom(world.seed + creatureKey.charCodeAt(0)).int(0, 100);
      eco.carryingCapacity[creatureKey] = Math.max(10, baseCapacity - eco.deforestationLevel * DEFORESTATION_HERBIVORE_IMPACT * baseCapacity);
    }
  });
}

export function applyOverhuntingPenalty(world: WorldData, creatureKey: string, turnCount: number): void {
  if (!world.ecosystem) return;
  world.ecosystem.overhuntingPenalties[creatureKey] = OVERHUNTING_PENALTY_DAYS;

  worldEventBus.publish({
    type: 'OverhuntingPenaltyApplied',
    worldId: world.id,
    creatureKey,
    penaltyTurns: OVERHUNTING_PENALTY_DAYS,
    gameTimeMinutes: 0,
    turnCount,
  });
}

export function applyDeforestationEvent(world: WorldData, x: number, y: number, severity: number, turnCount: number): void {
  if (!world.ecosystem) return;
  world.ecosystem.deforestationLevel = Math.min(100, world.ecosystem.deforestationLevel + severity);

  worldEventBus.publish({
    type: 'DeforestationEvent',
    worldId: world.id,
    x,
    y,
    severity,
    gameTimeMinutes: 0,
    turnCount,
  });
}

export function applyPollutionEvent(world: WorldData, x: number, y: number, level: number, turnCount: number): void {
  if (!world.ecosystem) return;
  world.ecosystem.pollutionLevel = Math.min(100, world.ecosystem.pollutionLevel + level);

  worldEventBus.publish({
    type: 'PollutionEvent',
    worldId: world.id,
    x,
    y,
    level,
    gameTimeMinutes: 0,
    turnCount,
  });
}
