import type { PlayerStatistics } from '../../types/playerCore.ts';

export type PlayerStatisticKey = keyof PlayerStatistics;

export type PlayerStatisticUpdateMode = 'increment' | 'set' | 'max';

export interface PlayerStatisticDefinition {
  key: PlayerStatisticKey;
  label: string;
  description: string;
  defaultMode: PlayerStatisticUpdateMode;
}

export type PlayerStatisticEvent =
  | { type: 'WorldUnlocked'; worldId: number; unlockedWorldCount?: number }
  | { type: 'CreatureContracted'; count?: number }
  | { type: 'DungeonCleared'; worldId: number; floorCount?: number }
  | { type: 'ItemCrafted'; count?: number }
  | { type: 'TradeCompleted'; count?: number }
  | { type: 'GoldEarned'; amount: number }
  | { type: 'BossDefeated'; worldId?: number; bossKey?: string }
  | { type: 'PvpWon'; opponentId?: string }
  | { type: 'HousingValueChanged'; value: number }
  | { type: 'GuildContributionAdded'; amount: number }
  | { type: 'QuestCompleted'; questKey: string };

export const PLAYER_STATISTIC_DEFINITIONS: Record<PlayerStatisticKey, PlayerStatisticDefinition> = {
  worldsUnlocked: {
    key: 'worldsUnlocked',
    label: 'Worlds Unlocked',
    description: 'Highest count of player-accessible worlds.',
    defaultMode: 'max',
  },
  creaturesContracted: {
    key: 'creaturesContracted',
    label: 'Creatures Contracted',
    description: 'Total successful creature contracts.',
    defaultMode: 'increment',
  },
  dungeonsCleared: {
    key: 'dungeonsCleared',
    label: 'Dungeons Cleared',
    description: 'Total dungeon towers cleared by defeating their final boss.',
    defaultMode: 'increment',
  },
  itemsCrafted: {
    key: 'itemsCrafted',
    label: 'Items Crafted',
    description: 'Total completed crafting outcomes.',
    defaultMode: 'increment',
  },
  tradesCompleted: {
    key: 'tradesCompleted',
    label: 'Trades Completed',
    description: 'Total accepted trades.',
    defaultMode: 'increment',
  },
  goldEarned: {
    key: 'goldEarned',
    label: 'Gold Earned',
    description: 'Total gold earned from rewards and income.',
    defaultMode: 'increment',
  },
  bossesDefeated: {
    key: 'bossesDefeated',
    label: 'Bosses Defeated',
    description: 'Total boss victories.',
    defaultMode: 'increment',
  },
  pvpWins: {
    key: 'pvpWins',
    label: 'PvP Wins',
    description: 'Total player-versus-player victories.',
    defaultMode: 'increment',
  },
  housingValue: {
    key: 'housingValue',
    label: 'Housing Value',
    description: 'Highest known value of player-owned housing.',
    defaultMode: 'max',
  },
  guildContributions: {
    key: 'guildContributions',
    label: 'Guild Contributions',
    description: 'Total value contributed to guild activity.',
    defaultMode: 'increment',
  },
  questsCompleted: {
    key: 'questsCompleted',
    label: 'Quests Completed',
    description: 'Total completed quests.',
    defaultMode: 'increment',
  },
};

export function createDefaultPlayerStatistics(startingWorldCount = 1): PlayerStatistics {
  return {
    worldsUnlocked: Math.max(0, Math.floor(startingWorldCount)),
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
  };
}

export function normalizePlayerStatistics(value: Partial<PlayerStatistics> | undefined): PlayerStatistics {
  const defaults = createDefaultPlayerStatistics();
  return {
    worldsUnlocked: normalizeStatisticValue(value?.worldsUnlocked, defaults.worldsUnlocked),
    creaturesContracted: normalizeStatisticValue(value?.creaturesContracted, defaults.creaturesContracted),
    dungeonsCleared: normalizeStatisticValue(value?.dungeonsCleared, defaults.dungeonsCleared),
    itemsCrafted: normalizeStatisticValue(value?.itemsCrafted, defaults.itemsCrafted),
    tradesCompleted: normalizeStatisticValue(value?.tradesCompleted, defaults.tradesCompleted),
    goldEarned: normalizeStatisticValue(value?.goldEarned, defaults.goldEarned),
    bossesDefeated: normalizeStatisticValue(value?.bossesDefeated, defaults.bossesDefeated),
    pvpWins: normalizeStatisticValue(value?.pvpWins, defaults.pvpWins),
    housingValue: normalizeStatisticValue(value?.housingValue, defaults.housingValue),
    guildContributions: normalizeStatisticValue(value?.guildContributions, defaults.guildContributions),
    questsCompleted: normalizeStatisticValue(value?.questsCompleted, defaults.questsCompleted),
  };
}

export function mergePlayerStatistics(
  base: Partial<PlayerStatistics> | undefined,
  incoming: Partial<PlayerStatistics> | undefined
): PlayerStatistics {
  const normalizedBase = normalizePlayerStatistics(base);
  const normalizedIncoming = normalizePlayerStatistics(incoming);
  return {
    worldsUnlocked: Math.max(normalizedBase.worldsUnlocked, normalizedIncoming.worldsUnlocked),
    creaturesContracted: Math.max(normalizedBase.creaturesContracted, normalizedIncoming.creaturesContracted),
    dungeonsCleared: Math.max(normalizedBase.dungeonsCleared, normalizedIncoming.dungeonsCleared),
    itemsCrafted: Math.max(normalizedBase.itemsCrafted, normalizedIncoming.itemsCrafted),
    tradesCompleted: Math.max(normalizedBase.tradesCompleted, normalizedIncoming.tradesCompleted),
    goldEarned: Math.max(normalizedBase.goldEarned, normalizedIncoming.goldEarned),
    bossesDefeated: Math.max(normalizedBase.bossesDefeated, normalizedIncoming.bossesDefeated),
    pvpWins: Math.max(normalizedBase.pvpWins, normalizedIncoming.pvpWins),
    housingValue: Math.max(normalizedBase.housingValue, normalizedIncoming.housingValue),
    guildContributions: Math.max(normalizedBase.guildContributions, normalizedIncoming.guildContributions),
    questsCompleted: Math.max(normalizedBase.questsCompleted, normalizedIncoming.questsCompleted),
  };
}

export function updatePlayerStatistic(
  statistics: PlayerStatistics,
  key: PlayerStatisticKey,
  value = 1,
  mode: PlayerStatisticUpdateMode = PLAYER_STATISTIC_DEFINITIONS[key].defaultMode
): PlayerStatistics {
  const amount = normalizeStatisticValue(value, 0);
  const current = statistics[key];
  const nextValue = mode === 'increment'
    ? current + amount
    : mode === 'max'
      ? Math.max(current, amount)
      : amount;

  return {
    ...statistics,
    [key]: Math.max(0, Math.floor(nextValue)),
  };
}

export function applyPlayerStatisticEvent(
  statistics: PlayerStatistics,
  event: PlayerStatisticEvent
): PlayerStatistics {
  switch (event.type) {
    case 'WorldUnlocked':
      return updatePlayerStatistic(statistics, 'worldsUnlocked', event.unlockedWorldCount ?? event.worldId, 'max');
    case 'CreatureContracted':
      return updatePlayerStatistic(statistics, 'creaturesContracted', event.count ?? 1);
    case 'DungeonCleared':
      return updatePlayerStatistic(statistics, 'dungeonsCleared');
    case 'ItemCrafted':
      return updatePlayerStatistic(statistics, 'itemsCrafted', event.count ?? 1);
    case 'TradeCompleted':
      return updatePlayerStatistic(statistics, 'tradesCompleted', event.count ?? 1);
    case 'GoldEarned':
      return updatePlayerStatistic(statistics, 'goldEarned', event.amount);
    case 'BossDefeated':
      return updatePlayerStatistic(statistics, 'bossesDefeated');
    case 'PvpWon':
      return updatePlayerStatistic(statistics, 'pvpWins');
    case 'HousingValueChanged':
      return updatePlayerStatistic(statistics, 'housingValue', event.value, 'max');
    case 'GuildContributionAdded':
      return updatePlayerStatistic(statistics, 'guildContributions', event.amount);
    case 'QuestCompleted':
      return updatePlayerStatistic(statistics, 'questsCompleted');
    default:
      return assertNever(event);
  }
}

function normalizeStatisticValue(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled player statistic event: ${JSON.stringify(value)}`);
}
