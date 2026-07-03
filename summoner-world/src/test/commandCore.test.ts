import { describe, it, expect } from 'vitest';
import {
  hasCommandPermission,
  validateCommand,
  checkCommandEligibility,
  resolveCommandWithAI,
  getAvailableCommands,
  createDefaultCommandPermissions,
  COMMAND_PERMISSIONS,
} from '../core/playerCore/commandCore';

import type { CreatureContract, PlayerCoreState } from '../types/playerCore';
import type { CreatureInstance } from '../types/game';

const createMockCreatureInstance = (overrides: Partial<CreatureInstance> = {}): CreatureInstance => ({
  id: 'creature-1',
  templateKey: 'test_creature',
  level: 5,
  experience: 0n,
  currentHealth: 100,
  currentMana: 50,
  maxHealth: 100,
  maxMana: 50,
  attack: 10,
  defense: 5,
  speed: 10,
  class: 'beast',
  skills: [],
  traits: [],
  mutations: [],
  affection: 50,
  type: 'beast',
  elements: ['fire'],
  baseExpValue: 10,
  evolutionStage: 0,
  ...overrides,
});

const createMockContract = (overrides: Partial<CreatureContract> = {}): CreatureContract => ({
  id: 'contract-1',
  templateKey: 'test_creature',
  nickname: 'Test Creature',
  bondLevel: 5,
  trust: 50,
  loyalty: 50,
  contractStability: 100,
  elementCompatibility: 100,
  commandPermissions: ['follow', 'attack', 'defend', 'retreat', 'scout', 'protect_ally'],
  tradeStatus: 'bound',
  breedingRights: false,
  pvpEligibility: false,
  contractedAt: Date.now(),
  instance: createMockCreatureInstance(),
  ...overrides,
});

const createMockState = (overrides: Partial<PlayerCoreState> = {}): PlayerCoreState => ({
  identity: { id: 'player-1', name: 'Test Player', gender: 'unknown', appearance: {} },
  summonerProfile: { class: 'elementalist', startingWorldId: 1 },
  level: 1,
  experience: 0n,
  elements: { primary: 'fire' },
  class: 'elementalist',
  primaryStats: { strength: 10, vitality: 10, intelligence: 10, dexterity: 10, wisdom: 10, luck: 10 },
  secondaryStats: {
    maxHealth: 100,
    maxMana: 50,
    maxStamina: 100,
    movement: 5,
    criticalChance: 5,
    elementalMastery: 10,
    contractCapacity: 5,
    commandSpeed: 100,
    creatureBondPower: 100,
    inventoryCapacity: 20,
    craftingEfficiency: 100,
    tradeInfluence: 100,
    reputationGain: 100,
    summoningCost: 100,
    travelUtility: 0,
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
  reputation: { world_rep: {}, faction_rep: {}, settlement_rep: {}, creature_rep: {} },
  questHistory: { active: [], completed: [] },
  creatureContracts: [createMockContract()],
  creatureSlots: { groups: [] },
  housing: {},
  worldUnlocks: { unlockedWorlds: [1], activeWorldId: 1 },
  saveMetadata: { lastSavedAt: new Date().toISOString(), playtimeSeconds: 0, saveVersion: '1.0.0' },
  resources: {
    energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
    happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
  },
  position: { worldId: 1, x: 10, y: 10 },
  settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
  money: 1000,
  skillPoints: 0,
  dayCount: 1,
  gameTimeMinutes: 420,
  ...overrides,
});

describe('commandCore', () => {
  describe('COMMAND_PERMISSIONS', () => {
    it('contains all 13 documented commands', () => {
      expect(COMMAND_PERMISSIONS).toHaveLength(13);
      expect(COMMAND_PERMISSIONS).toEqual([
        'follow',
        'stay',
        'guard',
        'attack',
        'defend',
        'retreat',
        'scout',
        'gather',
        'track',
        'interact',
        'use_ability',
        'protect_ally',
        'avoid_combat',
      ]);
    });
  });

  describe('hasCommandPermission', () => {
    it('returns true for granted permission', () => {
      const contract = createMockContract();
      expect(hasCommandPermission(contract, 'follow')).toBe(true);
    });

    it('returns false for missing permission', () => {
      const contract = createMockContract();
      expect(hasCommandPermission(contract, 'guard')).toBe(false);
    });
  });

  describe('validateCommand', () => {
    it('returns valid when permission exists', () => {
      const contract = createMockContract();
      const result = validateCommand(contract, 'follow');
      expect(result.valid).toBe(true);
      expect(result.hasPermission).toBe(true);
    });

    it('returns invalid when permission missing', () => {
      const contract = createMockContract();
      const result = validateCommand(contract, 'guard');
      expect(result.valid).toBe(false);
      expect(result.hasPermission).toBe(false);
      expect(result.reason).toContain('does not have permission');
    });
  });

  describe('checkCommandEligibility', () => {
    it('returns valid when permission exists and stability is sufficient', () => {
      const contract = createMockContract();
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false };
      const result = checkCommandEligibility(contract, 'follow', context);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when contract stability is below threshold', () => {
      const contract = createMockContract({ contractStability: 10 });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false };
      const result = checkCommandEligibility(contract, 'follow', context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('stability');
    });

    it('restricts scout during combat', () => {
      const contract = createMockContract();
      const context = { worldId: 1, locationType: 'world' as const, inCombat: true };
      const result = checkCommandEligibility(contract, 'scout', context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('combat');
    });

    it('restricts attack outside combat and PvP arenas', () => {
      const contract = createMockContract();
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false };
      const result = checkCommandEligibility(contract, 'attack', context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside of combat');
    });

    it('allows attack in PvP arena outside combat', () => {
      const contract = createMockContract();
      const context = { worldId: 1, locationType: 'pvp_arena' as const, inCombat: false };
      const result = checkCommandEligibility(contract, 'attack', context);
      expect(result.valid).toBe(true);
    });
  });

  describe('resolveCommandWithAI', () => {
    it('returns success for valid follow command with high loyalty', () => {
      const contract = createMockContract({
        loyalty: 80,
        trust: 80,
        bondLevel: 10,
        instance: createMockCreatureInstance({ affection: 80 }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false };
      const result = resolveCommandWithAI(contract, 'follow', context);
      expect(result.success).toBe(true);
      expect(result.command).toBe('follow');
      expect(result.message).toContain('obeys');
    });

    it('returns failure when contract stability is too low', () => {
      const contract = createMockContract({ contractStability: 15 });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false };
      const result = resolveCommandWithAI(contract, 'follow', context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('stability');
    });

    it('applies positive effects on success', () => {
      const contract = createMockContract({
        loyalty: 60,
        trust: 60,
        bondLevel: 5,
        instance: createMockCreatureInstance({ affection: 60 }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false, dangerLevel: 0 };
      const result = resolveCommandWithAI(contract, 'protect_ally', context);
      expect(result.success).toBe(true);
      expect(result.loyaltyDelta).toBeGreaterThan(0);
      expect(result.trustDelta).toBeGreaterThan(0);
      expect(result.affectionDelta).toBeGreaterThan(0);
    });

    it('applies negative effects on failure', () => {
      const contract = createMockContract({
        loyalty: 10,
        trust: 10,
        bondLevel: 1,
        contractStability: 50,
        instance: createMockCreatureInstance({ affection: 0 }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: true, dangerLevel: 0 };
      const result = resolveCommandWithAI(contract, 'attack', context);
      expect(result.success).toBe(false);
      expect(result.loyaltyDelta).toBeLessThan(0);
      expect(result.trustDelta).toBeLessThan(0);
      expect(result.affectionDelta).toBeLessThan(0);
      expect(result.contractStabilityDelta).toBeLessThan(0);
    });

    it('reduces obedience for cowardly trait on dangerous commands', () => {
      const contract = createMockContract({
        bondLevel: 1,
        loyalty: 50,
        trust: 50,
        contractStability: 100,
        instance: createMockCreatureInstance({ affection: 0, traits: ['cowardly'] }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false, dangerLevel: 5 };
      const result = resolveCommandWithAI(contract, 'attack', context);
      expect(result.success).toBe(false);
    });

    it('increases obedience for brave trait on dangerous commands', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack', 'protect_ally'],
        bondLevel: 1,
        loyalty: 50,
        trust: 50,
        contractStability: 100,
        instance: createMockCreatureInstance({ affection: 100, traits: ['brave'] }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: true, dangerLevel: 0 };
      const result = resolveCommandWithAI(contract, 'protect_ally', context);
      expect(result.success).toBe(true);
    });

    it('increases obedience for loyal trait on protect_ally', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'protect_ally'],
        bondLevel: 1,
        loyalty: 50,
        trust: 50,
        contractStability: 100,
        instance: createMockCreatureInstance({ affection: 50, traits: ['loyal'] }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: true };
      const result = resolveCommandWithAI(contract, 'protect_ally', context);
      expect(result.success).toBe(true);
    });

    it('calculates consistent deterministic results for same inputs', () => {
      const contract = createMockContract({
        bondLevel: 5,
        loyalty: 70,
        trust: 70,
        contractStability: 90,
        instance: createMockCreatureInstance({ affection: 70, traits: [] }),
      });
      const context = { worldId: 1, locationType: 'world' as const, inCombat: false, dangerLevel: 2 };
      const result1 = resolveCommandWithAI(contract, 'guard', context);
      const result2 = resolveCommandWithAI(contract, 'guard', context);
      expect(result1.success).toBe(result2.success);
      expect(result1.loyaltyDelta).toBe(result2.loyaltyDelta);
      expect(result1.trustDelta).toBe(result2.trustDelta);
    });
  });

  describe('getAvailableCommands', () => {
    it('returns only permitted commands', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack'],
      });
      const available = getAvailableCommands(contract);
      expect(available).toEqual(['follow', 'attack']);
    });
  });

  describe('createDefaultCommandPermissions', () => {
    it('returns full command list', () => {
      const defaults = createDefaultCommandPermissions();
      expect(defaults).toHaveLength(13);
      expect(defaults).toEqual(COMMAND_PERMISSIONS);
    });
  });
});
