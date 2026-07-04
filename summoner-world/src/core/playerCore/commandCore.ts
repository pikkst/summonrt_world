import { CONTRACT_STABILITY_MIN_FOR_SUMMON } from './summoningCore';
import type { CreatureContract } from '../../types/playerCore.ts';
import type { CreatureInstance } from '../../types/game.ts';

export type CreatureCommand =
  | 'follow'
  | 'stay'
  | 'guard'
  | 'attack'
  | 'defend'
  | 'retreat'
  | 'scout'
  | 'gather'
  | 'track'
  | 'interact'
  | 'use_ability'
  | 'protect_ally'
  | 'avoid_combat';

export const COMMAND_PERMISSIONS = [
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
] as const;

export interface CommandContext {
  worldId: number;
  locationType: 'world' | 'dungeon' | 'pvp_arena' | 'safe_zone';
  inCombat: boolean;
  biome?: string;
  dangerLevel?: number;
}

export interface CommandValidationResult {
  valid: boolean;
  hasPermission: boolean;
  reason?: string;
}

export interface CommandResolutionResult {
  success: boolean;
  command: CreatureCommand;
  message: string;
  loyaltyDelta: number;
  trustDelta: number;
  affectionDelta: number;
  contractStabilityDelta: number;
}

export interface CommandEffects {
  loyaltyDelta: number;
  trustDelta: number;
  affectionDelta: number;
  contractStabilityDelta: number;
}

const BASE_COMMAND_EFFECTS: Record<CreatureCommand, CommandEffects> = {
  follow: { loyaltyDelta: 0, trustDelta: 0, affectionDelta: 1, contractStabilityDelta: 0 },
  stay: { loyaltyDelta: -1, trustDelta: 0, affectionDelta: 0, contractStabilityDelta: 0 },
  guard: { loyaltyDelta: 0, trustDelta: 1, affectionDelta: 2, contractStabilityDelta: 0 },
  attack: { loyaltyDelta: 1, trustDelta: 1, affectionDelta: 1, contractStabilityDelta: 0 },
  defend: { loyaltyDelta: 0, trustDelta: 1, affectionDelta: 1, contractStabilityDelta: 0 },
  retreat: { loyaltyDelta: -2, trustDelta: -1, affectionDelta: -1, contractStabilityDelta: -1 },
  scout: { loyaltyDelta: 0, trustDelta: 0, affectionDelta: 1, contractStabilityDelta: 0 },
  gather: { loyaltyDelta: 0, trustDelta: 1, affectionDelta: 2, contractStabilityDelta: 0 },
  track: { loyaltyDelta: 0, trustDelta: 0, affectionDelta: 1, contractStabilityDelta: 0 },
  interact: { loyaltyDelta: 0, trustDelta: 1, affectionDelta: 1, contractStabilityDelta: 0 },
  use_ability: { loyaltyDelta: 0, trustDelta: 1, affectionDelta: 1, contractStabilityDelta: 0 },
  protect_ally: { loyaltyDelta: 2, trustDelta: 2, affectionDelta: 2, contractStabilityDelta: 0 },
  avoid_combat: { loyaltyDelta: -1, trustDelta: -1, affectionDelta: -1, contractStabilityDelta: 0 },
};

const COMBAT_RESTRICTED_COMMANDS: readonly CreatureCommand[] = [
  'scout',
  'gather',
  'track',
  'interact',
];

const DANGEROUS_COMMANDS: readonly CreatureCommand[] = [
  'attack',
  'defend',
  'protect_ally',
  'use_ability',
];

const BASE_OBEDIENCE = 0.75;
const LOYALTY_OBEDIENCE_FACTOR = 0.003;
const TRUST_OBEDIENCE_FACTOR = 0.002;
const BOND_OBEDIENCE_FACTOR = 0.005;
const AFFECTION_OBEDIENCE_FACTOR = 0.0005;
const DANGER_OBEDIENCE_FACTOR = 0.02;
const COWARDLY_DANGER_PENALTY = 0.15;
const BRAVE_DANGER_BONUS = 0.1;
const BRAVE_AVOID_COMBAT_PENALTY = 0.3;
const COWARDLY_RETREAT_BONUS = 0.1;
const BRAVE_RETREAT_PENALTY = 0.2;
const LOYAL_PROTECT_BONUS = 0.15;
const STABILITY_PENALTY_FACTOR = 0.002;
const MIN_SUCCESS_CHANCE = 0.35;
const MAX_SUCCESS_CHANCE = 0.98;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function hasCommandPermission(
  contract: CreatureContract,
  command: CreatureCommand
): boolean {
  return contract.commandPermissions.includes(command);
}

export function validateCommand(
  contract: CreatureContract,
  command: CreatureCommand
): CommandValidationResult {
  const hasPermission = hasCommandPermission(contract, command);

  if (!hasPermission) {
    return {
      valid: false,
      hasPermission: false,
      reason: `Creature does not have permission for command: ${command}`,
    };
  }

  return {
    valid: true,
    hasPermission: true,
  };
}

export function checkCommandEligibility(
  contract: CreatureContract,
  command: CreatureCommand,
  context: CommandContext
): CommandValidationResult {
  const permissionResult = validateCommand(contract, command);

  if (!permissionResult.valid) {
    return permissionResult;
  }

  if (contract.contractStability < CONTRACT_STABILITY_MIN_FOR_SUMMON) {
    return {
      valid: false,
      hasPermission: true,
      reason: 'Contract stability too low to execute commands',
    };
  }

  if (COMBAT_RESTRICTED_COMMANDS.includes(command) && context.inCombat) {
    return {
      valid: false,
      hasPermission: true,
      reason: `Cannot execute ${command} while in combat`,
    };
  }

  if (
    (command === 'attack' || command === 'defend') &&
    !context.inCombat &&
    context.locationType !== 'pvp_arena'
  ) {
    return {
      valid: false,
      hasPermission: true,
      reason: `Cannot execute ${command} outside of combat`,
    };
  }

  return {
    valid: true,
    hasPermission: true,
  };
}

export function resolveCommandWithAI(
  contract: CreatureContract,
  command: CreatureCommand,
  context: CommandContext
): CommandResolutionResult {
  const eligibility = checkCommandEligibility(contract, command, context);

  if (!eligibility.valid) {
    return {
      success: false,
      command,
      message: eligibility.reason ?? 'Command not eligible',
      loyaltyDelta: 0,
      trustDelta: 0,
      affectionDelta: 0,
      contractStabilityDelta: 0,
    };
  }

  const traits = contract.instance.traits ?? [];
  const hasBraveTrait = traits.some((t) => t.toLowerCase() === 'brave');
  const hasCowardlyTrait = traits.some((t) => t.toLowerCase() === 'cowardly');
  const hasLoyalTrait = traits.some((t) => t.toLowerCase() === 'loyal');

  let obedience = BASE_OBEDIENCE;
  obedience += (contract.loyalty - 50) * LOYALTY_OBEDIENCE_FACTOR;
  obedience += (contract.trust - 50) * TRUST_OBEDIENCE_FACTOR;
  obedience += (contract.bondLevel - 1) * BOND_OBEDIENCE_FACTOR;
  obedience += (contract.instance.affection ?? 0) * AFFECTION_OBEDIENCE_FACTOR;

  const dangerLevel = context.dangerLevel ?? 0;
  if (DANGEROUS_COMMANDS.includes(command)) {
    obedience -= dangerLevel * DANGER_OBEDIENCE_FACTOR;
    if (hasCowardlyTrait) {
      obedience -= COWARDLY_DANGER_PENALTY;
    }
    if (hasBraveTrait) {
      obedience += BRAVE_DANGER_BONUS;
    }
  }

  if (command === 'avoid_combat') {
    if (hasBraveTrait) {
      obedience -= BRAVE_AVOID_COMBAT_PENALTY;
    }
    if (hasCowardlyTrait) {
      obedience += COWARDLY_DANGER_PENALTY;
    }
  }

  if (command === 'protect_ally') {
    if (hasLoyalTrait) {
      obedience += LOYAL_PROTECT_BONUS;
    }
    if (hasBraveTrait) {
      obedience += BRAVE_DANGER_BONUS;
    }
  }

  if (command === 'retreat') {
    if (hasBraveTrait) {
      obedience -= BRAVE_RETREAT_PENALTY;
    }
    if (hasCowardlyTrait) {
      obedience += COWARDLY_RETREAT_BONUS;
    }
  }

  const stabilityPenalty = (100 - contract.contractStability) * STABILITY_PENALTY_FACTOR;
  obedience -= stabilityPenalty;

  const successChance = clamp(obedience, MIN_SUCCESS_CHANCE, MAX_SUCCESS_CHANCE);
  const success = successChance >= 0.5;

  let message = '';
  if (success) {
    const effects = BASE_COMMAND_EFFECTS[command];
    message = `${contract.nickname || contract.templateKey} obeys the ${command} command.`;
    return {
      success: true,
      command,
      message,
      loyaltyDelta: effects.loyaltyDelta,
      trustDelta: effects.trustDelta,
      affectionDelta: effects.affectionDelta,
      contractStabilityDelta: effects.contractStabilityDelta,
    };
  }

  message = `${contract.nickname || contract.templateKey} resists the ${command} command.`;
  return {
    success: false,
    command,
    message,
    loyaltyDelta: -1,
    trustDelta: -1,
    affectionDelta: -1,
    contractStabilityDelta: -1,
  };
}

export function getAvailableCommands(contract: CreatureContract): CreatureCommand[] {
  return COMMAND_PERMISSIONS.filter((cmd) =>
    contract.commandPermissions.includes(cmd)
  ) as CreatureCommand[];
}

export function createDefaultCommandPermissions(): CreatureCommand[] {
  return [...COMMAND_PERMISSIONS] as CreatureCommand[];
}
