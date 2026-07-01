import { describe, it, expect } from 'vitest';
import { computeBossWeaknesses, computeBossResistances, getGuessDamageMultiplier } from '../stores/game/modules/combatModule';
import type { CombatState, Element } from '../types/game';

describe('computeBossWeaknesses', () => {
  it('returns water as weakness for fire boss', () => {
    const weaknesses = computeBossWeaknesses(['fire']);
    expect(weaknesses).toContain('water');
  });

  it('returns unexpected elements when boss has no mapped weaknesses', () => {
    const weaknesses = computeBossWeaknesses(['omni']);
    expect(Array.isArray(weaknesses)).toBe(true);
  });

  it('returns empty for unlisted element', () => {
    const weaknesses = computeBossWeaknesses(['unknown' as Element]);
    expect(weaknesses).toEqual([]);
  });

  it('returns unique weaknesses for multi-element boss', () => {
    const weaknesses = computeBossWeaknesses(['fire', 'water']);
    expect(weaknesses).toContain('water');
    expect(weaknesses).toContain('nature');
    expect(new Set(weaknesses).size).toBe(weaknesses.length);
  });
});

describe('computeBossResistances', () => {
  it('returns water as resistance for water boss', () => {
    const resistances = computeBossResistances(['water']);
    expect(resistances).toContain('water');
  });

  it('returns empty for unlisted element', () => {
    const resistances = computeBossResistances(['unknown' as Element]);
    expect(resistances).toEqual([]);
  });

  it('returns unique resistances for multi-element boss', () => {
    const resistances = computeBossResistances(['fire', 'water']);
    expect(new Set(resistances).size).toBe(resistances.length);
  });
});

describe('getGuessDamageMultiplier', () => {
  it('returns 1 when no scanResult exists', () => {
    expect(getGuessDamageMultiplier(undefined)).toBe(1);
  });

  it('returns 1.3 for correct guess', () => {
    const scanResult = { weaknesses: ['water'], resistances: [], guessedElement: 'water', guessCorrect: true, scannedAtTurn: 1 } as CombatState['scanResult'];
    expect(getGuessDamageMultiplier(scanResult)).toBe(1.3);
  });

  it('returns 0.3 for wrong guess with remaining penalty turns', () => {
    const scanResult = { weaknesses: ['water'], resistances: [], guessedElement: 'fire', guessCorrect: false, scannedAtTurn: 1, penaltyTurnsRemaining: 3 } as CombatState['scanResult'];
    expect(getGuessDamageMultiplier(scanResult)).toBe(0.3);
  });

  it('returns 1 when wrong guess penalty has expired', () => {
    const scanResult = { weaknesses: ['water'], resistances: [], guessedElement: 'fire', guessCorrect: false, scannedAtTurn: 1, penaltyTurnsRemaining: 0 } as CombatState['scanResult'];
    expect(getGuessDamageMultiplier(scanResult)).toBe(1);
  });

  it('returns 1 when guess not yet made', () => {
    const scanResult = { weaknesses: ['water'], resistances: [], scannedAtTurn: 1 } as CombatState['scanResult'];
    expect(getGuessDamageMultiplier(scanResult)).toBe(1);
  });
});
