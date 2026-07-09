import type { NPCActivity, NPCScheduleEntry } from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';

export type NPCSchedule = NPCScheduleEntry[];

export function getNPCActivityLabel(activity: NPCActivity): string {
  return activity;
}

type ScheduleVariant = { activities: NPCActivity[] };

const ROLE_SCHEDULE_VARIANTS: Record<string, ScheduleVariant[]> = {
  merchant: [
    {
      activities: ['sleep', 'market', 'work', 'market', 'work', 'travel', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'travel', 'sleep'],
    },
    {
      activities: ['sleep', 'work', 'market', 'work', 'market', 'work', 'travel', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'market', 'work', 'travel', 'sleep', 'sleep'],
    },
  ],
  quest_giver: [
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'travel', 'tavern', 'market', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'sleep'],
    },
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'travel', 'work', 'work', 'work', 'work', 'market', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'sleep'],
    },
  ],
  healer: [
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'work', 'work', 'market', 'work', 'sleep'],
    },
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'market', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'sleep'],
    },
  ],
  elder: [
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'sleep'],
    },
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'sleep'],
    },
  ],
  trainer: [
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'travel', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'travel', 'sleep'],
    },
    {
      activities: ['sleep', 'work', 'work', 'work', 'work', 'work', 'travel', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'tavern', 'work', 'work', 'work', 'work', 'travel', 'sleep', 'sleep'],
    },
  ],
};

export function buildDefaultSchedule(role: string, seed: number | string): NPCSchedule {
  const rng = new SeededRandom(seed);
  const variants = (ROLE_SCHEDULE_VARIANTS[role] ?? ROLE_SCHEDULE_VARIANTS['quest_giver'])!;
  const selectedVariant = variants[rng.int(0, variants.length - 1)]!;
  const schedule: NPCSchedule = [];
  for (let hour = 0; hour < 24; hour++) {
    schedule.push({
      hour,
      activity: selectedVariant.activities[hour]!,
    });
  }
  return schedule;
}

export function getCurrentActivity(schedule: NPCSchedule, gameTimeMinutes: number): NPCActivity {
  const hour = Math.floor((gameTimeMinutes % 1440) / 60) % 24;
  const entry = schedule.find((s) => s.hour === hour);
  return entry?.activity ?? 'work';
}

export function isNPCActiveForInteraction(schedule: NPCSchedule, gameTimeMinutes: number): boolean {
  const activity = getCurrentActivity(schedule, gameTimeMinutes);
  return activity !== 'sleep';
}
