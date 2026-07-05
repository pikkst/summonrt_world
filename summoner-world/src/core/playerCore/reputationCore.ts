import type {
  PlayerCoreState,
  ReputationChange,
  ReputationChangeSource,
  ReputationDomain,
  ReputationEffects,
  ReputationState,
} from '../../types/playerCore.ts';

export const REPUTATION_MIN = -100;
export const REPUTATION_MAX = 100;
export const REPUTATION_NEUTRAL = 0;

export const REPUTATION_SOURCE_MULTIPLIERS: Record<ReputationChangeSource, number> = {
  quest: 1,
  trading: 0.75,
  ecosystem_impact: 1,
  dungeon_clearing: 1.25,
};

export function createDefaultReputationState(startingWorldId = 1): ReputationState {
  return {
    world_rep: { [startingWorldId]: REPUTATION_NEUTRAL },
    faction_rep: {},
    settlement_rep: {},
    creature_rep: {},
  };
}

export function getReputationScore(
  reputation: ReputationState,
  domain: ReputationDomain,
  targetId: number | string
): number {
  const table = getReputationTable(reputation, domain);
  const value = table[String(targetId)];
  return typeof value === 'number' ? value : REPUTATION_NEUTRAL;
}

export function applyReputationChange(
  reputation: ReputationState,
  change: ReputationChange,
  reputationGain = 100
): ReputationState {
  const current = getReputationScore(reputation, change.domain, change.targetId);
  const scaledAmount = scaleReputationAmount(change.amount, change.source, reputationGain);
  const nextScore = clampReputation(current + scaledAmount);
  const key = String(change.targetId);

  return {
    ...reputation,
    [getReputationKey(change.domain)]: {
      ...getReputationTable(reputation, change.domain),
      [key]: nextScore,
    },
  };
}

export function applyPlayerReputationChange(
  player: PlayerCoreState,
  change: ReputationChange
): PlayerCoreState {
  return {
    ...player,
    reputation: applyReputationChange(player.reputation, change, player.secondaryStats.reputationGain),
  };
}

export function calculateReputationEffects(
  reputation: ReputationState,
  context: {
    worldId?: number;
    factionId?: string;
    settlementId?: string;
    creatureId?: string;
  } = {}
): ReputationEffects {
  const worldScore = context.worldId === undefined
    ? REPUTATION_NEUTRAL
    : getReputationScore(reputation, 'world', context.worldId);
  const factionScore = context.factionId === undefined
    ? REPUTATION_NEUTRAL
    : getReputationScore(reputation, 'faction', context.factionId);
  const settlementScore = context.settlementId === undefined
    ? REPUTATION_NEUTRAL
    : getReputationScore(reputation, 'settlement', context.settlementId);
  const creatureScore = context.creatureId === undefined
    ? REPUTATION_NEUTRAL
    : getReputationScore(reputation, 'creature', context.creatureId);
  const socialScore = average([worldScore, factionScore, settlementScore]);
  const merchantScore = average([factionScore, settlementScore]);

  return {
    merchantPriceMultiplier: roundToHundredths(clamp(1 - merchantScore * 0.0015, 0.75, 1.25)),
    creatureCaptureChanceModifierPct: roundToHundredths(clamp(creatureScore * 0.15, -15, 15)),
    settlementGrowthModifierPct: roundToHundredths(clamp(settlementScore * 0.2, -20, 20)),
    dungeonDifficultyModifierPct: roundToHundredths(clamp(worldScore * -0.1, -10, 10)),
    npcReactionModifierPct: roundToHundredths(clamp(socialScore * 0.2, -20, 20)),
  };
}

function scaleReputationAmount(
  amount: number,
  source: ReputationChangeSource,
  reputationGain: number
): number {
  const multiplier = REPUTATION_SOURCE_MULTIPLIERS[source];
  const gainMultiplier = Math.max(0, reputationGain) / 100;
  return amount * multiplier * gainMultiplier;
}

function getReputationKey(
  domain: ReputationDomain
): keyof ReputationState {
  switch (domain) {
    case 'world':
      return 'world_rep';
    case 'faction':
      return 'faction_rep';
    case 'settlement':
      return 'settlement_rep';
    case 'creature':
      return 'creature_rep';
  }
}

function getReputationTable(
  reputation: ReputationState,
  domain: ReputationDomain
): Record<string, number> {
  return reputation[getReputationKey(domain)] as Record<string, number>;
}

function clampReputation(value: number): number {
  return roundToHundredths(clamp(value, REPUTATION_MIN, REPUTATION_MAX));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return REPUTATION_NEUTRAL;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}
