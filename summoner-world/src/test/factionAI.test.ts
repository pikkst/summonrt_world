import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  FACTION_POWER_MAX,
  FACTION_POWER_MIN,
  FACTION_POWER_NEUTRAL,
  getAllFactionPowers,
  getFactionObject,
  getFactionPower,
  getFactionTone,
  getNPCMerchantPriceModifier,
  getNPCQuestAvailabilityBonus,
  getNPCToneTowardFaction,
  initializeFactionPower,
  shiftFactionPower,
} from '../core/faction/factionAI';
import { FACTIONS } from '../data/factions';
import { worldEventBus } from '../core/worldEventBus';

describe('faction AI', () => {
  beforeEach(() => {
    initializeFactionPower();
  });

  it('initializes faction power from defaults', () => {
    const powers = getAllFactionPowers();
    for (const faction of Object.values(FACTIONS)) {
      expect(powers[faction.id]).toBe(faction.defaultPower);
    }
  });

  it('shifts faction power within bounds', () => {
    const merchantPower = shiftFactionPower('merchant_guild', 60, 'test');
    expect(merchantPower).toBe(FACTION_POWER_MAX);
    expect(getFactionPower('merchant_guild')).toBe(FACTION_POWER_MAX);

    const voidPower = shiftFactionPower('void_cult', -80, 'test');
    expect(voidPower).toBe(FACTION_POWER_MIN);
  });

  it('returns immutable copies from getAllFactionPowers', () => {
    const powers = getAllFactionPowers();
    powers.merchant_guild = 0;
    expect(getFactionPower('merchant_guild')).toBe(FACTION_POWER_NEUTRAL);
  });

  it('getFactionObject returns faction metadata', () => {
    const merchant = getFactionObject('merchant_guild');
    expect(merchant?.name).toBe('Merchant Guild');
    expect(merchant?.alignment).toBe('order');
  });

  it('getFactionTone returns higher value for same alignment', () => {
    expect(getFactionTone('merchant_guild', 'iron_league')).toBeGreaterThanOrEqual(0);
  });

  it('getNPCToneTowardFaction reflects loyalty for aligned faction', () => {
    const aligned = { factionId: 'merchant_guild', loyalty: 50 };
    expect(getNPCToneTowardFaction(aligned, 'merchant_guild')).toBeGreaterThan(0);
  });

  it('getNPCToneTowardFaction returns 0 for undefined alignment', () => {
    expect(getNPCToneTowardFaction(undefined, 'merchant_guild')).toBe(0);
  });

  it('getNPCMerchantPriceModifier stays within safe bounds', () => {
    const modifier = getNPCMerchantPriceModifier({ factionId: 'merchant_guild', loyalty: 50 }, 'merchant_guild');
    expect(modifier).toBeGreaterThanOrEqual(0.75);
    expect(modifier).toBeLessThanOrEqual(1.25);
  });

  it('getNPCQuestAvailabilityBonus stays within safe bounds', () => {
    const bonus = getNPCQuestAvailabilityBonus({ factionId: 'merchant_guild', loyalty: 50 }, 'merchant_guild');
    expect(bonus).toBeGreaterThanOrEqual(-0.3);
    expect(bonus).toBeLessThanOrEqual(0.3);
  });

  it('publishes FactionStandingChanged event on power shift', () => {
    const handler = vi.fn();
    const unsubscribe = worldEventBus.subscribe('FactionStandingChanged', handler);
    try {
      shiftFactionPower('circle_of_nature', 10, 'quest:starter_explore');
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0]![0];
      expect(event.type).toBe('FactionStandingChanged');
      expect(event.factionId).toBe('circle_of_nature');
      expect(event.newPower).toBeGreaterThan(FACTION_POWER_NEUTRAL);
    } finally {
      unsubscribe();
    }
  });
});
