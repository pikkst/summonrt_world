import { describe, it, expect } from 'vitest';
import { createDefaultRelationship, clampRelationship, updateRelationship, getRelationshipTier } from '../core/npc/relationship';

describe('NPC relationships', () => {
  it('creates a default relationship at neutral', () => {
    expect(createDefaultRelationship()).toEqual({
      friendship: 0,
      rivalry: 0,
      romance: 0,
    });
  });

  it('clamps relationship values within bounds', () => {
    expect(clampRelationship(-200)).toBe(-100);
    expect(clampRelationship(200)).toBe(100);
    expect(clampRelationship(50)).toBe(50);
  });

  it('updates a single relationship axis', () => {
    const current = createDefaultRelationship();
    const next = updateRelationship(current, 'friendship', 25);
    expect(next.friendship).toBe(25);
    expect(next.rivalry).toBe(0);
    expect(next.romance).toBe(0);
  });

  it('does not mutate the original relationship', () => {
    const current = createDefaultRelationship();
    const next = updateRelationship(current, 'rivalry', -10);
    expect(current.rivalry).toBe(0);
    expect(next.rivalry).toBe(-10);
  });

  it('returns allied tier for high positive total', () => {
    expect(getRelationshipTier({ friendship: 50, rivalry: 0, romance: 20 })).toBe('allied');
  });

  it('returns friendly tier for moderate positive total', () => {
    expect(getRelationshipTier({ friendship: 20, rivalry: 0, romance: 10 })).toBe('friendly');
  });

  it('returns neutral tier for near-zero total', () => {
    expect(getRelationshipTier({ friendship: 5, rivalry: 0, romance: 0 })).toBe('neutral');
  });

  it('returns unfriendly tier for moderate negative total', () => {
    expect(getRelationshipTier({ friendship: 0, rivalry: 40, romance: 0 })).toBe('unfriendly');
  });

  it('returns hostile tier for high negative total', () => {
    expect(getRelationshipTier({ friendship: 0, rivalry: 60, romance: 0 })).toBe('hostile');
  });
});
