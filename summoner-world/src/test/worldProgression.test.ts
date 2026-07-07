import { describe, it, expect } from 'vitest';
import {
  WORLD_COUNT,
  WORLD_TIER_SIZE,
  DEMONLORD_WORLD_ID,
  getWorldTier,
  getWorldTierRule,
  getAllWorldTierRules,
  isStartingWorld,
  isDemonlordWorld,
  getNextWorldId,
  getWorldUnlockRequirements,
  getUnmetWorldUnlockRequirements,
  canUnlockWorld,
  buildWorldProgressionMap,
  getWorldCompletionCriteria,
  evaluateWorldCompletion,
  isWorldComplete,
  unlockWorld,
  applyWorldBossCompletion,
} from '../core/worldProgression';
import { createDefaultPlayerCoreState } from '../core/playerCore/factory';
import type { PlayerCoreState } from '../types/playerCore';

function makeCore(unlockedWorlds: number[] = [1]): PlayerCoreState {
  const core = createDefaultPlayerCoreState('Progression Tester', { startingWorldId: 1 });
  return {
    ...core,
    worldUnlocks: { unlockedWorlds, activeWorldId: unlockedWorlds[unlockedWorlds.length - 1] ?? 1 },
  };
}

describe('World 100 progression map – tiers', () => {
  it('defines exactly 100 worlds', () => {
    expect(WORLD_COUNT).toBe(100);
    expect(buildWorldProgressionMap()).toHaveLength(100);
  });

  it('groups worlds into tiers of 10', () => {
    expect(WORLD_TIER_SIZE).toBe(10);
    expect(getWorldTier(1)).toBe(1);
    expect(getWorldTier(10)).toBe(1);
    expect(getWorldTier(11)).toBe(2);
    expect(getWorldTier(100)).toBe(10);
  });

  it('exposes one rule per tier', () => {
    const rules = getAllWorldTierRules();
    expect(rules).toHaveLength(10);
    expect(rules[0]!.firstWorld).toBe(1);
    expect(rules[0]!.lastWorld).toBe(10);
    expect(rules[9]!.firstWorld).toBe(91);
    expect(rules[9]!.lastWorld).toBe(100);
  });

  it('tier rule is stable for any world in the tier', () => {
    expect(getWorldTierRule(5)).toEqual(getWorldTierRule(9));
    expect(getWorldTierRule(100).description).toContain('Demonlord');
  });

  it('marks world 100 as the Demonlord world', () => {
    expect(DEMONLORD_WORLD_ID).toBe(100);
    expect(isDemonlordWorld(100)).toBe(true);
    expect(isDemonlordWorld(99)).toBe(false);
  });
});

describe('World 100 progression map – unlock rules per tier (T7.15.1)', () => {
  it('world 1 is the starting world and has no requirements', () => {
    expect(isStartingWorld(1)).toBe(true);
    expect(getWorldUnlockRequirements(1)).toEqual([]);
  });

  it('every non-starting world requires the previous world boss', () => {
    for (let worldId = 2; worldId <= WORLD_COUNT; worldId++) {
      const requirements = getWorldUnlockRequirements(worldId);
      expect(requirements).toHaveLength(1);
      expect(requirements[0]!.type).toBe('previous_world_boss');
    }
  });

  it('cannot unlock a world without defeating the previous boss', () => {
    expect(canUnlockWorld(2, { previousWorldBossDefeated: false, playerLevel: 50, hasDemonlordTitle: false })).toBe(false);
    expect(canUnlockWorld(2, { previousWorldBossDefeated: true, playerLevel: 50, hasDemonlordTitle: false })).toBe(true);
  });

  it('lists unmet requirements for a locked world', () => {
    const unmet = getUnmetWorldUnlockRequirements(5, {
      previousWorldBossDefeated: false,
      playerLevel: 1,
      hasDemonlordTitle: false,
    });
    expect(unmet.map((r) => r.type)).toEqual(['previous_world_boss']);
  });

  it('returns null for next world after the final world', () => {
    expect(getNextWorldId(100)).toBeNull();
    expect(getNextWorldId(99)).toBe(100);
  });
});

describe('World completion criteria (T7.15.2)', () => {
  it('completion criterion is defeating the World Boss', () => {
    const criteria = getWorldCompletionCriteria(42);
    expect(criteria[0]!.type).toBe('world_boss');
  });

  it('a world is complete only when its boss is defeated', () => {
    expect(evaluateWorldCompletion({ worldBossDefeated: true })).toBe(true);
    expect(evaluateWorldCompletion({ worldBossDefeated: false })).toBe(false);
    expect(isWorldComplete(7, true)).toBe(true);
    expect(isWorldComplete(7, false)).toBe(false);
  });
});

describe('Completion connected to PlayerCoreState world unlocks (T7.15.3)', () => {
  it('unlockWorld adds the world immutably and updates statistics', () => {
    const core = makeCore([1]);
    const updated = unlockWorld(core, 2);

    expect(updated).not.toBe(core);
    expect(updated.worldUnlocks.unlockedWorlds).toEqual([1, 2]);
    expect(core.worldUnlocks.unlockedWorlds).toEqual([1]);
    expect(updated.statistics.worldsUnlocked).toBe(2);
  });

  it('records a truthful worldsUnlocked count even when unlocked non-sequentially', () => {
    const core = makeCore([1, 2]);
    const updated = unlockWorld(core, 50);
    expect(updated.worldUnlocks.unlockedWorlds).toEqual([1, 2, 50]);
    expect(updated.statistics.worldsUnlocked).toBe(3);
  });

  it('unlockWorld is idempotent for already-unlocked worlds', () => {
    const core = makeCore([1, 2]);
    const updated = unlockWorld(core, 2);
    expect(updated).toBe(core);
  });

  it('applyWorldBossCompletion unlocks the next world after a boss defeat', () => {
    const core = makeCore([1, 2, 3]);
    const updated = applyWorldBossCompletion(core, 3);

    expect(updated.worldUnlocks.unlockedWorlds).toEqual([1, 2, 3, 4]);
    expect(updated.statistics.worldsUnlocked).toBe(4);
  });

  it('completing the final world does not unlock a world beyond 100', () => {
    const core = makeCore(Array.from({ length: 100 }, (_, i) => i + 1));
    const updated = applyWorldBossCompletion(core, 100);
    expect(updated).toBe(core);
    expect(updated.worldUnlocks.unlockedWorlds).not.toContain(101);
  });
});
