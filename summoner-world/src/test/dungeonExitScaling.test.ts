import { describe, it, expect } from 'vitest';
import { calculateMinViableLevel, applyMinViableLevelScaling } from '../stores/game/helpers';
import type { PlayerState, CreatureInstance } from '../types/game';

describe('calculateMinViableLevel', () => {
  it('returns level 1 for world 1', () => {
    expect(calculateMinViableLevel(1)).toBe(1);
  });

  it('scales level requirement with world progression', () => {
    expect(calculateMinViableLevel(1)).toBe(1);
    expect(calculateMinViableLevel(2)).toBe(3);
    expect(calculateMinViableLevel(3)).toBe(5);
    expect(calculateMinViableLevel(10)).toBe(19);
  });

  it('returns at least 1 for invalid world indices', () => {
    expect(calculateMinViableLevel(0)).toBe(1);
    expect(calculateMinViableLevel(-5)).toBe(1);
  });

  it('calculates reasonable scaling for high worlds', () => {
    const level50 = calculateMinViableLevel(50);
    expect(level50).toBe(99);
  });
});

describe('applyMinViableLevelScaling', () => {
  const createTestPlayer = (level: number): PlayerState => ({
    id: 'test-player',
    name: 'Test Player',
    gender: 'unknown',
    appearance: {},
    affinity: { primary: 'fire' },
    level,
    experience: 0n,
    money: 1000,
    skillPoints: 0,
    skillsUnlocked: {},
    unspent_passive_points: 0,
    unlocked_node_ids: ['root_hub'],
    energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
    happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    strength: 10,
    defense: 10,
    speed: 10,
    dexterity: 10,
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
  });

  const createTestCreature = (level: number): CreatureInstance => ({
    id: 'test-creature',
    templateKey: 'test_template',
    level,
    experience: 0n,
    currentHealth: 50,
    currentMana: 20,
    maxHealth: 50,
    maxMana: 20,
    attack: 10,
    defense: 5,
    speed: 5,
    skills: [],
    traits: [],
    mutations: [],
    affection: 0,
  });

  it('does not scale player above minimum viable level', () => {
    const player = createTestPlayer(10);
    const { player: scaledPlayer, creatures: scaledCreatures } = applyMinViableLevelScaling(player, 2, []);
    
    expect(scaledPlayer.level).toBe(10);
    expect(scaledCreatures).toEqual([]);
  });

  it('scales player to minimum viable level when below threshold', () => {
    const player = createTestPlayer(1);
    const { player: scaledPlayer, creatures: scaledCreatures } = applyMinViableLevelScaling(player, 5, []);
    
    expect(scaledPlayer.level).toBe(9);
    expect(scaledPlayer.life.max).toBe(100 + (9 * 10));
    expect(scaledPlayer.energy.max).toBe(100 + (9 * 5));
  });

  it('scales player creatures stats on dungeon exit', () => {
    const creatures = [createTestCreature(1)];
    const player = createTestPlayer(1);
    const { player: scaledPlayer, creatures: scaledCreatures } = applyMinViableLevelScaling(player, 3, creatures);

    expect(scaledPlayer.level).toBe(5);
    const originalCreature = creatures[0];
    const scaledCreature = scaledCreatures[0];
    expect(scaledCreature).toBeDefined();
    expect(originalCreature).toBeDefined();
    if (scaledCreature && originalCreature) {
      expect(scaledCreature.maxHealth).toBeGreaterThan(originalCreature.maxHealth);
      expect(scaledCreature.attack).toBeGreaterThan(originalCreature.attack);
    }
  });

  it('preserves existing player stats not affected by scaling', () => {
    const player = createTestPlayer(1);
    player.money = 5000;
    player.strength = 15;
    player.defense = 12;
    
    const { player: scaledPlayer } = applyMinViableLevelScaling(player, 2, []);
    
    expect(scaledPlayer.money).toBe(5000);
    expect(scaledPlayer.strength).toBe(15);
    expect(scaledPlayer.defense).toBe(12);
  });

  it('restores player health and energy to max on scaling', () => {
    const player = createTestPlayer(1);
    player.life.current = 20;
    player.energy.current = 30;
    
    const { player: scaledPlayer } = applyMinViableLevelScaling(player, 3, []);
    
    expect(scaledPlayer.life.current).toBe(scaledPlayer.life.max);
    expect(scaledPlayer.energy.current).toBe(scaledPlayer.energy.max);
  });

  it('scales correctly for World 1', () => {
    const player = createTestPlayer(1);
    const { player: scaledPlayer } = applyMinViableLevelScaling(player, 1, []);
    
    expect(scaledPlayer.level).toBe(1);
  });

  it('scales correctly for World 50', () => {
    const player = createTestPlayer(40);
    const { player: scaledPlayer } = applyMinViableLevelScaling(player, 50, []);
    
    expect(scaledPlayer.level).toBe(99);
  });
});
