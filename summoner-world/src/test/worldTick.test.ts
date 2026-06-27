import { describe, it, expect } from 'vitest';
import { calculateWorldTicks, MINUTES_PER_TURN, TURNS_PER_DAY } from '../core/worldTick';

describe('T3.11 - World Tick System', () => {
  describe('calculateWorldTicks', () => {
    it('should return unchanged values when elapsed time is less than one turn', () => {
      const now = Date.now();
      const result = calculateWorldTicks({
        currentRealTime: now + 1000,
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 360,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(0);
      expect(result.gameTimeMinutes).toBe(360);
      expect(result.dayCount).toBe(1);
    });

    it('should advance one turn after MINUTES_PER_TURN minutes elapsed', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + msPerTurn,
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 360,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(1);
      expect(result.gameTimeMinutes).toBe(360 + MINUTES_PER_TURN);
    });

    it('should advance multiple turns based on elapsed time', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * 10),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 0,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(10);
    });

    it('should increment day count after 1440 minutes (10 turns * 144 turns)', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const turnsPerDay = 1440 / MINUTES_PER_TURN;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * turnsPerDay * 2),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 0,
        dayCount: 1,
      });

      expect(result.dayCount).toBe(3);
    });

    it('should wrap gameTimeMinutes to 0-1439 range', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * 10),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 1435,
        dayCount: 1,
      });

      expect(result.gameTimeMinutes).toBe(1435 + 10 * MINUTES_PER_TURN - 1440);
    });
  });

  describe('Constants', () => {
    it('should define MINUTES_PER_TURN as 6 minutes', () => {
      expect(MINUTES_PER_TURN).toBe(6);
    });

    it('should define TURNS_PER_DAY as 240 turns', () => {
      expect(TURNS_PER_DAY).toBe(240);
    });
  });
});