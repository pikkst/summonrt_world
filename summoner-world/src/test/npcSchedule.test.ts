import { describe, it, expect } from 'vitest';
import { buildDefaultSchedule, getCurrentActivity, isNPCActiveForInteraction } from '../core/npc/schedule';
import type { NPCActivity } from '../types/game';

describe('NPC schedule', () => {
  it('generates a deterministic 24-hour schedule for a given role and seed', () => {
    const scheduleA = buildDefaultSchedule('merchant', 'seed1');
    const scheduleB = buildDefaultSchedule('merchant', 'seed1');
    expect(scheduleA).toEqual(scheduleB);
    expect(scheduleA).toHaveLength(24);
  });

  it('produces different schedules for different roles with same seed', () => {
    const merchantSchedule = buildDefaultSchedule('merchant', 'same-seed');
    const elderSchedule = buildDefaultSchedule('elder', 'same-seed');
    expect(merchantSchedule).not.toEqual(elderSchedule);
  });

  it('returns only valid activities for every hour', () => {
    const schedule = buildDefaultSchedule('merchant', 'test');
    const validActivities: NPCActivity[] = ['sleep', 'work', 'travel', 'market', 'tavern'];
    schedule.forEach((entry) => {
      expect(validActivities).toContain(entry.activity);
    });
  });

  it('returns a valid activity for any game time', () => {
    const schedule = buildDefaultSchedule('merchant', 'test');
    const validActivities: NPCActivity[] = ['sleep', 'work', 'travel', 'market', 'tavern'];
    expect(validActivities).toContain(getCurrentActivity(schedule, 0));
    expect(validActivities).toContain(getCurrentActivity(schedule, 120));
    expect(validActivities).toContain(getCurrentActivity(schedule, 1320));
  });

  it('reports inactive when the NPC is sleeping', () => {
    const schedule = buildDefaultSchedule('merchant', 'test');
    expect(isNPCActiveForInteraction(schedule, 0)).toBe(false);
    expect(isNPCActiveForInteraction(schedule, 120)).toBe(true);
  });
});
