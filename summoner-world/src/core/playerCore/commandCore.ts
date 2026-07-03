import { COMMAND_PERMISSIONS as CONTRACT_COMMAND_PERMISSIONS } from './contractCore';
import type { CreatureContract, PlayerCoreState } from '../../types/playerCore.ts';
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

export const COMMAND_PERMISSIONS = CONTRACT_COMMAND_PERMISSIONS as readonly CreatureCommand[];

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
];

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

  if (contract.contractStability < 20) {
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
  const hasBraveTrait = traits.some((t) => t.toLowerCase().includes('brave'));
  const hasCowardlyTrait = traits.some((t) => t.toLowerCase().includes('cowardly'));
  const hasLoyalTrait = traits.some((t) => t.toLowerCase().includes('loyal'));

  let obedience = 0.75;
  obedience += (contract.loyalty - 50) * 0.003;
  obedience += (contract.trust - 50) * 0.002;
  obedience += (contract.bondLevel - 1) * 0.005;
  obedience += (contract.instance.affection ?? 0) * 0.0005;

  const dangerLevel = context.dangerLevel ?? 0;
  if (DANGEROUS_COMMANDS.includes(command)) {
    obedience -= dangerLevel * 0.02;
    if (hasCowardlyTrait) {
      obedience -= 0.15;
    }
    if (hasBraveTrait) {
      obedience += 0.1;
    }
  }

  if (command === 'avoid_combat' && hasBraveTrait) {
    obedience -= 0.1;
  }

  if (command === 'protect_ally' && hasLoyalTrait) {
    obedience += 0.15;
  }

  if (command === 'retreat') {
    if (hasBraveTrait) {
      obedience -= 0.2;
    }
    if (hasCowardlyTrait) {
      obedience += 0.1;
    }
  }

  const stabilityPenalty = (100 - contract.contractStability) * 0.002;
  obedience -= stabilityPenalty;

  const successChance = clamp(obedience, 0.35, 0.98);
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
