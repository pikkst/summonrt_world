import { describe, expect, it } from 'vitest';
import {
  getAllPlayerSkillCategories,
  getAllTalentTreeCategories,
  inferSkillCategory,
  inferTalentCategory,
  migratePlayerStateToCore,
} from '../core/playerCore/index.ts';
import { deserializePlayerCore } from '../modules/save/playerCoreSaveMigration.ts';
import type { PlayerState } from '../types/game.ts';

function makeLegacyPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player-skill-category-1',
    name: 'Category Summoner',
    gender: 'unknown',
    appearance: {},
    affinity: { primary: 'fire' },
    level: 1,
    experience: 0n,
    money: 1000,
    archetype: 'summoner',
    skillPoints: 2,
    skillsUnlocked: {
      fire_mastery: true,
      guard_stance: true,
      wild_whisper: true,
      caravan_math: false,
    },
    unspent_passive_points: 1,
    unlocked_node_ids: ['root_hub', 'blacksmith_minor_1', 'explorer_minor_1', 'summoner_minor_1'],
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

describe('player skill and talent categories', () => {
  it('defines the documented player skill categories', () => {
    const categories = getAllPlayerSkillCategories().map((category) => category.id);

    expect(categories).toEqual([
      'direct_combat',
      'summoner_commands',
      'elemental',
      'crafting',
      'travel',
      'social',
      'economy',
      'housing',
      'pvp',
    ]);
  });

  it('defines the documented long-term talent tree categories', () => {
    const categories = getAllTalentTreeCategories().map((category) => category.id);

    expect(categories).toEqual([
      'summoning',
      'elemental_mastery',
      'creature_bonding',
      'combat',
      'survival',
      'crafting',
      'trading',
      'housing',
      'exploration',
      'pvp',
      'guild_leadership',
    ]);
  });

  it('infers categories for legacy skill keys and career tree node IDs', () => {
    expect(inferSkillCategory('fire_mastery')).toBe('elemental');
    expect(inferSkillCategory('wild_whisper')).toBe('summoner_commands');
    expect(inferSkillCategory('forge_timing')).toBe('crafting');
    expect(inferSkillCategory('caravan_math')).toBe('economy');
    expect(inferSkillCategory('guard_stance')).toBe('direct_combat');

    expect(inferTalentCategory('blacksmith_minor_1', 'Blacksmith')).toBe('crafting');
    expect(inferTalentCategory('explorer_minor_1', 'Explorer')).toBe('exploration');
    expect(inferTalentCategory('summoner_minor_1', 'Summoner')).toBe('summoning');
    expect(inferTalentCategory('root_hub', 'General')).toBe('survival');
  });

  it('migrates legacy player skills and talents with categories', () => {
    const core = migratePlayerStateToCore(makeLegacyPlayer());

    expect(core.skills.find((skill) => skill.key === 'fire_mastery')?.category).toBe('elemental');
    expect(core.skills.find((skill) => skill.key === 'guard_stance')?.category).toBe('direct_combat');
    expect(core.skills.find((skill) => skill.key === 'wild_whisper')?.category).toBe('summoner_commands');
    expect(core.skills.find((skill) => skill.key === 'caravan_math')?.category).toBe('economy');

    expect(core.talents.find((talent) => talent.nodeId === 'root_hub')?.category).toBe('survival');
    expect(core.talents.find((talent) => talent.nodeId === 'blacksmith_minor_1')?.category).toBe('crafting');
    expect(core.talents.find((talent) => talent.nodeId === 'explorer_minor_1')?.category).toBe('exploration');
    expect(core.talents.find((talent) => talent.nodeId === 'summoner_minor_1')?.category).toBe('summoning');
  });

  it('adds missing categories when deserializing older player-core payloads', () => {
    const restored = deserializePlayerCore({
      identity: { name: 'Old Core' },
      skills: [
        { key: 'fire_mastery', name: 'Fire Mastery', unlocked: true },
        { key: 'caravan_math', name: 'Caravan Math', unlocked: false },
      ],
      talents: [
        { nodeId: 'root_hub', unlocked: true },
        { nodeId: 'official_minor_1', unlocked: true },
      ],
    });

    expect(restored.skills.map((skill) => skill.category)).toEqual(['elemental', 'economy']);
    expect(restored.talents.map((talent) => talent.category)).toEqual(['survival', 'guild_leadership']);
  });
});
