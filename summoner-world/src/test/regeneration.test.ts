import { describe, it, expect } from 'vitest';
import type { PlayerState } from '../types/game';
import { applyResourceRegeneration } from '../stores/game/helpers';

const basePlayer: PlayerState = {
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
   energy: { current: 50, max: 100, lastUpdate: '' },
   nerve: { current: 10, max: 15, lastUpdate: '' },
   happy: { current: 50, max: 100, lastUpdate: '' },
   life: { current: 50, max: 100, lastUpdate: '' },
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
   discoveredTiles: new Set(),
   settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: false },
 };

describe('applyResourceRegeneration', () => {
  it('returns unchanged player if no valid lastUpdate', () => {
    const player: PlayerState = { ...basePlayer };
    const result = applyResourceRegeneration(player, Date.now());
    expect(result).toStrictEqual(player);
  });

  it('returns unchanged player if elapsed time is less than 1 minute', () => {
    const now = Date.now();
    const thirtySecondsAgo = now - 30 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 50, max: 100, lastUpdate: new Date(thirtySecondsAgo).toISOString() },
    };
    const result = applyResourceRegeneration(player, now);
    expect(result).toStrictEqual(player);
  });

  it('regenerates resources based on elapsed time', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 90, max: 100, lastUpdate: new Date(fiveMinutesAgo).toISOString() },
      nerve: { current: 12, max: 15, lastUpdate: new Date(fiveMinutesAgo).toISOString() },
      happy: { current: 90, max: 100, lastUpdate: new Date(fiveMinutesAgo).toISOString() },
      life: { current: 95, max: 100, lastUpdate: new Date(fiveMinutesAgo).toISOString() },
    };

    const result = applyResourceRegeneration(player, now);

    expect(result.energy.current).toBe(95);
    expect(result.nerve.current).toBe(13);
    expect(result.happy.current).toBe(92);
    expect(result.life.current).toBe(96);
  });

  it('caps resources at max', () => {
    const now = Date.now();
    const fiftyMinutesAgo = now - 50 * 60 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 99, max: 100, lastUpdate: new Date(fiftyMinutesAgo).toISOString() },
      nerve: { current: 14, max: 15, lastUpdate: new Date(fiftyMinutesAgo).toISOString() },
      happy: { current: 99, max: 100, lastUpdate: new Date(fiftyMinutesAgo).toISOString() },
      life: { current: 99, max: 100, lastUpdate: new Date(fiftyMinutesAgo).toISOString() },
    };

    const result = applyResourceRegeneration(player, now);

    expect(result.energy.current).toBe(100);
    expect(result.nerve.current).toBe(15);
    expect(result.happy.current).toBe(100);
    expect(result.life.current).toBe(100);
  });

  it('updates lastUpdate timestamp to now', () => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 50, max: 100, lastUpdate: new Date(tenMinutesAgo).toISOString() },
      nerve: { current: 10, max: 15, lastUpdate: new Date(tenMinutesAgo).toISOString() },
      happy: { current: 50, max: 100, lastUpdate: new Date(tenMinutesAgo).toISOString() },
      life: { current: 50, max: 100, lastUpdate: new Date(tenMinutesAgo).toISOString() },
    };

    const result = applyResourceRegeneration(player, now);
    expect(result.energy.lastUpdate).toBe(new Date(now).toISOString());
    expect(result.nerve.lastUpdate).toBe(new Date(now).toISOString());
    expect(result.happy.lastUpdate).toBe(new Date(now).toISOString());
    expect(result.life.lastUpdate).toBe(new Date(now).toISOString());
  });

  it('handles mixed empty and valid lastUpdate', () => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 50, max: 100, lastUpdate: '' },
      nerve: { current: 10, max: 15, lastUpdate: new Date(tenMinutesAgo).toISOString() },
      happy: { current: 50, max: 100, lastUpdate: '' },
      life: { current: 50, max: 100, lastUpdate: '' },
    };

    const result = applyResourceRegeneration(player, now);
    expect(result.nerve.current).toBe(13);
    expect(result.energy.current).toBe(50);
    expect(result.happy.current).toBe(50);
    expect(result.life.current).toBe(50);
  });

  it('does not decrease resources if reference time is in the future', () => {
    const now = Date.now();
    const futureTime = now + 60 * 60 * 1000;
    const player: PlayerState = {
      ...basePlayer,
      energy: { current: 50, max: 100, lastUpdate: new Date(futureTime).toISOString() },
    };

    const result = applyResourceRegeneration(player, now);
    expect(result.energy.current).toBe(50);
  });
});
