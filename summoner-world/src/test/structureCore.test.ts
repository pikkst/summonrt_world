import { describe, expect, it } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import type { Structure } from '../types/structure';
import type { TileData } from '../types/game';
import {
  getStructureDefinition,
  getAllStructureDefinitions,
  isValidStructureType,
  canPlaceStructure,
  canPlaceStructureOnTile,
  placeStructure,
  hasStructureType,
  getStructuresOfType,
  getStructureById,
  getAllStructures,
  getStructuresInWorld,
} from '../core/playerCore/structureCore';

function createMockPlayerCore(overrides: Partial<PlayerCoreState> = {}): PlayerCoreState {
  return {
    identity: { id: 'player-1', name: 'Test', gender: 'unknown', appearance: {} },
    summonerProfile: { class: 'elementalist', archetype: 'summoner', startingWorldId: 1 },
    level: 1,
    experience: 0n,
    elements: { primary: 'fire' },
    class: 'elementalist',
    primaryStats: {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    },
    secondaryStats: {
      maxHealth: 100,
      maxMana: 100,
      maxStamina: 100,
      movement: 100,
      criticalChance: 5,
      elementalMastery: 0,
      contractCapacity: 3,
      commandSpeed: 100,
      creatureBondPower: 100,
      inventoryCapacity: 50,
      craftingEfficiency: 100,
      tradeInfluence: 100,
      reputationGain: 100,
      summoningCost: 100,
      travelUtility: 100,
    },
    inventory: [],
    equipment: [],
    skills: [],
    talents: [],
    titles: [],
    achievements: [],
    statistics: {
      worldsUnlocked: 1,
      creaturesContracted: 0,
      dungeonsCleared: 0,
      itemsCrafted: 0,
      tradesCompleted: 0,
      goldEarned: 0,
      bossesDefeated: 0,
      pvpWins: 0,
      housingValue: 0,
      guildContributions: 0,
      questsCompleted: 0,
    },
    reputation: {
      world_rep: {},
      faction_rep: {},
      settlement_rep: {},
      creature_rep: {},
    },
    questHistory: { active: [], completed: [] },
    creatureContracts: [],
    creatureSlots: {
      groups: [
        { type: 'active_combat', max: 3, assigned: [] },
        { type: 'reserve', max: 3, assigned: [] },
        { type: 'utility', max: 2, assigned: [] },
        { type: 'housing', max: 2, assigned: [] },
        { type: 'marketplace', max: 1, assigned: [] },
        { type: 'breeding', max: 1, assigned: [] },
      ],
    },
    housing: { structures: [] },
    worldUnlocks: { unlockedWorlds: [1], activeWorldId: 1 },
    fastTravel: { points: [], discoveredPointIds: new Set(), activeTravel: undefined },
    saveMetadata: { lastSavedAt: '', playtimeSeconds: 0, saveVersion: '2.0.0' },
    resources: {
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 15, max: 15, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
    },
    position: { worldId: 1, x: 10, y: 10 },
    settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
    money: 1000,
    skillPoints: 0,
    dayCount: 1,
    gameTimeMinutes: 420,
    ...overrides,
  };
}

function createMockTile(overrides: Partial<TileData> = {}): TileData {
  return {
    x: 100,
    y: 100,
    biome: 'plains',
    discovered: true,
    explored: false,
    ...overrides,
  };
}

describe('T8.6 - Structure Model and Placement', () => {
  describe('getStructureDefinition', () => {
    it('returns definition for valid structure type', () => {
      const def = getStructureDefinition('house');
      expect(def.type).toBe('house');
      expect(def.name).toBe('House');
    });

    it('returns castle definition with high requirements', () => {
      const def = getStructureDefinition('castle');
      expect(def.minWorldId).toBe(10);
      expect(def.minPlayerLevel).toBe(25);
      expect(def.cost).toBe(5000);
    });
  });

  describe('getAllStructureDefinitions', () => {
    it('returns all six structure types', () => {
      const defs = getAllStructureDefinitions();
      expect(Object.keys(defs)).toHaveLength(6);
      expect(defs['house']).toBeDefined();
      expect(defs['farm']).toBeDefined();
      expect(defs['workshop']).toBeDefined();
      expect(defs['manor']).toBeDefined();
      expect(defs['castle']).toBeDefined();
      expect(defs['town']).toBeDefined();
    });
  });

  describe('isValidStructureType', () => {
    it('returns true for valid types', () => {
      expect(isValidStructureType('house')).toBe(true);
      expect(isValidStructureType('town')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isValidStructureType('inn')).toBe(false);
      expect(isValidStructureType('')).toBe(false);
    });
  });

  describe('canPlaceStructure', () => {
    it('blocks placement when player level is too low', () => {
      const player = createMockPlayerCore({ level: 5 });
      const result = canPlaceStructure(player, 1, 100, 100, 'manor');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('level');
    });

    it('blocks placement when world is too low', () => {
      const player = createMockPlayerCore({ level: 25 });
      const result = canPlaceStructure(player, 1, 100, 100, 'castle');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('world');
    });

    it('blocks placement when player has insufficient money', () => {
      const player = createMockPlayerCore({ level: 25, money: 100 });
      const result = canPlaceStructure(player, 10, 100, 100, 'castle');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('money');
    });

    it('blocks placement when tile is already occupied', () => {
      const player = createMockPlayerCore({
        level: 25,
        money: 10000,
        housing: {
          structures: [
            {
              id: 's1',
              type: 'house',
              worldId: 10,
              tileX: 100,
              tileY: 100,
              level: 1,
              builtAt: 0,
              ownerId: 'player-1',
            },
          ],
        },
      });
      const result = canPlaceStructure(player, 10, 100, 100, 'farm');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('occupied');
    });

    it('blocks placement when too close to another structure', () => {
      const player = createMockPlayerCore({
        level: 25,
        money: 10000,
        housing: {
          structures: [
            {
              id: 's1',
              type: 'house',
              worldId: 10,
              tileX: 100,
              tileY: 100,
              level: 1,
              builtAt: 0,
              ownerId: 'player-1',
            },
          ],
        },
      });
      const result = canPlaceStructure(player, 10, 110, 100, 'castle');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Too close');
    });

    it('allows placement when all requirements are met', () => {
      const player = createMockPlayerCore({ level: 25, money: 10000 });
      const result = canPlaceStructure(player, 10, 100, 100, 'castle');
      expect(result.success).toBe(true);
    });
  });

  describe('canPlaceStructureOnTile', () => {
    it('blocks placement on undiscovered tile', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ discovered: false });
      const result = canPlaceStructureOnTile(player, 1, 100, 100, 'house', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not discovered');
    });

    it('blocks placement on invalid biome', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ biome: 'volcanic' });
      const result = canPlaceStructureOnTile(player, 1, 100, 100, 'farm', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid biome');
    });

    it('blocks placement on dungeon special tile', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ specialType: 'dungeon' });
      const result = canPlaceStructureOnTile(player, 1, 100, 100, 'house', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Cannot place');
    });

    it('allows placement on valid tile', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ biome: 'plains', discovered: true });
      const result = canPlaceStructureOnTile(player, 1, 100, 100, 'house', tile);
      expect(result.success).toBe(true);
    });
  });

  describe('placeStructure', () => {
    it('creates a structure and deducts money', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const { playerCore, result } = placeStructure(player, 1, 100, 100, 'house');
      expect(result.success).toBe(true);
      expect(result.structure).toBeDefined();
      expect(result.structure?.type).toBe('house');
      expect(playerCore.money).toBe(900);
      expect(playerCore.housing.structures).toHaveLength(1);
    });

    it('does not modify player core on failed placement', () => {
      const player = createMockPlayerCore({ level: 1, money: 10 });
      const { playerCore, result } = placeStructure(player, 1, 100, 100, 'castle');
      expect(result.success).toBe(false);
      expect(playerCore.money).toBe(10);
      expect(playerCore.housing.structures).toHaveLength(0);
    });

    it('blocks placement on invalid biome when tile is provided', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ biome: 'volcanic', discovered: true });
      const { playerCore, result } = placeStructure(player, 1, 100, 100, 'farm', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid biome');
      expect(playerCore.housing.structures).toHaveLength(0);
    });

    it('blocks placement on undiscovered tile when tile is provided', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ biome: 'plains', discovered: false });
      const { playerCore, result } = placeStructure(player, 1, 100, 100, 'house', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not discovered');
      expect(playerCore.housing.structures).toHaveLength(0);
    });

    it('blocks placement on dungeon special tile when tile is provided', () => {
      const player = createMockPlayerCore({ level: 1, money: 1000 });
      const tile = createMockTile({ biome: 'plains', discovered: true, specialType: 'dungeon' });
      const { playerCore, result } = placeStructure(player, 1, 100, 100, 'house', tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Cannot place');
      expect(playerCore.housing.structures).toHaveLength(0);
    });
  });

  describe('hasStructureType', () => {
    it('returns true when player has the structure type', () => {
      const player = createMockPlayerCore({
        housing: {
          structures: [
            { id: 's1', type: 'workshop', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
          ],
        },
      });
      expect(hasStructureType(player, 'workshop')).toBe(true);
      expect(hasStructureType(player, 'house')).toBe(false);
    });
  });

  describe('getStructuresOfType', () => {
    it('filters structures by type', () => {
      const player = createMockPlayerCore({
        housing: {
          structures: [
            { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
            { id: 's2', type: 'house', worldId: 1, tileX: 20, tileY: 20, level: 1, builtAt: 0, ownerId: 'player-1' },
            { id: 's3', type: 'farm', worldId: 1, tileX: 30, tileY: 30, level: 1, builtAt: 0, ownerId: 'player-1' },
          ],
        },
      });
      const houses = getStructuresOfType(player, 'house');
      expect(houses).toHaveLength(2);
      expect(getStructuresOfType(player, 'farm')).toHaveLength(1);
    });
  });

  describe('getStructureById', () => {
    it('finds structure by id', () => {
      const structures: Structure[] = [
        { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
      ];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(getStructureById(player, 's1')?.id).toBe('s1');
      expect(getStructureById(player, 'missing')).toBeUndefined();
    });
  });

  describe('getAllStructures', () => {
    it('returns a copy of all structures', () => {
      const structures: Structure[] = [
        { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
      ];
      const player = createMockPlayerCore({ housing: { structures } });
      const all = getAllStructures(player);
      expect(all).toHaveLength(1);
      expect(all).not.toBe(structures);
    });
  });

  describe('getStructuresInWorld', () => {
    it('filters structures by world', () => {
      const structures: Structure[] = [
        { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        { id: 's2', type: 'farm', worldId: 5, tileX: 20, tileY: 20, level: 1, builtAt: 0, ownerId: 'player-1' },
      ];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(getStructuresInWorld(player, 1)).toHaveLength(1);
      expect(getStructuresInWorld(player, 5)).toHaveLength(1);
      expect(getStructuresInWorld(player, 99)).toHaveLength(0);
    });
  });
});
