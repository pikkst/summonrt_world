import { describe, expect, it } from 'vitest';
import {
  REPUTATION_MAX,
  REPUTATION_MIN,
  applyPlayerReputationChange,
  applyReputationChange,
  calculateReputationEffects,
  createDefaultPlayerCoreState,
  createDefaultReputationState,
  getReputationScore,
} from '../core/playerCore/index';

describe('Player Reputation foundation', () => {
  it('creates neutral reputation buckets for the active world', () => {
    const reputation = createDefaultReputationState(3);

    expect(reputation.world_rep[3]).toBe(0);
    expect(reputation.faction_rep).toEqual({});
    expect(reputation.settlement_rep).toEqual({});
    expect(reputation.creature_rep).toEqual({});
  });

  it('applies source-scaled reputation changes immutably', () => {
    const reputation = createDefaultReputationState(1);
    const updated = applyReputationChange(reputation, {
      domain: 'faction',
      targetId: 'merchant_guild',
      amount: 20,
      source: 'trading',
    });

    expect(updated).not.toBe(reputation);
    expect(getReputationScore(reputation, 'faction', 'merchant_guild')).toBe(0);
    expect(getReputationScore(updated, 'faction', 'merchant_guild')).toBe(15);
  });

  it('uses player reputationGain for player-level changes', () => {
    const player = createDefaultPlayerCoreState('Reputable');
    player.secondaryStats.reputationGain = 150;

    const updated = applyPlayerReputationChange(player, {
      domain: 'world',
      targetId: 1,
      amount: 10,
      source: 'quest',
    });

    expect(updated).not.toBe(player);
    expect(updated.reputation.world_rep[1]).toBe(15);
    expect(player.reputation.world_rep[1]).toBe(0);
  });

  it('clamps reputation to the supported range', () => {
    const high = applyReputationChange(createDefaultReputationState(1), {
      domain: 'world',
      targetId: 1,
      amount: 250,
      source: 'quest',
    });
    const low = applyReputationChange(high, {
      domain: 'world',
      targetId: 1,
      amount: -300,
      source: 'quest',
    });

    expect(high.world_rep[1]).toBe(REPUTATION_MAX);
    expect(low.world_rep[1]).toBe(REPUTATION_MIN);
  });

  it('derives gameplay effect modifiers from reputation scores', () => {
    const reputation = {
      world_rep: { 2: 80 },
      faction_rep: { merchant_guild: 60 },
      settlement_rep: { riverhold: 40 },
      creature_rep: { ember_fox: -30 },
    };

    const effects = calculateReputationEffects(reputation, {
      worldId: 2,
      factionId: 'merchant_guild',
      settlementId: 'riverhold',
      creatureId: 'ember_fox',
    });

    expect(effects.merchantPriceMultiplier).toBe(0.93);
    expect(effects.creatureCaptureChanceModifierPct).toBe(-4.5);
    expect(effects.settlementGrowthModifierPct).toBe(8);
    expect(effects.dungeonDifficultyModifierPct).toBe(-8);
    expect(effects.npcReactionModifierPct).toBe(12);
  });
});
