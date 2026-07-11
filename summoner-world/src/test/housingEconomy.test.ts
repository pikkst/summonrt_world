import { describe, expect, it } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import type { Structure } from '../types/structure';
import { STRUCTURE_DEFINITIONS } from '../types/structure';
import {
  calculateHousingPassiveIncome,
  calculateResourceRefinement,
  processHousingEconomyTick,
} from '../core/playerCore/housingEconomy';

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

function createMockStructure(overrides: Partial<Structure> = {}): Structure {
  return {
    id: 'structure-1',
    type: 'house',
    worldId: 1,
    tileX: 100,
    tileY: 100,
    level: 1,
    builtAt: 0,
    ownerId: 'player-1',
    ...overrides,
  };
}

describe('T8.7 - Housing Economic Impact', () => {
  describe('calculateHousingPassiveIncome', () => {
    it('returns 0 for empty structures', () => {
      expect(calculateHousingPassiveIncome([])).toBe(0);
    });

    it('sums passive income rates for all structures', () => {
      const structures = [
        createMockStructure({ type: 'house' }),
        createMockStructure({ type: 'farm' }),
        createMockStructure({ type: 'workshop' }),
      ];
      expect(calculateHousingPassiveIncome(structures)).toBe(1 + 2 + 3);
    });

    it('returns correct rate for manor', () => {
      const structures = [createMockStructure({ type: 'manor' })];
      expect(calculateHousingPassiveIncome(structures)).toBe(STRUCTURE_DEFINITIONS.manor.passiveIncomeRate);
    });

    it('returns correct rate for castle', () => {
      const structures = [createMockStructure({ type: 'castle' })];
      expect(calculateHousingPassiveIncome(structures)).toBe(STRUCTURE_DEFINITIONS.castle.passiveIncomeRate);
    });

    it('returns correct rate for town', () => {
      const structures = [createMockStructure({ type: 'town' })];
      expect(calculateHousingPassiveIncome(structures)).toBe(STRUCTURE_DEFINITIONS.town.passiveIncomeRate);
    });
  });

  describe('calculateResourceRefinement', () => {
    it('returns no resources for empty structures', () => {
      expect(calculateResourceRefinement([])).toEqual([]);
    });

    it('returns no resources for structures with empty refinement tables', () => {
      const structures = [createMockStructure({ type: 'house' })];
      expect(calculateResourceRefinement(structures, () => 0)).toEqual([]);
    });

    it('produces refined resources when chance succeeds', () => {
      const structures = [createMockStructure({ type: 'farm' })];
      const results = calculateResourceRefinement(structures, () => 0.05);
      expect(results).toEqual([{ templateKey: 'basic_food', quantity: 1 }]);
    });

    it('does not produce refined resources when chance fails', () => {
      const structures = [createMockStructure({ type: 'farm' })];
      const results = calculateResourceRefinement(structures, () => 1.0);
      expect(results).toEqual([]);
    });

    it('produces multiple refined resources from different structures', () => {
      const structures = [
        createMockStructure({ type: 'farm' }),
        createMockStructure({ type: 'workshop' }),
      ];
      const results = calculateResourceRefinement(structures, () => 0.05);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('processHousingEconomyTick', () => {
    it('returns unchanged player when no structures', () => {
      const player = createMockPlayerCore();
      const result = processHousingEconomyTick(player);
      expect(result.money).toBe(player.money);
      expect(result.inventory).toBe(player.inventory);
    });

    it('adds passive income to player money', () => {
      const structures = [createMockStructure({ type: 'house' })];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      const result = processHousingEconomyTick(player, () => 0);
      expect(result.money).toBe(1001);
    });

    it('adds refined resources to inventory', () => {
      const structures = [createMockStructure({ type: 'farm' })];
      const player = createMockPlayerCore({ housing: { structures } });
      const result = processHousingEconomyTick(player, () => 0.05);
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0]?.templateKey).toBe('basic_food');
      expect(result.inventory[0]?.quantity).toBe(1);
    });

    it('does not modify original player state', () => {
      const structures = [createMockStructure({ type: 'house' })];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      processHousingEconomyTick(player);
      expect(player.money).toBe(1000);
    });

    it('handles multiple structures correctly', () => {
      const structures = [
        createMockStructure({ type: 'house' }),
        createMockStructure({ type: 'farm' }),
      ];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      const result = processHousingEconomyTick(player, () => 0);
      expect(result.money).toBe(1003);
    });
  });

  describe('T8.8 - Town Hall Policy Bonuses', () => {
    it('adds town hall level bonus to passive income', () => {
      const structures = [createMockStructure({ type: 'town', level: 3 })];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      const result = processHousingEconomyTick(player, () => 0);
      const baseTownIncome = STRUCTURE_DEFINITIONS.town.passiveIncomeRate;
      const townHallBonus = 20;
      const tax = Math.floor((baseTownIncome + townHallBonus) * 0.1);
      expect(result.money).toBe(1000 + baseTownIncome + townHallBonus - tax);
    });

    it('applies festival bonus multiplier when active', () => {
      const structures = [createMockStructure({ type: 'town', level: 5 })];
      const player = createMockPlayerCore({
        housing: { structures, townHallPolicies: [{ type: 'festival_bonus', active: true }] },
        money: 1000,
      });
      const result = processHousingEconomyTick(player, () => 0);
      const baseTownIncome = STRUCTURE_DEFINITIONS.town.passiveIncomeRate;
      const townHallBonus = 50;
      const gross = Math.floor((baseTownIncome + townHallBonus) * 1.15);
      const tax = Math.floor(gross * 0.1);
      expect(result.money).toBe(1000 + gross - tax);
    });

    it('does not apply festival bonus when inactive', () => {
      const structures = [createMockStructure({ type: 'town', level: 5 })];
      const player = createMockPlayerCore({
        housing: { structures, townHallPolicies: [{ type: 'festival_bonus', active: false }] },
        money: 1000,
      });
      const result = processHousingEconomyTick(player, () => 0);
      const baseTownIncome = STRUCTURE_DEFINITIONS.town.passiveIncomeRate;
      const townHallBonus = 50;
      const tax = Math.floor((baseTownIncome + townHallBonus) * 0.1);
      expect(result.money).toBe(1000 + baseTownIncome + townHallBonus - tax);
    });

    it('applies no multiplier when no policies are set', () => {
      const structures = [createMockStructure({ type: 'house' })];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      const result = processHousingEconomyTick(player, () => 0);
      expect(result.money).toBe(1001);
    });
  });

  describe('T8.13 - Inflation sinks inside housing tick', () => {
    it('deducts housing tax from gross income', () => {
      const structures = [createMockStructure({ type: 'town', level: 5 })];
      const player = createMockPlayerCore({ housing: { structures }, money: 1000 });
      const result = processHousingEconomyTick(player, () => 1);
      const baseTownIncome = STRUCTURE_DEFINITIONS.town.passiveIncomeRate;
      const townHallBonus = 50;
      const tax = Math.floor((baseTownIncome + townHallBonus) * 0.1);
      expect(result.money).toBe(1000 + baseTownIncome + townHallBonus - tax);
    });

    it('decays fusion materials each tick', () => {
      const player = createMockPlayerCore({
        housing: { structures: [] },
        inventory: [{ templateKey: 'soul_crystal_common', quantity: 5, category: 'contract', rarity: 'common', binding: 'tradeable', addedAt: 0 }] as any,
      });
      const result = processHousingEconomyTick(player, () => 0.001);
      const crystal = result.inventory.find((i) => i.templateKey === 'soul_crystal_common');
      expect(crystal?.quantity).toBe(4);
    });

    it('does not decay fusion materials when rng fails', () => {
      const player = createMockPlayerCore({
        housing: { structures: [] },
        inventory: [{ templateKey: 'soul_crystal_common', quantity: 5, category: 'contract', rarity: 'common', binding: 'tradeable', addedAt: 0 }] as any,
      });
      const result = processHousingEconomyTick(player, () => 0.99);
      const crystal = result.inventory.find((i) => i.templateKey === 'soul_crystal_common');
      expect(crystal?.quantity).toBe(5);
    });
  });
});
