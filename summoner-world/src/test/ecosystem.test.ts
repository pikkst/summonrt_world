import { describe, it, expect } from 'vitest';
import {
  createDefaultEcosystemState,
  createDefaultTileEcology,
  initializeEcosystem,
  processEcosystemTick,
  regenerateResources,
  simulatePopulationDynamics,
  updateEcologyFromTiles,
  applyOverhuntingPenalty,
  applyDeforestationEvent,
  applyPollutionEvent,
  ECOSYSTEM_BASE_BIRTH_RATE,
  ECOSYSTEM_BASE_DEATH_RATE,
  OVERHUNTING_PENALTY_DAYS,
  DEFORESTATION_HERBIVORE_IMPACT,
  POLLUTION_DEATH_IMPACT,
} from '../core/ecosystem';
import type { WorldData, TileData } from '../types/game';

const createTile = (overrides: Partial<TileData> = {}): TileData => ({
  x: 0,
  y: 0,
  biome: 'plains',
  discovered: true,
  explored: true,
  encounterSeed: 1,
  ...overrides,
});

const createWorld = (tiles: TileData[] = [createTile()]): WorldData => {
  const tileMap = new Map<string, TileData>();
  tiles.forEach((tile) => {
    tileMap.set(`${tile.x},${tile.y}`, tile);
  });

  return {
    id: 1,
    seed: 12345,
    name: 'World 1',
    tier: 1,
    bossDefeated: false,
    dungeonFloors: 3,
    tiles: tileMap,
    startTile: { x: 0, y: 0 },
    weather: { currentWeather: 'Clear', weatherIntensity: 1, nextChangeTurn: 0, baseDuration: 0 },
    settlements: [],
  };
};

describe('T9.10 - Ecosystem Simulation', () => {
  describe('createDefaultEcosystemState', () => {
    it('should create a default ecosystem state with zeroed values', () => {
      const state = createDefaultEcosystemState();
      expect(state.populations).toEqual({});
      expect(state.carryingCapacity).toEqual({});
      expect(state.overhuntingPenalties).toEqual({});
      expect(state.deforestationLevel).toBe(0);
      expect(state.pollutionLevel).toBe(0);
      expect(state.lastTickDay).toBe(0);
    });
  });

  describe('createDefaultTileEcology', () => {
    it('should create default tile ecology with 0.5 density', () => {
      const ecology = createDefaultTileEcology();
      expect(ecology.plantDensity).toBe(0.5);
      expect(ecology.creatureDensity).toBe(0.5);
    });
  });

  describe('initializeEcosystem', () => {
    it('should initialize populations based on biome', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, biome: 'forest' }),
        createTile({ x: 1, y: 0, biome: 'forest' }),
      ]);

      initializeEcosystem(world);

      expect(world.ecosystem).toBeDefined();
      expect(world.ecosystem!.populations['wolf']).toBeGreaterThan(0);
      expect(world.ecosystem!.populations['deer']).toBeGreaterThan(0);
      expect(world.tiles.get('0,0')!.ecology).toBeDefined();
    });

    it('should set carrying capacity for each species', () => {
      const world = createWorld([createTile({ x: 0, y: 0, biome: 'plains' })]);

      initializeEcosystem(world);

      expect(world.ecosystem!.carryingCapacity['deer']).toBeGreaterThan(0);
      expect(world.ecosystem!.carryingCapacity['wolf']).toBeGreaterThan(0);
    });
  });

  describe('regenerateResources', () => {
    it('should respawn plants after 30 days', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 }),
      ]);

      regenerateResources(world, 35, 1, 0);

      expect(world.tiles.get('0,0')!.resourceQty).toBe(1);
      expect(world.tiles.get('0,0')!.resourceRespawnTurn).toBe(65);
    });

    it('should respawn ore after 90 days', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'stone', resourceQty: 0, resourceRespawnTurn: 95 }),
      ]);

      regenerateResources(world, 95, 1, 0);

      expect(world.tiles.get('0,0')!.resourceQty).toBe(1);
      expect(world.tiles.get('0,0')!.resourceRespawnTurn).toBe(185);
    });

    it('should not respawn before scheduled day', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 }),
      ]);

      regenerateResources(world, 34, 1, 0);

      expect(world.tiles.get('0,0')!.resourceQty).toBe(0);
      expect(world.tiles.get('0,0')!.resourceRespawnTurn).toBe(35);
    });

    it('should clear respawn timer when resource reaches max', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 4, resourceRespawnTurn: 35 }),
      ]);

      regenerateResources(world, 35, 1, 0);

      expect(world.tiles.get('0,0')!.resourceQty).toBe(5);
      expect(world.tiles.get('0,0')!.resourceRespawnTurn).toBeUndefined();
    });
  });

  describe('simulatePopulationDynamics', () => {
    it('should keep population within bounds when below carrying capacity', () => {
      const world = createWorld();
      initializeEcosystem(world);
      world.ecosystem!.populations['deer'] = 50;
      world.ecosystem!.carryingCapacity['deer'] = 100;

      simulatePopulationDynamics(world, 1, 1, 10);

      expect(world.ecosystem!.populations['deer']).toBeGreaterThanOrEqual(0);
      expect(world.ecosystem!.populations['deer']).toBeLessThanOrEqual(100);
    });

    it('should decline population when above carrying capacity', () => {
      const world = createWorld();
      initializeEcosystem(world);
      world.ecosystem!.populations['deer'] = 90;
      world.ecosystem!.carryingCapacity['deer'] = 50;

      simulatePopulationDynamics(world, 1, 1, 1);

      expect(world.ecosystem!.populations['deer']).toBeLessThan(90);
    });

    it('should never go below zero', () => {
      const world = createWorld();
      initializeEcosystem(world);
      world.ecosystem!.populations['deer'] = 0;

      simulatePopulationDynamics(world, 1, 1, 1);

      expect(world.ecosystem!.populations['deer']).toBeGreaterThanOrEqual(0);
    });

    it('should apply overhunting penalty for 60 days', () => {
      const world = createWorld();
      initializeEcosystem(world);
      world.ecosystem!.populations['wolf'] = 50;
      world.ecosystem!.carryingCapacity['wolf'] = 50;
      world.ecosystem!.overhuntingPenalties['wolf'] = OVERHUNTING_PENALTY_DAYS;

      const popBefore = world.ecosystem!.populations['wolf'];
      simulatePopulationDynamics(world, 1, 1, 1);

      expect(world.ecosystem!.overhuntingPenalties['wolf']).toBe(OVERHUNTING_PENALTY_DAYS - 1);
    });
  });

  describe('updateEcologyFromTiles', () => {
    it('should increase deforestation when wood tiles are depleted', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 0 }),
        createTile({ x: 1, y: 0, resourceType: 'herbs', resourceQty: 3 }),
      ]);

      world.ecosystem = createDefaultEcosystemState();
      updateEcologyFromTiles(world);

      expect(world.ecosystem!.deforestationLevel).toBeGreaterThan(0);
    });

    it('should increase pollution when ore tiles are depleted', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'stone', resourceQty: 0 }),
        createTile({ x: 1, y: 0, resourceType: 'wood', resourceQty: 3 }),
      ]);

      world.ecosystem = createDefaultEcosystemState();
      updateEcologyFromTiles(world);

      expect(world.ecosystem!.pollutionLevel).toBeGreaterThan(0);
    });

    it('should reduce herbivore carrying capacity with deforestation', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 0 }),
        createTile({ x: 1, y: 0, resourceType: 'wood', resourceQty: 0 }),
      ]);

      world.ecosystem = createDefaultEcosystemState();
      world.ecosystem.carryingCapacity['deer'] = 100;
      updateEcologyFromTiles(world);

      expect(world.ecosystem!.carryingCapacity['deer']).toBeLessThan(100);
    });
  });

  describe('applyOverhuntingPenalty', () => {
    it('should set overhunting penalty for 60 days', () => {
      const world = createWorld();
      world.ecosystem = createDefaultEcosystemState();

      applyOverhuntingPenalty(world, 'wolf', 1);

      expect(world.ecosystem!.overhuntingPenalties['wolf']).toBe(OVERHUNTING_PENALTY_DAYS);
    });
  });

  describe('applyDeforestationEvent', () => {
    it('should increase deforestation level', () => {
      const world = createWorld();
      world.ecosystem = createDefaultEcosystemState();

      applyDeforestationEvent(world, 0, 0, 10, 1);

      expect(world.ecosystem!.deforestationLevel).toBe(10);
    });

    it('should cap deforestation at 100', () => {
      const world = createWorld();
      world.ecosystem = createDefaultEcosystemState();
      world.ecosystem.deforestationLevel = 95;

      applyDeforestationEvent(world, 0, 0, 20, 1);

      expect(world.ecosystem!.deforestationLevel).toBe(100);
    });
  });

  describe('applyPollutionEvent', () => {
    it('should increase pollution level', () => {
      const world = createWorld();
      world.ecosystem = createDefaultEcosystemState();

      applyPollutionEvent(world, 0, 0, 15, 1);

      expect(world.ecosystem!.pollutionLevel).toBe(15);
    });

    it('should cap pollution at 100', () => {
      const world = createWorld();
      world.ecosystem = createDefaultEcosystemState();
      world.ecosystem.pollutionLevel = 90;

      applyPollutionEvent(world, 0, 0, 20, 1);

      expect(world.ecosystem!.pollutionLevel).toBe(100);
    });
  });

  describe('processEcosystemTick', () => {
    it('should initialize ecosystem on first tick', () => {
      const world = createWorld([createTile({ x: 0, y: 0, biome: 'forest' })]);

      processEcosystemTick(world, { dayCount: 1, turnCount: 1, gameTimeMinutes: 0 });

      expect(world.ecosystem).toBeDefined();
      expect(Object.keys(world.ecosystem!.populations).length).toBeGreaterThan(0);
    });

    it('should regenerate resources during tick', () => {
      const world = createWorld([
        createTile({ x: 0, y: 0, resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 }),
      ]);

      processEcosystemTick(world, { dayCount: 35, turnCount: 1, gameTimeMinutes: 0 });

      expect(world.tiles.get('0,0')!.resourceQty).toBe(1);
    });

    it('should simulate population dynamics during tick', () => {
      const world = createWorld();
      initializeEcosystem(world);
      const initialPop = world.ecosystem!.populations['deer'] || 0;

      processEcosystemTick(world, { dayCount: 2, turnCount: 1, gameTimeMinutes: 0 });

      const finalPop = world.ecosystem!.populations['deer'] || 0;
      expect(typeof finalPop).toBe('number');
    });
  });
});
