import { describe, expect, it } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import type { Structure } from '../types/structure';
import type { TileData } from '../types/game';
import {
  TOWN_FOUNDING_MIN_BUILDINGS,
  TOWN_FOUNDING_MIN_WORLD_ID,
  getBuildingCount,
  isTownFoundingEligible,
  canFoundTown,
  foundTown,
  getTownFoundingRequirements,
  getFoundedTowns,
} from '../core/playerCore/townFounding';

function createMockPlayerCore(overrides: Partial<PlayerCoreState> = {}): PlayerCoreState {
  return {
    identity: { id: 'player-1', name: 'Test', gender: 'unknown', appearance: {} },
    summonerProfile: { class: 'elementalist', archetype: 'summoner', startingWorldId: 1 },
    level: 50,
    experience: 0n,
    elements: { primary: 'fire' },
    class: 'elementalist',
    primaryStats: {
      strength: 10, vitality: 10, intelligence: 10, dexterity: 10, wisdom: 10, luck: 10,
    },
    secondaryStats: {
      maxHealth: 100, maxMana: 100, maxStamina: 100, movement: 100, criticalChance: 5,
      elementalMastery: 0, contractCapacity: 3, commandSpeed: 100, creatureBondPower: 100,
      inventoryCapacity: 50, craftingEfficiency: 100, tradeInfluence: 100, reputationGain: 100,
      summoningCost: 100, travelUtility: 100,
    },
    inventory: [],
    equipment: [],
    skills: [],
    talents: [],
    titles: [],
    achievements: [],
    statistics: {
      worldsUnlocked: 15, creaturesContracted: 0, dungeonsCleared: 0, itemsCrafted: 0,
      tradesCompleted: 0, goldEarned: 0, bossesDefeated: 0, pvpWins: 0, housingValue: 0,
      guildContributions: 0, questsCompleted: 0,
    },
    reputation: { world_rep: {}, faction_rep: {}, settlement_rep: {}, creature_rep: {} },
    discoveredRumors: [],
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
    worldUnlocks: { unlockedWorlds: [15], activeWorldId: 15 },
    fastTravel: { points: [], discoveredPointIds: new Set(), activeTravel: undefined },
    saveMetadata: { lastSavedAt: '', playtimeSeconds: 0, saveVersion: '2.0.0' },
    resources: {
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 15, max: 15, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
    },
    position: { worldId: 15, x: 10, y: 10 },
    settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
    money: 100000,
    skillPoints: 0,
    dayCount: 1,
    gameTimeMinutes: 420,
    ...overrides,
  };
}

function createBuilding(worldId: number, x: number, type: Structure['type'] = 'house'): Structure {
  return { id: `s_${worldId}_${x}`, type, worldId, tileX: x, tileY: 0, level: 1, builtAt: 0, ownerId: 'player-1' };
}

function createMockTile(overrides: Partial<TileData> = {}): TileData {
  return { x: 100, y: 100, biome: 'plains', discovered: true, explored: false, ...overrides };
}

function withBuildings(count: number, worldId = 15): PlayerCoreState {
  const structures: Structure[] = [];
  for (let i = 0; i < count; i++) {
    structures.push(createBuilding(worldId, 2000 + i * 51));
  }
  return createMockPlayerCore({ housing: { structures } });
}

const PROPOSED_TOWN_X = 1000;
const PROPOSED_TOWN_Y = 1000;

describe('T8.9 - Town Founding', () => {
  describe('getBuildingCount', () => {
    it('counts non-town structures in a world', () => {
      const player = withBuildings(5);
      expect(getBuildingCount(player, 15)).toBe(5);
    });

    it('excludes towns from the building count', () => {
      const structures: Structure[] = [
        createBuilding(15, 0),
        createBuilding(15, 1, 'town'),
      ];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(getBuildingCount(player, 15)).toBe(1);
    });

    it('only counts buildings in the target world', () => {
      const structures: Structure[] = [
        createBuilding(15, 0),
        createBuilding(15, 1),
        createBuilding(5, 0),
      ];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(getBuildingCount(player, 15)).toBe(2);
      expect(getBuildingCount(player, 5)).toBe(1);
    });
  });

  describe('isTownFoundingEligible', () => {
    it('is true with 5 buildings in world 15', () => {
      expect(isTownFoundingEligible(withBuildings(5), 15)).toBe(true);
    });

    it('is false with fewer than 5 buildings', () => {
      expect(isTownFoundingEligible(withBuildings(4), 15)).toBe(false);
    });

    it('is false below world 15 even with enough buildings', () => {
      expect(isTownFoundingEligible(withBuildings(5), 14)).toBe(false);
    });
  });

  describe('canFoundTown', () => {
    it('blocks founding below world 15', () => {
      const player = withBuildings(6);
      const result = canFoundTown(player, 14, 0, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toContain(`world ${TOWN_FOUNDING_MIN_WORLD_ID}`);
    });

    it('blocks founding with fewer than 5 buildings in the target world', () => {
      const player = withBuildings(4);
      const result = canFoundTown(player, 15, 0, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toContain(`at least ${TOWN_FOUNDING_MIN_BUILDINGS} buildings`);
    });

    it('blocks founding in a different world than the buildings', () => {
      const player = withBuildings(5, 14);
      const result = canFoundTown(player, 15, 0, 0);
      expect(result.success).toBe(false);
    });

    it('enforces town distance requirements alongside founding rules', () => {
      const structures: Structure[] = [];
      for (let i = 0; i < 5; i++) structures.push(createBuilding(15, 2000 + i * 51));
      const player = createMockPlayerCore({
        level: 40,
        money: 50000,
        housing: { structures },
      });
      const tile = createMockTile({ biome: 'volcanic', x: 100, y: 100 });
      const result = canFoundTown(player, 15, 100, 100, tile);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid biome');
    });

    it('allows founding when all rules are met', () => {
      const player = withBuildings(5);
      const result = canFoundTown(player, 15, PROPOSED_TOWN_X, PROPOSED_TOWN_Y);
      expect(result.success).toBe(true);
    });

    it('allows founding on a valid tile when all rules are met', () => {
      const player = withBuildings(5);
      const tile = createMockTile({ biome: 'plains', discovered: true, x: PROPOSED_TOWN_X, y: PROPOSED_TOWN_Y });
      const result = canFoundTown(player, 15, PROPOSED_TOWN_X, PROPOSED_TOWN_Y, tile);
      expect(result.success).toBe(true);
    });
  });

  describe('foundTown', () => {
    it('places a town and deducts cost when eligible', () => {
      const player = withBuildings(5);
      const { playerCore, result } = foundTown(player, 15, PROPOSED_TOWN_X, PROPOSED_TOWN_Y);
      expect(result.success).toBe(true);
      expect(result.structure?.type).toBe('town');
      expect(playerCore.housing.structures).toHaveLength(6);
      expect(playerCore.money).toBe(100000 - 20000);
    });

    it('does not mutate the original player core on failure', () => {
      const player = withBuildings(3);
      const { playerCore, result } = foundTown(player, 15, 100, 100);
      expect(result.success).toBe(false);
      expect(playerCore.housing.structures).toHaveLength(3);
      expect(playerCore.money).toBe(100000);
    });
  });

  describe('getTownFoundingRequirements', () => {
    it('reports eligibility and requirement status', () => {
      const player = withBuildings(5);
      const req = getTownFoundingRequirements(player, 15);
      expect(req.buildingCount).toBe(5);
      expect(req.minBuildings).toBe(TOWN_FOUNDING_MIN_BUILDINGS);
      expect(req.minWorldId).toBe(TOWN_FOUNDING_MIN_WORLD_ID);
      expect(req.worldUnlocked).toBe(true);
      expect(req.meetsBuildingRequirement).toBe(true);
      expect(req.eligible).toBe(true);
    });

    it('reports ineligible status with insufficient buildings', () => {
      const req = getTownFoundingRequirements(withBuildings(2), 15);
      expect(req.meetsBuildingRequirement).toBe(false);
      expect(req.eligible).toBe(false);
    });
  });

  describe('getFoundedTowns', () => {
    it('returns only town structures', () => {
      const structures: Structure[] = [createBuilding(15, 0), createBuilding(15, 1, 'town')];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(getFoundedTowns(player)).toHaveLength(1);
      expect(getFoundedTowns(player, 15)).toHaveLength(1);
      expect(getFoundedTowns(player, 5)).toHaveLength(0);
    });
  });
});
