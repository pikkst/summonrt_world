import type {
  AchievementEntry,
  PlayerAchievementCategoryId,
  PlayerCoreState,
  PlayerStatistics,
  TitleEntry,
} from '../../types/playerCore.ts';

export interface TitleDefinition {
  key: string;
  name: string;
  category: PlayerAchievementCategoryId;
  description: string;
}

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  category: PlayerAchievementCategoryId;
  statistic?: keyof PlayerStatistics;
  target: number;
  grantsTitleKey?: string;
}

export const TITLE_DEFINITIONS: readonly TitleDefinition[] = [
  {
    key: 'trailfinder',
    name: 'Trailfinder',
    category: 'exploration',
    description: 'Unlocked the first world path and began charting the wider world.',
  },
  {
    key: 'beast_keeper',
    name: 'Beast Keeper',
    category: 'creature_collection',
    description: 'Formed a first creature contract.',
  },
  {
    key: 'workshop_initiate',
    name: 'Workshop Initiate',
    category: 'crafting',
    description: 'Crafted useful items through player-owned progression.',
  },
  {
    key: 'market_hand',
    name: 'Market Hand',
    category: 'economy',
    description: 'Completed trade activity and started shaping the economy.',
  },
  {
    key: 'homesteader',
    name: 'Homesteader',
    category: 'housing',
    description: 'Invested lasting value into housing or structures.',
  },
  {
    key: 'tower_delver',
    name: 'Tower Delver',
    category: 'dungeons',
    description: 'Cleared a dungeon and proved ready for deeper floors.',
  },
  {
    key: 'arena_spark',
    name: 'Arena Spark',
    category: 'pvp',
    description: 'Won a PvP battle.',
  },
  {
    key: 'guild_factor',
    name: 'Guild Factor',
    category: 'guilds',
    description: 'Contributed meaningful progress to a guild.',
  },
  {
    key: 'worldbreaker',
    name: 'Worldbreaker',
    category: 'world_completion',
    description: 'Unlocked the full chain of one hundred worlds.',
  },
  {
    key: 'omen_touched',
    name: 'Omen Touched',
    category: 'rare_events',
    description: 'Recorded a rare progression event.',
  },
] as const;

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    key: 'first_steps',
    name: 'First Steps',
    description: 'Unlock 1 world.',
    category: 'exploration',
    statistic: 'worldsUnlocked',
    target: 1,
    grantsTitleKey: 'trailfinder',
  },
  {
    key: 'contracted_companion',
    name: 'Contracted Companion',
    description: 'Contract 1 creature.',
    category: 'creature_collection',
    statistic: 'creaturesContracted',
    target: 1,
    grantsTitleKey: 'beast_keeper',
  },
  {
    key: 'first_craft',
    name: 'First Craft',
    description: 'Craft 1 item.',
    category: 'crafting',
    statistic: 'itemsCrafted',
    target: 1,
    grantsTitleKey: 'workshop_initiate',
  },
  {
    key: 'first_trade',
    name: 'First Trade',
    description: 'Complete 1 trade.',
    category: 'economy',
    statistic: 'tradesCompleted',
    target: 1,
    grantsTitleKey: 'market_hand',
  },
  {
    key: 'earned_purse',
    name: 'Earned Purse',
    description: 'Earn 1,000 gold.',
    category: 'economy',
    statistic: 'goldEarned',
    target: 1000,
  },
  {
    key: 'rooted_home',
    name: 'Rooted Home',
    description: 'Reach 1 housing value.',
    category: 'housing',
    statistic: 'housingValue',
    target: 1,
    grantsTitleKey: 'homesteader',
  },
  {
    key: 'first_clear',
    name: 'First Clear',
    description: 'Clear 1 dungeon.',
    category: 'dungeons',
    statistic: 'dungeonsCleared',
    target: 1,
    grantsTitleKey: 'tower_delver',
  },
  {
    key: 'boss_breaker',
    name: 'Boss Breaker',
    description: 'Defeat 1 boss.',
    category: 'dungeons',
    statistic: 'bossesDefeated',
    target: 1,
  },
  {
    key: 'arena_victor',
    name: 'Arena Victor',
    description: 'Win 1 PvP match.',
    category: 'pvp',
    statistic: 'pvpWins',
    target: 1,
    grantsTitleKey: 'arena_spark',
  },
  {
    key: 'guild_contributor',
    name: 'Guild Contributor',
    description: 'Contribute 1 point to a guild.',
    category: 'guilds',
    statistic: 'guildContributions',
    target: 1,
    grantsTitleKey: 'guild_factor',
  },
  {
    key: 'quest_known',
    name: 'Quest Known',
    description: 'Complete 1 quest.',
    category: 'exploration',
    statistic: 'questsCompleted',
    target: 1,
  },
  {
    key: 'hundred_world_gate',
    name: 'Hundred World Gate',
    description: 'Unlock 100 worlds.',
    category: 'world_completion',
    statistic: 'worldsUnlocked',
    target: 100,
    grantsTitleKey: 'worldbreaker',
  },
  {
    key: 'rare_omen',
    name: 'Rare Omen',
    description: 'Record 1 rare event.',
    category: 'rare_events',
    target: 1,
    grantsTitleKey: 'omen_touched',
  },
] as const;

const ACHIEVEMENT_CATEGORY_IDS = new Set<PlayerAchievementCategoryId>(
  ACHIEVEMENT_DEFINITIONS.map((achievement) => achievement.category)
);

const TITLE_BY_KEY = new Map(TITLE_DEFINITIONS.map((title) => [title.key, title]));
const ACHIEVEMENT_BY_KEY = new Map(ACHIEVEMENT_DEFINITIONS.map((achievement) => [achievement.key, achievement]));

export function getAllTitleDefinitions(): readonly TitleDefinition[] {
  return TITLE_DEFINITIONS;
}

export function getAllAchievementDefinitions(): readonly AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS;
}

export function isPlayerAchievementCategory(value: unknown): value is PlayerAchievementCategoryId {
  return typeof value === 'string' && ACHIEVEMENT_CATEGORY_IDS.has(value as PlayerAchievementCategoryId);
}

export function normalizeTitleEntry(entry: TitleEntry | (Partial<TitleEntry> & { key: string })): TitleEntry {
  const definition = TITLE_BY_KEY.get(entry.key);

  return {
    key: entry.key,
    name: entry.name ?? definition?.name ?? toDisplayName(entry.key),
    category: isPlayerAchievementCategory(entry.category) ? entry.category : definition?.category ?? 'rare_events',
    description: entry.description ?? definition?.description,
    unlockedAt: entry.unlockedAt,
  };
}

export function normalizeAchievementEntry(
  entry: AchievementEntry | (Partial<AchievementEntry> & { key: string })
): AchievementEntry {
  const definition = ACHIEVEMENT_BY_KEY.get(entry.key);
  const target = finiteNumber(entry.target) ?? definition?.target;
  const progress = finiteNumber(entry.progress);

  return {
    key: entry.key,
    name: entry.name ?? definition?.name ?? toDisplayName(entry.key),
    description: entry.description ?? definition?.description ?? '',
    category: isPlayerAchievementCategory(entry.category) ? entry.category : definition?.category ?? 'rare_events',
    unlocked: entry.unlocked ?? false,
    unlockedAt: entry.unlockedAt,
    progress,
    target,
  };
}

export function createTitleEntry(key: string, unlockedAt?: number): TitleEntry {
  const definition = TITLE_BY_KEY.get(key);
  if (!definition) {
    return normalizeTitleEntry({ key, unlockedAt });
  }

  return {
    key: definition.key,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    unlockedAt,
  };
}

export function createAchievementEntry(
  definition: AchievementDefinition,
  progress = 0,
  unlockedAt?: number
): AchievementEntry {
  const unlocked = progress >= definition.target;

  return {
    key: definition.key,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    unlocked,
    unlockedAt: unlocked ? unlockedAt : undefined,
    progress,
    target: definition.target,
  };
}

export function evaluateAchievementProgress(
  definition: AchievementDefinition,
  statistics: PlayerStatistics
): number {
  if (!definition.statistic) return 0;
  return Math.max(0, statistics[definition.statistic] ?? 0);
}

export function evaluateAchievements(
  statistics: PlayerStatistics,
  currentAchievements: readonly AchievementEntry[] = [],
  unlockedAt = Date.now()
): AchievementEntry[] {
  const currentByKey = new Map(currentAchievements.map((entry) => [entry.key, normalizeAchievementEntry(entry)]));
  const definedAchievements = ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const current = currentByKey.get(definition.key);
    const progress = definition.statistic
      ? evaluateAchievementProgress(definition, statistics)
      : current?.progress ?? 0;
    const unlocked = current?.unlocked === true || progress >= definition.target;

    return {
      key: definition.key,
      name: definition.name,
      description: definition.description,
      category: definition.category,
      unlocked,
      unlockedAt: unlocked ? current?.unlockedAt ?? unlockedAt : undefined,
      progress,
      target: definition.target,
    };
  });

  const customAchievements = Array.from(currentByKey.values()).filter(
    (achievement) => !ACHIEVEMENT_BY_KEY.has(achievement.key)
  );

  return [...definedAchievements, ...customAchievements];
}

export function getUnlockedTitlesForAchievements(
  achievements: readonly AchievementEntry[],
  currentTitles: readonly TitleEntry[] = [],
  unlockedAt = Date.now()
): TitleEntry[] {
  const titlesByKey = new Map(currentTitles.map((title) => [title.key, normalizeTitleEntry(title)]));

  for (const achievement of achievements) {
    if (!achievement.unlocked) continue;
    const definition = ACHIEVEMENT_BY_KEY.get(achievement.key);
    if (!definition?.grantsTitleKey || titlesByKey.has(definition.grantsTitleKey)) continue;
    titlesByKey.set(definition.grantsTitleKey, createTitleEntry(definition.grantsTitleKey, unlockedAt));
  }

  return Array.from(titlesByKey.values());
}

export function refreshTitleAchievementState(core: PlayerCoreState, unlockedAt = Date.now()): PlayerCoreState {
  const achievements = evaluateAchievements(core.statistics, core.achievements, unlockedAt);
  const titles = getUnlockedTitlesForAchievements(achievements, core.titles, unlockedAt);

  return {
    ...core,
    achievements,
    titles,
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toDisplayName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
