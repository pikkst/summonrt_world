import { describe, expect, it } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import type { Structure, TownHallPolicy } from '../types/structure';
import {
  calculateTownHallIncomeBonus,
  calculateActivePolicyMultipliers,
  getPassiveIncomeBonusPct,
  getTradeTariffDiscount,
  getCreatureProtectionBonus,
  getTownHallEffectSummary,
} from '../core/playerCore/townHallPolicy';

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

function createMockTownHall(overrides: Partial<Structure> = {}): Structure {
  return {
    id: 'town-1',
    type: 'town',
    worldId: 1,
    tileX: 100,
    tileY: 100,
    level: 1,
    builtAt: 0,
    ownerId: 'player-1',
    ...overrides,
  };
}

describe('T8.8 - Town Hall Policy', () => {
  describe('calculateTownHallIncomeBonus', () => {
    it('returns 0 when no town hall exists', () => {
      const player = createMockPlayerCore();
      expect(calculateTownHallIncomeBonus(player)).toBe(0);
    });

    it('returns correct bonus for level 3 town hall', () => {
      const structures = [createMockTownHall({ level: 3 })];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(calculateTownHallIncomeBonus(player)).toBe(20);
    });

    it('returns correct bonus for level 5 town hall', () => {
      const structures = [createMockTownHall({ level: 5 })];
      const player = createMockPlayerCore({ housing: { structures } });
      expect(calculateTownHallIncomeBonus(player)).toBe(50);
    });
  });

  describe('getPassiveIncomeBonusPct', () => {
    it('returns 0 when no policies', () => {
      expect(getPassiveIncomeBonusPct(undefined)).toBe(0);
    });

    it('returns 15 when festival bonus is active', () => {
      const policies: TownHallPolicy[] = [{ type: 'festival_bonus', active: true }];
      expect(getPassiveIncomeBonusPct(policies)).toBe(15);
    });

    it('returns 0 when festival bonus is inactive', () => {
      const policies: TownHallPolicy[] = [{ type: 'festival_bonus', active: false }];
      expect(getPassiveIncomeBonusPct(policies)).toBe(0);
    });
  });

  describe('calculateActivePolicyMultipliers', () => {
    it('returns 1 when no policies', () => {
      expect(calculateActivePolicyMultipliers(undefined)).toBe(1);
    });

    it('applies festival bonus multiplier', () => {
      const policies: TownHallPolicy[] = [{ type: 'festival_bonus', active: true }];
      expect(calculateActivePolicyMultipliers(policies)).toBeCloseTo(1.15);
    });

    it('returns 1 when festival bonus is inactive', () => {
      const policies: TownHallPolicy[] = [{ type: 'festival_bonus', active: false }];
      expect(calculateActivePolicyMultipliers(policies)).toBe(1);
    });
  });

  describe('getTradeTariffDiscount', () => {
    it('returns 0 by default', () => {
      expect(getTradeTariffDiscount({})).toBe(0);
    });

    it('returns trade cost modifier', () => {
      expect(getTradeTariffDiscount({ trade_cost_pct: -10 })).toBe(-10);
    });
  });

  describe('getCreatureProtectionBonus', () => {
    it('returns 0 by default', () => {
      expect(getCreatureProtectionBonus({})).toBe(0);
    });

    it('returns capture bonus', () => {
      expect(getCreatureProtectionBonus({ creature_capture_pct: 5 })).toBe(5);
    });
  });

  describe('getTownHallEffectSummary', () => {
    it('returns empty for no policies', () => {
      const player = createMockPlayerCore();
      expect(getTownHallEffectSummary(player)).toEqual([]);
    });

    it('returns summary for active policies', () => {
      const structures = [createMockTownHall({ level: 3 })];
      let player = createMockPlayerCore({ housing: { structures } });
      player = {
        ...player,
        housing: {
          ...player.housing,
          townHallPolicies: [{ type: 'trade_tariff', active: true }],
        },
      };
      const summary = getTownHallEffectSummary(player);
      expect(summary).toHaveLength(1);
      expect(summary[0]!.policy).toBe('trade_tariff');
      expect(summary[0]!.active).toBe(true);
      expect(summary[0]!.category).toBe('trade_cost');
    });
  });
});
