import { describe, expect, it } from 'vitest';
import {
  evaluateAchievements,
  getAllAchievementDefinitions,
  getAllTitleDefinitions,
  getUnlockedTitlesForAchievements,
  migratePlayerStateToCore,
} from '../core/playerCore/index.ts';
import { deserializePlayerCore } from '../modules/save/playerCoreSaveMigration.ts';
import type { PlayerState } from '../types/game.ts';
import type { PlayerStatistics } from '../types/playerCore.ts';

function makeStatistics(overrides: Partial<PlayerStatistics> = {}): PlayerStatistics {
  return {
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
    ...overrides,
  };
}

function makeLegacyPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player-title-achievement-1',
    name: 'Achievement Summoner',
    gender: 'unknown',
    appearance: {},
    affinity: { primary: 'fire' },
    level: 1,
    experience: 0n,
    money: 1200,
    archetype: 'summoner',
    skillPoints: 0,
    skillsUnlocked: {},
    unspent_passive_points: 0,
    unlocked_node_ids: ['root_hub'],
    energy: { current: 100, max: 100, lastUpdate: '2026-07-04T00:00:00.000Z' },
    nerve: { current: 15, max: 15, lastUpdate: '2026-07-04T00:00:00.000Z' },
    happy: { current: 100, max: 100, lastUpdate: '2026-07-04T00:00:00.000Z' },
    life: { current: 100, max: 100, lastUpdate: '2026-07-04T00:00:00.000Z' },
    strength: 10,
    vitality: 10,
    intelligence: 10,
    dexterity: 10,
    wisdom: 10,
    luck: 10,
    defense: 10,
    speed: 10,
    currentWorldId: 1,
    tileX: 10,
    tileY: 10,
    dayCount: 1,
    gameTimeMinutes: 420,
    creatures: [],
    inventory: [],
    activeQuests: [],
    completedQuests: [],
    discoveredTiles: new Set<string>(),
    territorialHostilities: {},
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.5,
      showLogTimestamps: true,
    },
    ...overrides,
  };
}

describe('player titles and achievements', () => {
  it('defines the documented title and achievement categories', () => {
    const titleCategories = new Set(getAllTitleDefinitions().map((title) => title.category));
    const achievementCategories = new Set(getAllAchievementDefinitions().map((achievement) => achievement.category));

    expect(Array.from(titleCategories)).toEqual([
      'exploration',
      'creature_collection',
      'crafting',
      'economy',
      'housing',
      'dungeons',
      'pvp',
      'guilds',
      'world_completion',
      'rare_events',
    ]);
    expect(achievementCategories).toEqual(titleCategories);
  });

  it('evaluates statistic-backed achievement progress deterministically', () => {
    const achievements = evaluateAchievements(
      makeStatistics({
        creaturesContracted: 1,
        dungeonsCleared: 1,
        pvpWins: 1,
        worldsUnlocked: 100,
      }),
      [],
      1000
    );

    expect(achievements.find((achievement) => achievement.key === 'contracted_companion')).toMatchObject({
      category: 'creature_collection',
      unlocked: true,
      progress: 1,
      target: 1,
      unlockedAt: 1000,
    });
    expect(achievements.find((achievement) => achievement.key === 'first_clear')?.unlocked).toBe(true);
    expect(achievements.find((achievement) => achievement.key === 'arena_victor')?.unlocked).toBe(true);
    expect(achievements.find((achievement) => achievement.key === 'hundred_world_gate')?.unlocked).toBe(true);
  });

  it('grants titles from unlocked achievements without duplicating existing titles', () => {
    const achievements = evaluateAchievements(
      makeStatistics({ creaturesContracted: 1, dungeonsCleared: 1 }),
      [],
      1000
    );
    const titles = getUnlockedTitlesForAchievements(
      achievements,
      [{ key: 'trailfinder', name: 'Trailfinder', category: 'exploration', unlockedAt: 500 }],
      1000
    );

    expect(titles.filter((title) => title.key === 'trailfinder')).toHaveLength(1);
    expect(titles.find((title) => title.key === 'beast_keeper')?.category).toBe('creature_collection');
    expect(titles.find((title) => title.key === 'tower_delver')?.category).toBe('dungeons');
  });

  it('migrates legacy player statistics into achievements and titles', () => {
    const core = migratePlayerStateToCore(makeLegacyPlayer({
      currentWorldId: 3,
      creatures: [
        {
          id: 'creature-achievement-1',
          templateKey: 'fire_spirit',
          level: 1,
          experience: 0n,
          currentHealth: 10,
          currentMana: 5,
          maxHealth: 10,
          maxMana: 5,
          attack: 3,
          defense: 2,
          speed: 4,
          skills: [],
          traits: [],
          mutations: [],
          affection: 0,
        },
      ],
      completedQuests: ['quest-1'],
    }));

    expect(core.achievements.find((achievement) => achievement.key === 'first_steps')?.unlocked).toBe(true);
    expect(core.achievements.find((achievement) => achievement.key === 'contracted_companion')?.unlocked).toBe(true);
    expect(core.achievements.find((achievement) => achievement.key === 'quest_known')?.unlocked).toBe(true);
    expect(core.titles.map((title) => title.key)).toEqual(expect.arrayContaining(['trailfinder', 'beast_keeper']));
  });

  it('adds missing categories when deserializing older player-core title payloads', () => {
    const restored = deserializePlayerCore({
      identity: { name: 'Old Title Core' },
      statistics: {
        worldsUnlocked: 1,
        creaturesContracted: 1,
        dungeonsCleared: 1,
      },
      titles: [{ key: 'beast_keeper', name: 'Beast Keeper', unlockedAt: 10 }],
      achievements: [
        { key: 'contracted_companion', name: 'Contracted Companion', description: 'Old', unlocked: true },
        { key: 'custom_solstice', name: 'Custom Solstice', description: 'Legacy rare event', unlocked: true },
      ],
    });

    expect(restored.titles.find((title) => title.key === 'beast_keeper')?.category).toBe('creature_collection');
    expect(restored.achievements.find((achievement) => achievement.key === 'contracted_companion')?.category).toBe('creature_collection');
    expect(restored.achievements.find((achievement) => achievement.key === 'custom_solstice')?.category).toBe('rare_events');
    expect(restored.titles.map((title) => title.key)).toEqual(expect.arrayContaining(['trailfinder', 'tower_delver']));
  });
});
