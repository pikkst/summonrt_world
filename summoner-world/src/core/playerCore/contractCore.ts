import type { CreatureContract, PlayerCoreState } from '../../types/playerCore.ts';
import type { CreatureInstance } from '../../types/game.ts';

export const DEFAULT_BOND_LEVEL = 1;
export const DEFAULT_TRUST = 50;
export const DEFAULT_LOYALTY = 50;
export const DEFAULT_CONTRACT_STABILITY = 100;
export const DEFAULT_ELEMENT_COMPATIBILITY = 100;
export const DEFAULT_COMMAND_PERMISSIONS: readonly string[] = [
  'follow',
  'attack',
  'defend',
  'retreat',
];
export const DEFAULT_TRADE_STATUS: CreatureContract['tradeStatus'] = 'bound';
export const DEFAULT_BREEDING_RIGHTS = false;
export const DEFAULT_PVP_ELIGIBILITY = false;

export const CONTRACT_STAT_MIN = 0;
export const CONTRACT_STAT_MAX = 100;
export const BOND_LEVEL_MAX = 100;
export const COMMAND_PERMISSIONS: readonly string[] = [
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
];

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ContractSummary {
  id: string;
  templateKey: string;
  nickname?: string;
  bondLevel: number;
  trust: number;
  loyalty: number;
  contractStability: number;
  elementCompatibility: number;
  tradeStatus: string;
  breedingRights: boolean;
  pvpEligibility: boolean;
  commandPermissionCount: number;
}

export function createContract(options: {
  id: string;
  templateKey: string;
  instance: CreatureInstance;
  playerElement?: string;
  creatureElements?: string[];
  nickname?: string;
  contractedAt?: number;
}): CreatureContract {
  const elementCompatibility = calculateElementCompatibility(
    options.playerElement,
    options.creatureElements ?? []
  );

  return {
    id: options.id,
    templateKey: options.templateKey,
    nickname: options.nickname,
    bondLevel: DEFAULT_BOND_LEVEL,
    trust: DEFAULT_TRUST,
    loyalty: DEFAULT_LOYALTY,
    contractStability: DEFAULT_CONTRACT_STABILITY,
    elementCompatibility,
    commandPermissions: [...DEFAULT_COMMAND_PERMISSIONS],
    tradeStatus: DEFAULT_TRADE_STATUS,
    breedingRights: DEFAULT_BREEDING_RIGHTS,
    pvpEligibility: DEFAULT_PVP_ELIGIBILITY,
    summonedAt: undefined,
    contractedAt: options.contractedAt ?? Date.now(),
    instance: options.instance,
  };
}

export function validateContract(contract: CreatureContract): ContractValidationResult {
  const errors: string[] = [];

  if (!contract.id || contract.id.length === 0) {
    errors.push('Contract id is required');
  }
  if (!contract.templateKey || contract.templateKey.length === 0) {
    errors.push('Contract templateKey is required');
  }
  if (!contract.instance) {
    errors.push('Contract instance is required');
  }
  if (contract.bondLevel < 0 || contract.bondLevel > BOND_LEVEL_MAX) {
    errors.push(`Bond level must be between 0 and ${BOND_LEVEL_MAX}`);
  }
  if (contract.trust < CONTRACT_STAT_MIN || contract.trust > CONTRACT_STAT_MAX) {
    errors.push(`Trust must be between ${CONTRACT_STAT_MIN} and ${CONTRACT_STAT_MAX}`);
  }
  if (contract.loyalty < CONTRACT_STAT_MIN || contract.loyalty > CONTRACT_STAT_MAX) {
    errors.push(`Loyalty must be between ${CONTRACT_STAT_MIN} and ${CONTRACT_STAT_MAX}`);
  }
  if (contract.contractStability < CONTRACT_STAT_MIN || contract.contractStability > CONTRACT_STAT_MAX) {
    errors.push(`Contract stability must be between ${CONTRACT_STAT_MIN} and ${CONTRACT_STAT_MAX}`);
  }
  if (contract.elementCompatibility < CONTRACT_STAT_MIN || contract.elementCompatibility > CONTRACT_STAT_MAX) {
    errors.push(`Element compatibility must be between ${CONTRACT_STAT_MIN} and ${CONTRACT_STAT_MAX}`);
  }
  if (
    contract.tradeStatus !== 'bound' &&
    contract.tradeStatus !== 'tradeable' &&
    contract.tradeStatus !== 'marketable'
  ) {
    errors.push('Trade status must be one of: bound, tradeable, marketable');
  }
  if (!contract.contractedAt || contract.contractedAt <= 0) {
    errors.push('contractedAt must be a positive timestamp');
  }

  const invalidPermissions = contract.commandPermissions.filter(
    (p) => !COMMAND_PERMISSIONS.includes(p)
  );
  if (invalidPermissions.length > 0) {
    errors.push(`Invalid command permissions: ${invalidPermissions.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

export function getContractById(
  state: PlayerCoreState,
  contractId: string
): CreatureContract | undefined {
  return state.creatureContracts.find((c) => c.id === contractId);
}

export function hasContract(state: PlayerCoreState, contractId: string): boolean {
  return state.creatureContracts.some((c) => c.id === contractId);
}

export function modifyBondLevel(
  contract: CreatureContract,
  delta: number
): CreatureContract {
  const next = Math.max(0, Math.min(BOND_LEVEL_MAX, contract.bondLevel + delta));
  return { ...contract, bondLevel: next };
}

export function adjustTrust(
  contract: CreatureContract,
  delta: number
): CreatureContract {
  const next = Math.max(CONTRACT_STAT_MIN, Math.min(CONTRACT_STAT_MAX, contract.trust + delta));
  return { ...contract, trust: next };
}

export function adjustLoyalty(
  contract: CreatureContract,
  delta: number
): CreatureContract {
  const next = Math.max(CONTRACT_STAT_MIN, Math.min(CONTRACT_STAT_MAX, contract.loyalty + delta));
  return { ...contract, loyalty: next };
}

export function updateContractStability(
  contract: CreatureContract,
  value: number
): CreatureContract {
  const clamped = Math.max(CONTRACT_STAT_MIN, Math.min(CONTRACT_STAT_MAX, value));
  return { ...contract, contractStability: clamped };
}

export function setTradeStatus(
  contract: CreatureContract,
  status: CreatureContract['tradeStatus']
): CreatureContract {
  return { ...contract, tradeStatus: status };
}

export function addCommandPermission(
  contract: CreatureContract,
  permission: string
): CreatureContract {
  if (!COMMAND_PERMISSIONS.includes(permission)) {
    return contract;
  }
  if (contract.commandPermissions.includes(permission)) {
    return contract;
  }
  return { ...contract, commandPermissions: [...contract.commandPermissions, permission] };
}

export function removeCommandPermission(
  contract: CreatureContract,
  permission: string
): CreatureContract {
  if (!contract.commandPermissions.includes(permission)) {
    return contract;
  }
  return {
    ...contract,
    commandPermissions: contract.commandPermissions.filter((p) => p !== permission),
  };
}

export function grantBreedingRights(contract: CreatureContract): CreatureContract {
  return { ...contract, breedingRights: true };
}

export function revokeBreedingRights(contract: CreatureContract): CreatureContract {
  return { ...contract, breedingRights: false };
}

export function setPvpEligibility(
  contract: CreatureContract,
  eligible: boolean
): CreatureContract {
  return { ...contract, pvpEligibility: eligible };
}

export function calculateElementCompatibility(
  playerElement?: string,
  creatureElements: string[] = []
): number {
  if (!playerElement || creatureElements.length === 0) {
    return DEFAULT_ELEMENT_COMPATIBILITY;
  }

  const hasPrimary = creatureElements.some(
    (e) => e.toLowerCase() === playerElement.toLowerCase()
  );

  return hasPrimary ? 100 : 80;
}

export function canTradeContract(contract: CreatureContract): boolean {
  return contract.tradeStatus !== 'bound';
}

export function canBreedContract(contract: CreatureContract): boolean {
  return contract.breedingRights && contract.contractStability >= 50;
}

export function canPvPContract(contract: CreatureContract): boolean {
  return contract.pvpEligibility && contract.contractStability >= 30;
}

export function serializeContract(contract: CreatureContract): Record<string, unknown> {
  return {
    id: contract.id,
    templateKey: contract.templateKey,
    nickname: contract.nickname,
    bondLevel: contract.bondLevel,
    trust: contract.trust,
    loyalty: contract.loyalty,
    contractStability: contract.contractStability,
    elementCompatibility: contract.elementCompatibility,
    commandPermissions: [...contract.commandPermissions],
    tradeStatus: contract.tradeStatus,
    breedingRights: contract.breedingRights,
    pvpEligibility: contract.pvpEligibility,
    summonedAt: contract.summonedAt,
    contractedAt: contract.contractedAt,
    instance: contract.instance,
  };
}

export function deserializeContract(
  data: Record<string, unknown>
): CreatureContract {
  return {
    id: data.id as string,
    templateKey: data.templateKey as string,
    nickname: data.nickname as string | undefined,
    bondLevel: (data.bondLevel as number) ?? DEFAULT_BOND_LEVEL,
    trust: (data.trust as number) ?? DEFAULT_TRUST,
    loyalty: (data.loyalty as number) ?? DEFAULT_LOYALTY,
    contractStability: (data.contractStability as number) ?? DEFAULT_CONTRACT_STABILITY,
    elementCompatibility: (data.elementCompatibility as number) ?? DEFAULT_ELEMENT_COMPATIBILITY,
    commandPermissions: (data.commandPermissions as string[]) ?? [...DEFAULT_COMMAND_PERMISSIONS],
    tradeStatus: (data.tradeStatus as CreatureContract['tradeStatus']) ?? DEFAULT_TRADE_STATUS,
    breedingRights: (data.breedingRights as boolean) ?? DEFAULT_BREEDING_RIGHTS,
    pvpEligibility: (data.pvpEligibility as boolean) ?? DEFAULT_PVP_ELIGIBILITY,
    summonedAt: data.summonedAt as number | undefined,
    contractedAt: (data.contractedAt as number) ?? Date.now(),
    instance: data.instance as CreatureInstance,
  };
}

export function getContractSummary(contract: CreatureContract): ContractSummary {
  return {
    id: contract.id,
    templateKey: contract.templateKey,
    nickname: contract.nickname,
    bondLevel: contract.bondLevel,
    trust: contract.trust,
    loyalty: contract.loyalty,
    contractStability: contract.contractStability,
    elementCompatibility: contract.elementCompatibility,
    tradeStatus: contract.tradeStatus,
    breedingRights: contract.breedingRights,
    pvpEligibility: contract.pvpEligibility,
    commandPermissionCount: contract.commandPermissions.length,
  };
}
