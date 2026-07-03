import { describe, it, expect } from 'vitest';
import {
  calculateSummonManaCost,
  getSummonCooldown,
  canSummonAtLocation,
  getSummonRestrictions,
  checkSummonEligibility,
  performSummon,
  isOnCooldown,
  getRemainingCooldown,
  getAffectionSummonBoost,
  calculateElementCompatibilityBoost,
  getSummonSuccessModifiers,
  getSummonSuccessChance,
  updateContractSummonedTime,
  clearContractSummonedTime,
  BASE_SUMMON_MANA_COST,
  BASE_SUMMON_COOLDOWN_MS,
} from '../core/playerCore/summoningCore';

import type { CreatureContract, PlayerCoreState, PlayerPrimaryStats, PlayerSecondaryStats } from '../types/playerCore';
import type { CreatureInstance } from '../types/game';

const createMockCreatureInstance = (overrides: Partial<CreatureInstance> = {}): CreatureInstance => ({
  id: 'creature-1',
  templateKey: 'test_creature',
  level: 1,
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
  affection: 0,
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
  bondLevel: 1,
  trust: 50,
  loyalty: 50,
  contractStability: 100,
  elementCompatibility: 100,
  commandPermissions: ['follow', 'attack', 'defend'],
  tradeStatus: 'bound',
  breedingRights: false,
  pvpEligibility: false,
  contractedAt: Date.now(),
  instance: createMockCreatureInstance(),
  ...overrides,
});

const createMockSecondaryStats = (overrides: Partial<PlayerSecondaryStats> = {}): PlayerSecondaryStats => ({
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
  secondaryStats: createMockSecondaryStats(),
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
  creatureContracts: [],
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

describe('summoningCore', () => {
  describe('calculateSummonManaCost', () => {
    it('returns base mana cost with default stats', () => {
      const contract = createMockContract();
      const secondaryStats = createMockSecondaryStats();
      const cost = calculateSummonManaCost(contract, secondaryStats);
      expect(cost).toBe(BASE_SUMMON_MANA_COST);
    });

    it('increases cost with higher summoningCost stat', () => {
      const contract = createMockContract();
      const secondaryStats = createMockSecondaryStats({ summoningCost: 150 });
      const cost = calculateSummonManaCost(contract, secondaryStats);
      expect(cost).toBeGreaterThan(BASE_SUMMON_MANA_COST);
    });

    it('reduces cost with higher element compatibility', () => {
      const contract = createMockContract({ elementCompatibility: 120 });
      const secondaryStats = createMockSecondaryStats({ summoningCost: 80 });
      const cost = calculateSummonManaCost(contract, secondaryStats);
      expect(cost).toBeLessThan(BASE_SUMMON_MANA_COST);
    });

    it('clamps minimum cost to reasonable floor', () => {
      const contract = createMockContract({ elementCompatibility: 200 });
      const secondaryStats = createMockSecondaryStats({ summoningCost: -100 });
      const cost = calculateSummonManaCost(contract, secondaryStats);
      expect(cost).toBeGreaterThanOrEqual(5);
    });

    it('clamps maximum cost to 200', () => {
      const contract = createMockContract();
      const secondaryStats = createMockSecondaryStats({ summoningCost: 500 });
      const cost = calculateSummonManaCost(contract, secondaryStats);
      expect(cost).toBeLessThanOrEqual(200);
    });
  });

  describe('getSummonCooldown', () => {
    it('returns base cooldown for stable contract', () => {
      const contract = createMockContract({ contractStability: 100 });
      const secondaryStats = createMockSecondaryStats();
      const cooldown = getSummonCooldown(contract, secondaryStats);
      expect(cooldown).toBe(BASE_SUMMON_COOLDOWN_MS);
    });

    it('increases cooldown for unstable contract', () => {
      const contract = createMockContract({ contractStability: 50 });
      const secondaryStats = createMockSecondaryStats();
      const cooldown = getSummonCooldown(contract, secondaryStats);
      expect(cooldown).toBeGreaterThan(BASE_SUMMON_COOLDOWN_MS);
    });
  });

  describe('canSummonAtLocation', () => {
    it('allows summoning in world locations', () => {
      expect(canSummonAtLocation('world')).toBe(true);
    });

    it('allows summoning in safe zones', () => {
      expect(canSummonAtLocation('safe_zone')).toBe(true);
    });

    it('restricts summoning in active dungeons', () => {
      const dungeonState = { active: true, safeFloor: false } as any;
      expect(canSummonAtLocation('dungeon', dungeonState)).toBe(false);
    });

    it('allows summoning on safe floors in dungeons', () => {
      const dungeonState = { active: true, safeFloor: true } as any;
      expect(canSummonAtLocation('dungeon', dungeonState)).toBe(true);
    });

    it('allows summoning in PvP arenas when active', () => {
      expect(canSummonAtLocation('pvp_arena', undefined, true)).toBe(true);
    });

    it('restricts summoning in PvP arenas when not active', () => {
      expect(canSummonAtLocation('pvp_arena', undefined, false)).toBe(false);
    });
  });

  describe('getSummonRestrictions', () => {
    it('returns allowed true for world', () => {
      const result = getSummonRestrictions('world');
      expect(result.allowed).toBe(true);
      expect(result.restricted).toBe(false);
    });

    it('returns restricted true for active dungeon non-safe floor', () => {
      const dungeonState = { active: true, safeFloor: false } as any;
      const result = getSummonRestrictions('dungeon', dungeonState);
      expect(result.allowed).toBe(false);
      expect(result.restricted).toBe(true);
    });

    it('returns restricted false for safe floor', () => {
      const dungeonState = { active: true, safeFloor: true } as any;
      const result = getSummonRestrictions('dungeon', dungeonState);
      expect(result.allowed).toBe(true);
      expect(result.restricted).toBe(false);
    });
  });

  describe('checkSummonEligibility', () => {
    it('returns ineligible when contract not found', () => {
      const state = createMockState();
      const result = checkSummonEligibility(state, 'nonexistent');
      expect(result.canSummon).toBe(false);
      expect(result.reason).toContain('No contract found');
    });

    it('returns ineligible when contract stability too low', () => {
      const state = createMockState({
        creatureContracts: [createMockContract({ contractStability: 10 })],
      });
      const result = checkSummonEligibility(state, 'contract-1');
      expect(result.canSummon).toBe(false);
      expect(result.reason).toContain('stability');
    });

    it('returns ineligible when mana insufficient', () => {
      const state = createMockState({
        resources: {
          energy: { current: 5, max: 100, lastUpdate: new Date().toISOString() },
          nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
          happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
          life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
        },
        creatureContracts: [createMockContract()],
      });
      const result = checkSummonEligibility(state, 'contract-1');
      expect(result.canSummon).toBe(false);
      expect(result.reason).toContain('Insufficient mana');
    });

    it('returns ineligible when on cooldown', () => {
      const state = createMockState({
        creatureContracts: [createMockContract()],
      });
      const result = checkSummonEligibility(state, 'contract-1', Date.now(), 'world', undefined, undefined, Date.now());
      expect(result.canSummon).toBe(false);
      expect(result.reason).toContain('cooldown');
    });

    it('returns eligible with correct costs for valid contract', () => {
      const state = createMockState({
        creatureContracts: [createMockContract()],
      });
      const result = checkSummonEligibility(state, 'contract-1');
      expect(result.canSummon).toBe(true);
      expect(result.manaCost).toBeGreaterThan(0);
      expect(result.cooldownMs).toBeGreaterThan(0);
    });

    it('rejects summoning in restricted dungeon location', () => {
      const state = createMockState({
        creatureContracts: [createMockContract()],
      });
      const dungeonState = { active: true, safeFloor: false } as any;
      const result = checkSummonEligibility(state, 'contract-1', Date.now(), 'dungeon', dungeonState);
      expect(result.canSummon).toBe(false);
      expect(result.reason).toContain('restricted');
    });
  });

  describe('performSummon', () => {
    it('returns failure when ineligible', () => {
      const state = createMockState({
        creatureContracts: [createMockContract({ contractStability: 10 })],
      });
      const result = performSummon(state, 'contract-1');
      expect(result.success).toBe(false);
      expect(result.message).toContain('stability');
    });

    it('returns success with correct costs when eligible', () => {
      const state = createMockState({
        creatureContracts: [createMockContract()],
      });
      const result = performSummon(state, 'contract-1');
      expect(result.success).toBe(true);
      expect(result.manaCost).toBeGreaterThan(0);
      expect(result.cooldownMs).toBeGreaterThan(0);
      expect(result.creatureInstanceId).toContain('contract-1_summon_');
    });
  });

  describe('isOnCooldown', () => {
    it('returns false when not on cooldown', () => {
      expect(isOnCooldown(Date.now() - 60000, 30000, Date.now())).toBe(false);
    });

    it('returns true when on cooldown', () => {
      expect(isOnCooldown(Date.now(), 30000, Date.now())).toBe(true);
    });

    it('returns false when cooldown expired', () => {
      const pastTime = Date.now() - 60000;
      const cooldown = 30000;
      expect(isOnCooldown(pastTime, cooldown, Date.now())).toBe(false);
    });
  });

  describe('getRemainingCooldown', () => {
    it('returns 0 when not on cooldown', () => {
      expect(getRemainingCooldown(Date.now() - 60000, 30000, Date.now())).toBe(0);
    });

    it('returns remaining seconds when on cooldown', () => {
      const now = Date.now();
      const remaining = getRemainingCooldown(now, 30000, now);
      expect(remaining).toBe(30);
    });
  });

  describe('getAffectionSummonBoost', () => {
    it('returns 0 when affection below threshold', () => {
      const contract = createMockContract({ instance: createMockCreatureInstance({ affection: 30 }) });
      expect(getAffectionSummonBoost(contract)).toBe(0);
    });

    it('returns boost when affection at threshold', () => {
      const contract = createMockContract({ instance: createMockCreatureInstance({ affection: 50 }) });
      expect(getAffectionSummonBoost(contract)).toBeGreaterThan(0);
    });

    it('returns boost when affection above threshold', () => {
      const contract = createMockContract({ instance: createMockCreatureInstance({ affection: 80 }) });
      expect(getAffectionSummonBoost(contract)).toBeGreaterThan(0);
    });
  });

  describe('calculateElementCompatibilityBoost', () => {
    it('returns 0 for base compatibility', () => {
      const contract = createMockContract({ elementCompatibility: 100 });
      expect(calculateElementCompatibilityBoost(contract)).toBe(0);
    });

    it('returns positive boost for higher compatibility', () => {
      const contract = createMockContract({ elementCompatibility: 120 });
      expect(calculateElementCompatibilityBoost(contract)).toBeGreaterThan(0);
    });

    it('returns negative for lower compatibility', () => {
      const contract = createMockContract({ elementCompatibility: 80 });
      expect(calculateElementCompatibilityBoost(contract)).toBeLessThan(0);
    });
  });

  describe('getSummonSuccessModifiers', () => {
    it('returns modifiers with no penalties for stable contract', () => {
      const contract = createMockContract({
        contractStability: 100,
        instance: createMockCreatureInstance({ affection: 70 }),
      });
      const modifiers = getSummonSuccessModifiers(contract);
      expect(modifiers.stabilityPenalty).toBe(0);
      expect(modifiers.affectionBoost).toBeGreaterThan(0);
    });

    it('includes stability penalty for unstable contract', () => {
      const contract = createMockContract({
        contractStability: 40,
        instance: createMockCreatureInstance({ affection: 30 }),
      });
      const modifiers = getSummonSuccessModifiers(contract);
      expect(modifiers.stabilityPenalty).toBeGreaterThan(0);
      expect(modifiers.affectionBoost).toBe(0);
    });
  });

  describe('getSummonSuccessChance', () => {
    it('returns base chance for no modifiers', () => {
      const contract = createMockContract();
      const modifiers = getSummonSuccessModifiers(contract);
      const chance = getSummonSuccessChance(contract, modifiers);
      expect(chance).toBe(1.0);
    });

    it('clamps minimum chance to 0.5', () => {
      const contract = createMockContract({ contractStability: 10 });
      const modifiers = { affectionBoost: 0, elementBoost: 0, stabilityPenalty: 0.6 };
      const chance = getSummonSuccessChance(contract, modifiers);
      expect(chance).toBeGreaterThanOrEqual(0.5);
    });

    it('clamps maximum chance to 1.5', () => {
      const contract = createMockContract({
        contractStability: 100,
        elementCompatibility: 150,
        instance: createMockCreatureInstance({ affection: 100 }),
      });
      const modifiers = getSummonSuccessModifiers(contract);
      const chance = getSummonSuccessChance(contract, modifiers);
      expect(chance).toBeLessThanOrEqual(1.5);
    });
  });

  describe('updateContractSummonedTime', () => {
    it('sets summonedAt timestamp', () => {
      const contract = createMockContract({ summonedAt: undefined });
      const beforeTime = Date.now();
      const updated = updateContractSummonedTime(contract);
      const afterTime = Date.now();
      expect(updated.summonedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(updated.summonedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('clearContractSummonedTime', () => {
    it('removes summonedAt from contract', () => {
      const contract = createMockContract({ summonedAt: Date.now() });
      const cleared = clearContractSummonedTime(contract);
      expect(cleared.summonedAt).toBeUndefined();
    });
  });
});