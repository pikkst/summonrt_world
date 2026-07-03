import type { CreatureContract, PlayerCoreState, PlayerSecondaryStats } from '../../types/playerCore.ts';
import type { CreatureInstance, DungeonState } from '../../types/game.ts';

export const BASE_SUMMON_MANA_COST = 20;
export const BASE_SUMMON_COOLDOWN_MS = 30_000;
export const ELEMENT_COMPATIBILITY_MANA_REDUCTION = 0.15;
export const CONTRACT_STABILITY_MIN_FOR_SUMMON = 20;
export const AFFECTION_BOOST_THRESHOLD = 50;
export const AFFECTION_BOOST_MULTIPLIER = 0.2;
export const SUMMON_DURATION_MS = 300_000;

export type SummonLocationType = 'world' | 'dungeon' | 'pvp_arena' | 'safe_zone';

export interface SummonCheckResult {
  canSummon: boolean;
  reason?: string;
  manaCost?: number;
  cooldownMs?: number;
}

export interface SummonResult {
  success: boolean;
  manaCost: number;
  cooldownMs: number;
  creatureInstanceId: string;
  message: string;
}

export interface SummonState {
  lastSummonTimestamp: number;
  activeSummonId?: string;
  summoningCharges: number;
}

export function getManaCostModifier(
  contract: CreatureContract | undefined,
  secondaryStats: PlayerSecondaryStats
): number {
  let modifier = 0;
  modifier += (secondaryStats.summoningCost - 100);

  if (contract) {
    const elementBonus = (contract.elementCompatibility - 100) * ELEMENT_COMPATIBILITY_MANA_REDUCTION;
    modifier += elementBonus;
  }

  return Math.max(-50, Math.min(100, modifier));
}

export function calculateSummonManaCost(
  contract: CreatureContract | undefined,
  secondaryStats: PlayerSecondaryStats
): number {
  const modifier = getManaCostModifier(contract, secondaryStats);
  const cost = Math.ceil(BASE_SUMMON_MANA_COST * (1 + modifier / 100));
  return Math.max(5, cost);
}

export function getSummonCooldown(
  contract: CreatureContract | undefined,
  secondaryStats: PlayerSecondaryStats
): number {
  let cooldown = BASE_SUMMON_COOLDOWN_MS;

  if (contract) {
    const stabilityReduction = (100 - contract.contractStability) * 0.1;
    cooldown += cooldown * (stabilityReduction / 100);
  }

  return Math.ceil(cooldown);
}

export function canSummonAtLocation(
  locationType: SummonLocationType,
  dungeonState?: DungeonState,
  pvpActive?: boolean
): boolean {
  switch (locationType) {
    case 'world':
      return true;
    case 'safe_zone':
      return true;
    case 'dungeon':
      return !dungeonState?.active || !!dungeonState?.safeFloor;
    case 'pvp_arena':
      return pvpActive ?? false;
    default:
      return false;
  }
}

export function getSummonRestrictions(
  locationType: SummonLocationType,
  dungeonState?: DungeonState
): { allowed: boolean; restricted: boolean } {
  const allowed = canSummonAtLocation(locationType, dungeonState);
  const restricted = locationType === 'dungeon' && !!dungeonState?.active && !dungeonState?.safeFloor;
  return { allowed, restricted };
}

export function checkSummonEligibility(
  playerState: PlayerCoreState,
  contractId: string,
  currentTime: number = Date.now(),
  locationType: SummonLocationType = 'world',
  dungeonState?: DungeonState,
  pvpActive?: boolean,
  lastSummonTime?: number
): SummonCheckResult {
  const contract = playerState.creatureContracts.find((c) => c.id === contractId);

  if (!contract) {
    return { canSummon: false, reason: 'No contract found with that ID' };
  }

  if (contract.contractStability < CONTRACT_STABILITY_MIN_FOR_SUMMON) {
    return { canSummon: false, reason: 'Contract stability too low for summoning' };
  }

  const { allowed } = getSummonRestrictions(locationType, dungeonState);
  if (!allowed) {
    return { canSummon: false, reason: 'Summoning restricted in this location' };
  }

  const manaCost = calculateSummonManaCost(contract, playerState.secondaryStats);
  const maxMana = playerState.resources.energy.max;
  const currentMana = playerState.resources.energy.current;

  if (currentMana < manaCost) {
    return { canSummon: false, reason: `Insufficient mana (need ${manaCost}, have ${currentMana})` };
  }

  const cooldown = getSummonCooldown(contract, playerState.secondaryStats);

  if (lastSummonTime !== undefined && isOnCooldown(lastSummonTime, cooldown, currentTime)) {
    const remaining = getRemainingCooldown(lastSummonTime, cooldown, currentTime);
    return { canSummon: false, reason: `Creature is on cooldown (${remaining}s remaining)` };
  }

  return {
    canSummon: true,
    manaCost,
    cooldownMs: cooldown,
  };
}

export function performSummon(
  playerState: PlayerCoreState,
  contractId: string,
  currentTime: number = Date.now(),
  locationType: SummonLocationType = 'world',
  dungeonState?: DungeonState,
  pvpActive?: boolean
): SummonResult {
  const eligibility = checkSummonEligibility(
    playerState,
    contractId,
    currentTime,
    locationType,
    dungeonState,
    pvpActive
  );

  if (!eligibility.canSummon) {
    return {
      success: false,
      manaCost: eligibility.manaCost ?? 0,
      cooldownMs: eligibility.cooldownMs ?? 0,
      creatureInstanceId: '',
      message: eligibility.reason ?? 'Unknown summoning error',
    };
  }

  const contract = playerState.creatureContracts.find((c) => c.id === contractId)!;
  const instanceId = `${contract.id}_summon_${currentTime}`;

  return {
    success: true,
    manaCost: eligibility.manaCost!,
    cooldownMs: eligibility.cooldownMs!,
    creatureInstanceId: instanceId,
    message: `Summoned ${contract.nickname || contract.templateKey}!`,
  };
}

export function isOnCooldown(
  lastSummonTime: number,
  cooldownMs: number,
  currentTime: number = Date.now()
): boolean {
  return currentTime < lastSummonTime + cooldownMs;
}

export function getRemainingCooldown(
  lastSummonTime: number,
  cooldownMs: number,
  currentTime: number = Date.now()
): number {
  const remaining = lastSummonTime + cooldownMs - currentTime;
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function getAffectionSummonBoost(contract: CreatureContract): number {
  const affection = contract.instance.affection ?? 0;
  if (affection >= AFFECTION_BOOST_THRESHOLD) {
    return AFFECTION_BOOST_MULTIPLIER;
  }
  return 0;
}

export function calculateElementCompatibilityBoost(contract: CreatureContract): number {
  return (contract.elementCompatibility - 100) * 0.01;
}

export interface SummonSuccessModifiers {
  affectionBoost: number;
  elementBoost: number;
  stabilityPenalty: number;
}

export function getSummonSuccessModifiers(contract: CreatureContract): SummonSuccessModifiers {
  const affectionBoost = getAffectionSummonBoost(contract);
  const elementBoost = calculateElementCompatibilityBoost(contract);
  const stabilityPenalty = contract.contractStability < 50 ? 0.15 : 0;

  return {
    affectionBoost,
    elementBoost,
    stabilityPenalty,
  };
}

export function getSummonSuccessChance(
  _contract: CreatureContract,
  modifiers: SummonSuccessModifiers
): number {
  let chance = 1.0;
  chance += modifiers.affectionBoost;
  chance += modifiers.elementBoost;
  chance -= modifiers.stabilityPenalty;
  return Math.max(0.5, Math.min(1.5, chance));
}

export function getActiveSummonFromContract(
  contract: CreatureContract
): CreatureInstance | undefined {
  if (!contract.summonedAt) return undefined;

  const summonAge = Date.now() - contract.summonedAt;

  if (summonAge > SUMMON_DURATION_MS) return undefined;

  return {
    ...contract.instance,
    id: `${contract.id}_active`,
  };
}

export function updateContractSummonedTime(contract: CreatureContract): CreatureContract {
  return {
    ...contract,
    summonedAt: Date.now(),
  };
}

export function clearContractSummonedTime(contract: CreatureContract): CreatureContract {
  const { summonedAt, ...rest } = contract;
  return rest as CreatureContract;
}

export interface SummonHistoryEntry {
  contractId: string;
  summonedAt: number;
  location: SummonLocationType;
  success: boolean;
}

export function serializeSummonHistory(history: SummonHistoryEntry[]): Record<string, unknown> {
  return {
    entries: history.map((entry) => ({
      contractId: entry.contractId,
      summonedAt: entry.summonedAt,
      location: entry.location,
      success: entry.success,
    })),
  };
}

export function deserializeSummonHistory(data: Record<string, unknown>): SummonHistoryEntry[] {
  const rawEntries = data.entries;
  if (!Array.isArray(rawEntries)) return [];

  return rawEntries
    .filter((entry): entry is Record<string, unknown> =>
      typeof entry === 'object' && entry !== null
    )
    .map((entry) => ({
      contractId: (entry.contractId as string) ?? '',
      summonedAt: typeof entry.summonedAt === 'number' ? entry.summonedAt : 0,
      location: (entry.location as SummonLocationType) ?? 'world',
      success: Boolean(entry.success),
    }));
}