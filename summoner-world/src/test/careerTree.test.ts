import { describe, it, expect } from 'vitest';
import { canUnlockNode, getAllNodes, getAggregateStats, respecAllNodes, getCareerModifiers } from '../data/careerTree/index';
import type { PlayerState } from '../types/game';

describe('canUnlockNode', () => {
  const treeData = getAllNodes();

it('Rule A: returns false when unspent_passive_points is 0', () => {
     const player: PlayerState = {
       id: 'test',
       name: 'Test Player',
       gender: 'male',
       appearance: {},
       affinity: { primary: 'fire' },
       level: 1,
       experience: 0n,
       money: 100,
       skillPoints: 0,
       skillsUnlocked: {},
       unspent_passive_points: 0,
       unlocked_node_ids: ['root_hub'],
       energy: { current: 100, max: 100, lastUpdate: '' },
       nerve: { current: 100, max: 100, lastUpdate: '' },
       happy: { current: 100, max: 100, lastUpdate: '' },
       life: { current: 100, max: 100, lastUpdate: '' },
       strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
       tileX: 0,
       tileY: 0,
       dayCount: 1,
       gameTimeMinutes: 0,
       creatures: [],
       inventory: [],
       activeQuests: [],
       completedQuests: [],
       discoveredTiles: new Set(['0,0']),
       settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
     };

     expect(canUnlockNode(player, 'blacksmith_minor_1', treeData)).toBe(false);
   });

  it('Rule B: returns false when node is already unlocked', () => {
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 1,
      unlocked_node_ids: ['root_hub', 'blacksmith_minor_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    expect(canUnlockNode(player, 'blacksmith_minor_1', treeData)).toBe(false);
  });

  it('Rule C: returns false when no connected node is unlocked', () => {
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 1,
      unlocked_node_ids: ['root_hub'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    expect(canUnlockNode(player, 'blacksmith_notable_1', treeData)).toBe(false);
  });

  it('returns true when all rules pass (has points, not unlocked, connected node unlocked)', () => {
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 1,
      unlocked_node_ids: ['root_hub'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    expect(canUnlockNode(player, 'blacksmith_minor_1', treeData)).toBe(true);
  });

  it('returns false for non-existent node', () => {
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 1,
      unlocked_node_ids: ['root_hub'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    expect(canUnlockNode(player, 'nonexistent_node', treeData)).toBe(false);
  });
});

describe('getAggregateStats', () => {
  it('sums stats from all unlocked nodes correctly', () => {
    const treeData = getAllNodes();
    
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'blacksmith_minor_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const stats = getAggregateStats(player, treeData);
    expect(stats['crafting_speed_pct']).toBe(5);
  });
});

describe('respecAllNodes', () => {
  it('resets unlocked_node_ids to root_hub and refunds points', () => {
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'blacksmith_minor_1', 'blacksmith_notable_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const result = respecAllNodes(player);
    expect(result.unlocked_node_ids).toEqual(['root_hub']);
    expect(result.unspent_passive_points).toBe(2);
  });
});

describe('getCareerModifiers', () => {
  it('returns empty modifiers when no relevant stats are present', () => {
    const stats: Record<string, number> = {};
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.tree_speed_pct).toBeUndefined();
    expect(modifiers.caravan_speed_pct).toBeUndefined();
    expect(modifiers.store_traffic_pct).toBeUndefined();
    expect(modifiers.crafting_speed_pct).toBeUndefined();
    expect(modifiers.yield_bonus_pct).toBeUndefined();
  });

  it('maps exploration_speed_pct to tree_speed_pct', () => {
    const stats: Record<string, number> = { exploration_speed_pct: 10 };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.tree_speed_pct).toBe(10);
  });

  it('maps caravan_speed_pct to caravan_speed_pct', () => {
    const stats: Record<string, number> = { caravan_speed_pct: 15 };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.caravan_speed_pct).toBe(15);
  });

  it('maps store_traffic_pct to store_traffic_pct', () => {
    const stats: Record<string, number> = { store_traffic_pct: 5 };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.store_traffic_pct).toBe(5);
  });

  it('maps crafting_speed_pct to crafting_speed_pct', () => {
    const stats: Record<string, number> = { crafting_speed_pct: 20 };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.crafting_speed_pct).toBe(20);
  });

  it('maps yield_bonus_pct to yield_bonus_pct', () => {
    const stats: Record<string, number> = { yield_bonus_pct: 8 };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.yield_bonus_pct).toBe(8);
  });

  it('maps multiple stats to their corresponding modifiers', () => {
    const stats: Record<string, number> = {
      exploration_speed_pct: 10,
      caravan_speed_pct: 15,
      store_traffic_pct: 5,
    };
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.tree_speed_pct).toBe(10);
    expect(modifiers.caravan_speed_pct).toBe(15);
    expect(modifiers.store_traffic_pct).toBe(5);
  });

  it('ignores non-mission-related stats', () => {
    const stats: Record<string, number> = {
      crafting_mastery: 1,
      tax_revenue_pct: 2,
      rare_item_sourcing_chance: 5,
    };
    const modifiers = getCareerModifiers(stats);
    expect(Object.keys(modifiers).length).toBe(0);
  });

  it('Explorer path contributes tree_speed_pct for explore missions', () => {
    const treeData = getAllNodes();
    
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: { blacksmith_minor_1: true },
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'explorer_minor_1', 'explorer_notable_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const stats = getAggregateStats(player, treeData);
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.tree_speed_pct).toBe(15);
  });

  it('Broker path contributes caravan_speed_pct for caravan missions', () => {
    const treeData = getAllNodes();
    
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'broker_minor_1', 'broker_notable_1', 'broker_keystone_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const stats = getAggregateStats(player, treeData);
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.caravan_speed_pct).toBe(15);
  });

  it('Shopkeeper path contributes store_traffic_pct for store visit missions', () => {
    const treeData = getAllNodes();
    
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'shopkeeper_minor_1', 'shopkeeper_notable_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const stats = getAggregateStats(player, treeData);
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.store_traffic_pct).toBe(5);
  });

  it('Blacksmith path contributes crafting_speed_pct for smelt/craft missions', () => {
    const treeData = getAllNodes();
    
    const player: PlayerState = {
      id: 'test',
      name: 'Test Player',
      gender: 'male',
      appearance: {},
      affinity: { primary: 'fire' },
      level: 1,
      experience: 0n,
      money: 100,
      skillPoints: 0,
      skillsUnlocked: {},
      unspent_passive_points: 0,
      unlocked_node_ids: ['root_hub', 'blacksmith_minor_1', 'blacksmith_notable_1'],
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 100, max: 100, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
strength: 10,
       vitality: 10,
       intelligence: 10,
       dexterity: 10,
       wisdom: 10,
       luck: 10,
       defense: 10,
       speed: 10,
       currentWorldId: 1,
      tileX: 0,
      tileY: 0,
      dayCount: 1,
      gameTimeMinutes: 0,
      creatures: [],
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      discoveredTiles: new Set(['0,0']),
      settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
    };

    const stats = getAggregateStats(player, treeData);
    const modifiers = getCareerModifiers(stats);
    expect(modifiers.crafting_speed_pct).toBe(15);
  });
});