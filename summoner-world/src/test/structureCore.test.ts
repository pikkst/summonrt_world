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
  upgradeTownHall,
  canUpgradeTownHall,
  getTownHallUpgradeInfo,
  setTownHallPolicy,
  getActiveTownHallPolicyTypes,
  getActiveTownHallPolicyCount,
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
    discoveredRumors: [],
    questHistory: {
      active: [],
      completed: [],
    },
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

  describe('T8.8 - Town Hall Upgrade and Regional Policies', () => {
    describe('getTownHallUpgradeInfo', () => {
      it('returns null for non-town structures', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        expect(getTownHallUpgradeInfo(player, 's1')).toBeNull();
      });

      it('returns null at max level', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 5, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        expect(getTownHallUpgradeInfo(player, 's1')).toBeNull();
      });

      it('returns upgrade info for level 1 town', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const info = getTownHallUpgradeInfo(player, 's1');
        expect(info).not.toBeNull();
        expect(info!.cost).toBe(20000);
        expect(info!.nextLevel).toBe(2);
        expect(info!.maxLevel).toBe(5);
      });
    });

    describe('upgradeTownHall', () => {
      it('fails for non-town structure', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures }, money: 50000 });
        const result = upgradeTownHall(player, 's1');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('Not a town hall');
      });

      it('fails at max level', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 5, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const result = upgradeTownHall(player, 's1');
        expect(result.success).toBe(false);
        expect(result.reason).toBe('Max level reached');
      });

      it('fails without enough money', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures }, money: 100 });
        const result = upgradeTownHall(player, 's1');
        expect(result.success).toBe(false);
        expect(result.reason).toContain('Not enough money');
      });

      it('upgrades town hall level and deducts money', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures }, money: 50000 });
        const result = upgradeTownHall(player, 's1');
        expect(result.success).toBe(true);
        expect(result.playerCore.housing.structures[0]!.level).toBe(2);
        expect(result.playerCore.money).toBe(30000);
      });

      it('does not modify original player state on failure', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures }, money: 100 });
        const result = upgradeTownHall(player, 's1');
        expect(result.success).toBe(false);
        expect(result.playerCore.money).toBe(100);
        expect(result.playerCore.housing.structures[0]!.level).toBe(1);
      });
    });

    describe('setTownHallPolicy', () => {
      it('blocks policies for non-town structures', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const updated = setTownHallPolicy(player, 'trade_tariff', true);
        expect(updated.housing.townHallPolicies).toBeUndefined();
      });

      it('blocks policies below required level', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 2, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const updated = setTownHallPolicy(player, 'trade_tariff', true);
        expect(updated.housing.townHallPolicies).toBeUndefined();
      });

      it('unlocks trade_tariff at level 3', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 3, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const updated = setTownHallPolicy(player, 'trade_tariff', true);
        expect(updated.housing.townHallPolicies).toHaveLength(1);
        expect(updated.housing.townHallPolicies![0]!.type).toBe('trade_tariff');
        expect(updated.housing.townHallPolicies![0]!.active).toBe(true);
      });

      it('unlocks creature_protection at level 4', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 4, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const updated = setTownHallPolicy(player, 'creature_protection', true);
        expect(updated.housing.townHallPolicies).toHaveLength(1);
        expect(updated.housing.townHallPolicies![0]!.type).toBe('creature_protection');
      });

      it('unlocks festival_bonus at level 5', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 5, builtAt: 0, ownerId: 'player-1' },
        ];
        const player = createMockPlayerCore({ housing: { structures } });
        const updated = setTownHallPolicy(player, 'festival_bonus', true);
        expect(updated.housing.townHallPolicies).toHaveLength(1);
        expect(updated.housing.townHallPolicies![0]!.type).toBe('festival_bonus');
      });

      it('deactivates policy when set to false', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 3, builtAt: 0, ownerId: 'player-1' },
        ];
        let player = createMockPlayerCore({ housing: { structures } });
        player = setTownHallPolicy(player, 'trade_tariff', true);
        expect(player.housing.townHallPolicies![0]!.active).toBe(true);
        const updated = setTownHallPolicy(player, 'trade_tariff', false);
        expect(updated.housing.townHallPolicies![0]!.active).toBe(false);
      });
    });

    describe('getActiveTownHallPolicyTypes', () => {
      it('returns active policies', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 3, builtAt: 0, ownerId: 'player-1' },
        ];
        let player = createMockPlayerCore({ housing: { structures } });
        player = setTownHallPolicy(player, 'trade_tariff', true);
        expect(getActiveTownHallPolicyTypes(player)).toEqual(['trade_tariff']);
      });

      it('returns empty array when no policies', () => {
        const player = createMockPlayerCore();
        expect(getActiveTownHallPolicyTypes(player)).toEqual([]);
      });
    });

    describe('getActiveTownHallPolicyCount', () => {
      it('counts active policies', () => {
        const structures: Structure[] = [
          { id: 's1', type: 'town', worldId: 1, tileX: 10, tileY: 10, level: 4, builtAt: 0, ownerId: 'player-1' },
        ];
        let player = createMockPlayerCore({ housing: { structures } });
        player = setTownHallPolicy(player, 'trade_tariff', true);
        player = setTownHallPolicy(player, 'creature_protection', true);
        expect(getActiveTownHallPolicyCount(player)).toBe(2);
      });

      it('returns 0 for no policies', () => {
        const player = createMockPlayerCore();
        expect(getActiveTownHallPolicyCount(player)).toBe(0);
      });
    });
  });
});
