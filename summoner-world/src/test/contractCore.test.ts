import { describe, it, expect } from 'vitest';
import {
  createContract,
  validateContract,
  getContractById,
  hasContract,
  modifyBondLevel,
  adjustTrust,
  adjustLoyalty,
  updateContractStability,
  setTradeStatus,
  addCommandPermission,
  removeCommandPermission,
  grantBreedingRights,
  revokeBreedingRights,
  setPvpEligibility,
  calculateElementCompatibility,
  canTradeContract,
  canBreedContract,
  canPvPContract,
  serializeContract,
  deserializeContract,
  getContractSummary,
  DEFAULT_BOND_LEVEL,
  DEFAULT_TRUST,
  DEFAULT_LOYALTY,
  DEFAULT_CONTRACT_STABILITY,
  DEFAULT_ELEMENT_COMPATIBILITY,
  DEFAULT_COMMAND_PERMISSIONS,
  DEFAULT_TRADE_STATUS,
  DEFAULT_BREEDING_RIGHTS,
  DEFAULT_PVP_ELIGIBILITY,
} from '../core/playerCore/contractCore';

import type { CreatureContract, PlayerCoreState } from '../types/playerCore.ts';
import type { CreatureInstance } from '../types/game.ts';

const createMockInstance = (): CreatureInstance => ({
  id: 'creature-1',
  templateKey: 'test_creature',
  nickname: 'Test Creature',
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
  skills: ['tackle'],
  traits: [],
  mutations: [],
  affection: 0,
  type: 'beast',
  elements: ['fire'],
  baseExpValue: 10,
  evolutionStage: 0,
  evolvedFromKey: undefined,
});

const createMockContract = (overrides: Partial<CreatureContract> = {}): CreatureContract => {
  const base = createContract({
    id: 'contract-1',
    templateKey: 'test_creature',
    instance: createMockInstance(),
    playerElement: 'fire',
    creatureElements: ['fire'],
  });
  return { ...base, ...overrides };
};

const createMockState = (contracts: CreatureContract[] = []): PlayerCoreState => {
  const mockState = {
    creatureContracts: contracts,
  } as unknown as PlayerCoreState;
  return mockState;
};

describe('contractCore', () => {
  describe('createContract', () => {
    it('creates a contract with defaults', () => {
      const contract = createContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
      });
      expect(contract.id).toBe('c-1');
      expect(contract.templateKey).toBe('test');
      expect(contract.bondLevel).toBe(DEFAULT_BOND_LEVEL);
      expect(contract.trust).toBe(DEFAULT_TRUST);
      expect(contract.loyalty).toBe(DEFAULT_LOYALTY);
      expect(contract.contractStability).toBe(DEFAULT_CONTRACT_STABILITY);
      expect(contract.elementCompatibility).toBe(DEFAULT_ELEMENT_COMPATIBILITY);
      expect(contract.commandPermissions).toEqual([...DEFAULT_COMMAND_PERMISSIONS]);
      expect(contract.tradeStatus).toBe(DEFAULT_TRADE_STATUS);
      expect(contract.breedingRights).toBe(DEFAULT_BREEDING_RIGHTS);
      expect(contract.pvpEligibility).toBe(DEFAULT_PVP_ELIGIBILITY);
      expect(contract.contractedAt).toBeGreaterThan(0);
    });

    it('calculates element compatibility when elements match', () => {
      const contract = createContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
        playerElement: 'fire',
        creatureElements: ['fire'],
      });
      expect(contract.elementCompatibility).toBe(100);
    });

    it('calculates reduced compatibility when elements do not match', () => {
      const contract = createContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
        playerElement: 'water',
        creatureElements: ['fire'],
      });
      expect(contract.elementCompatibility).toBe(80);
    });

    it('uses default compatibility when no elements provided', () => {
      const contract = createContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
      });
      expect(contract.elementCompatibility).toBe(DEFAULT_ELEMENT_COMPATIBILITY);
    });

    it('allows overriding contractedAt', () => {
      const contract = createContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
        contractedAt: 1234567890,
      });
      expect(contract.contractedAt).toBe(1234567890);
    });
  });

  describe('validateContract', () => {
    it('returns valid for a complete contract', () => {
      const contract = createMockContract();
      const result = validateContract(contract);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty id', () => {
      const contract = createMockContract({ id: '' });
      const result = validateContract(contract);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('rejects empty templateKey', () => {
      const contract = createMockContract({ templateKey: '' });
      const result = validateContract(contract);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('templateKey'))).toBe(true);
    });

    it('rejects missing instance', () => {
      const contract = createMockContract({ instance: undefined as any });
      const result = validateContract(contract);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('instance'))).toBe(true);
    });

    it('rejects bondLevel out of range', () => {
      const contract = createMockContract({ bondLevel: -1 });
      expect(validateContract(contract).valid).toBe(false);
      const contract2 = createMockContract({ bondLevel: 101 });
      expect(validateContract(contract2).valid).toBe(false);
    });

    it('rejects trust out of range', () => {
      expect(validateContract(createMockContract({ trust: -1 })).valid).toBe(false);
      expect(validateContract(createMockContract({ trust: 101 })).valid).toBe(false);
    });

    it('rejects loyalty out of range', () => {
      expect(validateContract(createMockContract({ loyalty: -1 })).valid).toBe(false);
      expect(validateContract(createMockContract({ loyalty: 101 })).valid).toBe(false);
    });

    it('rejects contractStability out of range', () => {
      expect(validateContract(createMockContract({ contractStability: -1 })).valid).toBe(false);
      expect(validateContract(createMockContract({ contractStability: 101 })).valid).toBe(false);
    });

    it('rejects elementCompatibility out of range', () => {
      expect(validateContract(createMockContract({ elementCompatibility: -1 })).valid).toBe(false);
      expect(validateContract(createMockContract({ elementCompatibility: 101 })).valid).toBe(false);
    });

    it('rejects invalid tradeStatus', () => {
      expect(validateContract(createMockContract({ tradeStatus: 'invalid' as any })).valid).toBe(false);
    });

    it('rejects invalid commandPermissions', () => {
      expect(
        validateContract(createMockContract({ commandPermissions: ['invalid_perm'] })).valid
      ).toBe(false);
    });

    it('rejects zero contractedAt', () => {
      expect(validateContract(createMockContract({ contractedAt: 0 })).valid).toBe(false);
      expect(validateContract(createMockContract({ contractedAt: -1 })).valid).toBe(false);
    });
  });

  describe('getContractById', () => {
    it('returns contract when found', () => {
      const contract = createMockContract({ id: 'target' });
      const state = createMockState([contract]);
      expect(getContractById(state, 'target')).toBe(contract);
    });

    it('returns undefined when not found', () => {
      const state = createMockState([createMockContract()]);
      expect(getContractById(state, 'missing')).toBeUndefined();
    });

    it('returns undefined for empty state', () => {
      const state = createMockState([]);
      expect(getContractById(state, 'any')).toBeUndefined();
    });
  });

  describe('hasContract', () => {
    it('returns true when contract exists', () => {
      const state = createMockState([createMockContract({ id: 'c-1' })]);
      expect(hasContract(state, 'c-1')).toBe(true);
    });

    it('returns false when contract does not exist', () => {
      const state = createMockState([createMockContract()]);
      expect(hasContract(state, 'missing')).toBe(false);
    });
  });

  describe('modifyBondLevel', () => {
    it('increases bond level', () => {
      const contract = createMockContract({ bondLevel: 5 });
      const next = modifyBondLevel(contract, 3);
      expect(next.bondLevel).toBe(8);
    });

    it('decreases bond level', () => {
      const contract = createMockContract({ bondLevel: 5 });
      const next = modifyBondLevel(contract, -2);
      expect(next.bondLevel).toBe(3);
    });

    it('clamps to minimum 0', () => {
      const contract = createMockContract({ bondLevel: 1 });
      const next = modifyBondLevel(contract, -5);
      expect(next.bondLevel).toBe(0);
    });

    it('clamps to maximum 100', () => {
      const contract = createMockContract({ bondLevel: 99 });
      const next = modifyBondLevel(contract, 10);
      expect(next.bondLevel).toBe(100);
    });

    it('does not mutate original', () => {
      const contract = createMockContract({ bondLevel: 5 });
      modifyBondLevel(contract, 3);
      expect(contract.bondLevel).toBe(5);
    });
  });

  describe('adjustTrust', () => {
    it('adjusts trust and clamps to range', () => {
      const contract = createMockContract({ trust: 50 });
      expect(adjustTrust(contract, 20).trust).toBe(70);
      expect(adjustTrust(contract, -30).trust).toBe(20);
      expect(adjustTrust({ ...contract, trust: 0 }, -10).trust).toBe(0);
      expect(adjustTrust({ ...contract, trust: 100 }, 10).trust).toBe(100);
    });
  });

  describe('adjustLoyalty', () => {
    it('adjusts loyalty and clamps to range', () => {
      const contract = createMockContract({ loyalty: 50 });
      expect(adjustLoyalty(contract, 20).loyalty).toBe(70);
      expect(adjustLoyalty(contract, -30).loyalty).toBe(20);
    });
  });

  describe('updateContractStability', () => {
    it('clamps stability value', () => {
      const contract = createMockContract({ contractStability: 50 });
      expect(updateContractStability(contract, 80).contractStability).toBe(80);
      expect(updateContractStability(contract, -20).contractStability).toBe(0);
      expect(updateContractStability(contract, 150).contractStability).toBe(100);
    });
  });

  describe('setTradeStatus', () => {
    it('updates trade status', () => {
      const contract = createMockContract({ tradeStatus: 'bound' });
      expect(setTradeStatus(contract, 'tradeable').tradeStatus).toBe('tradeable');
      expect(setTradeStatus(contract, 'marketable').tradeStatus).toBe('marketable');
    });
  });

  describe('addCommandPermission', () => {
    it('adds valid permission', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack'],
      });
      const next = addCommandPermission(contract, 'guard');
      expect(next.commandPermissions).toContain('guard');
      expect(next.commandPermissions).toHaveLength(3);
    });

    it('ignores duplicate permission', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack'],
      });
      const next = addCommandPermission(contract, 'follow');
      expect(next.commandPermissions).toHaveLength(2);
    });

    it('ignores invalid permission', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack'],
      });
      const next = addCommandPermission(contract, 'invalid_perm' as any);
      expect(next.commandPermissions).toHaveLength(2);
    });
  });

  describe('removeCommandPermission', () => {
    it('removes existing permission', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack', 'defend'],
      });
      const next = removeCommandPermission(contract, 'attack');
      expect(next.commandPermissions).not.toContain('attack');
      expect(next.commandPermissions).toHaveLength(2);
    });

    it('ignores missing permission', () => {
      const contract = createMockContract({
        commandPermissions: ['follow', 'attack'],
      });
      const next = removeCommandPermission(contract, 'guard');
      expect(next.commandPermissions).toHaveLength(2);
    });
  });

  describe('grantBreedingRights / revokeBreedingRights', () => {
    it('grants breeding rights', () => {
      const contract = createMockContract({ breedingRights: false });
      expect(grantBreedingRights(contract).breedingRights).toBe(true);
    });

    it('revokes breeding rights', () => {
      const contract = createMockContract({ breedingRights: true });
      expect(revokeBreedingRights(contract).breedingRights).toBe(false);
    });
  });

  describe('setPvpEligibility', () => {
    it('sets PvP eligibility to true', () => {
      expect(setPvpEligibility(createMockContract(), true).pvpEligibility).toBe(true);
    });
    it('sets PvP eligibility to false', () => {
      expect(setPvpEligibility(createMockContract({ pvpEligibility: true }), false).pvpEligibility).toBe(false);
    });
  });

  describe('calculateElementCompatibility', () => {
    it('returns 100 when player element matches creature element', () => {
      expect(calculateElementCompatibility('fire', ['fire'])).toBe(100);
    });

    it('returns 80 when player element does not match', () => {
      expect(calculateElementCompatibility('water', ['fire'])).toBe(80);
    });

    it('returns default when no player element', () => {
      expect(calculateElementCompatibility(undefined, ['fire'])).toBe(DEFAULT_ELEMENT_COMPATIBILITY);
    });

    it('returns default when creature has no elements', () => {
      expect(calculateElementCompatibility('fire', [])).toBe(DEFAULT_ELEMENT_COMPATIBILITY);
    });

    it('matches case-insensitively', () => {
      expect(calculateElementCompatibility('FIRE', ['fire'])).toBe(100);
      expect(calculateElementCompatibility('fire', ['FIRE'])).toBe(100);
    });
  });

  describe('canTradeContract', () => {
    it('returns true for tradeable and marketable', () => {
      expect(canTradeContract(createMockContract({ tradeStatus: 'tradeable' }))).toBe(true);
      expect(canTradeContract(createMockContract({ tradeStatus: 'marketable' }))).toBe(true);
    });

    it('returns false for bound', () => {
      expect(canTradeContract(createMockContract({ tradeStatus: 'bound' }))).toBe(false);
    });
  });

  describe('canBreedContract', () => {
    it('returns true when breeding rights granted and stability sufficient', () => {
      expect(
        canBreedContract(createMockContract({ breedingRights: true, contractStability: 60 }))
      ).toBe(true);
    });

    it('returns false when breeding rights are missing', () => {
      expect(
        canBreedContract(createMockContract({ breedingRights: false, contractStability: 80 }))
      ).toBe(false);
    });

    it('returns false when stability is below 50', () => {
      expect(
        canBreedContract(createMockContract({ breedingRights: true, contractStability: 49 }))
      ).toBe(false);
    });
  });

  describe('canPvPContract', () => {
    it('returns true when PvP eligible and stability sufficient', () => {
      expect(
        canPvPContract(createMockContract({ pvpEligibility: true, contractStability: 40 }))
      ).toBe(true);
    });

    it('returns false when PvP eligibility is false', () => {
      expect(
        canPvPContract(createMockContract({ pvpEligibility: false, contractStability: 80 }))
      ).toBe(false);
    });

    it('returns false when stability is below 30', () => {
      expect(
        canPvPContract(createMockContract({ pvpEligibility: true, contractStability: 29 }))
      ).toBe(false);
    });
  });

  describe('serializeContract / deserializeContract', () => {
    it('round-trips a contract', () => {
      const contract = createMockContract({
        id: 'c-1',
        templateKey: 'test',
        bondLevel: 10,
        trust: 75,
        loyalty: 60,
        contractStability: 88,
        elementCompatibility: 95,
        commandPermissions: ['follow', 'attack', 'scout'],
        tradeStatus: 'tradeable',
        breedingRights: true,
        pvpEligibility: false,
        contractedAt: 1234567890,
      });
      const serialized = serializeContract(contract);
      const restored = deserializeContract(serialized);
      expect(restored).toEqual(contract);
    });

    it('applies defaults for missing fields', () => {
      const restored = deserializeContract({
        id: 'c-1',
        templateKey: 'test',
        instance: createMockInstance(),
      } as any);
      expect(restored.bondLevel).toBe(DEFAULT_BOND_LEVEL);
      expect(restored.trust).toBe(DEFAULT_TRUST);
      expect(restored.loyalty).toBe(DEFAULT_LOYALTY);
      expect(restored.contractStability).toBe(DEFAULT_CONTRACT_STABILITY);
      expect(restored.elementCompatibility).toBe(DEFAULT_ELEMENT_COMPATIBILITY);
      expect(restored.commandPermissions).toEqual([...DEFAULT_COMMAND_PERMISSIONS]);
      expect(restored.tradeStatus).toBe(DEFAULT_TRADE_STATUS);
      expect(restored.breedingRights).toBe(DEFAULT_BREEDING_RIGHTS);
      expect(restored.pvpEligibility).toBe(DEFAULT_PVP_ELIGIBILITY);
    });
  });

  describe('getContractSummary', () => {
    it('returns simplified summary', () => {
      const contract = createMockContract({
        id: 'c-1',
        templateKey: 'test',
        nickname: 'Buddy',
        bondLevel: 10,
        commandPermissions: ['follow', 'attack', 'defend', 'retreat', 'guard'],
      });
      const summary = getContractSummary(contract);
      expect(summary.id).toBe('c-1');
      expect(summary.nickname).toBe('Buddy');
      expect(summary.bondLevel).toBe(10);
      expect(summary.commandPermissionCount).toBe(5);
      expect(summary.tradeStatus).toBe(DEFAULT_TRADE_STATUS);
    });
  });
});
