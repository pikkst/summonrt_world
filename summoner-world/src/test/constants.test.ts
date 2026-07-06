import { describe, expect, it } from 'vitest';
import { FLOOR_SEEDS, getFloorSeed } from '../data/constants';

describe('T7.11 - 100 floor seed system', () => {
  it('exposes a deterministic seed for every floor 1-100', () => {
    for (let floor = 1; floor <= 100; floor++) {
      expect(FLOOR_SEEDS[floor]).toBeDefined();
      expect(typeof FLOOR_SEEDS[floor]).toBe('number');
    }
  });

  it('produces identical seeds on repeated module loads via getFloorSeed', () => {
    for (let floor = 1; floor <= 100; floor++) {
      expect(getFloorSeed(floor)).toBe(FLOOR_SEEDS[floor]);
    }
  });

  it('generates seeds within the expected 1000-999999 range', () => {
    for (let floor = 1; floor <= 100; floor++) {
      const seed = getFloorSeed(floor);
      expect(seed).toBeGreaterThanOrEqual(1000);
      expect(seed).toBeLessThanOrEqual(999999);
    }
  });

  it('falls back to deterministic formula for floors outside 1-100', () => {
    expect(getFloorSeed(0)).toBe(0 * 999 + 123456);
    expect(getFloorSeed(101)).toBe(101 * 999 + 123456);
    expect(getFloorSeed(999)).toBe(999 * 999 + 123456);
  });

  it('produces unique seeds across the 1-100 range', () => {
    const seeds = Object.values(FLOOR_SEEDS);
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBe(100);
  });
});
