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
    const merchantPower = shiftFactionPower('merchant_guild', 60, 'test', 120, 5);
    expect(merchantPower).toBe(FACTION_POWER_MAX);
    expect(getFactionPower('merchant_guild')).toBe(FACTION_POWER_MAX);

    const voidPower = shiftFactionPower('void_cult', -80, 'test', 120, 5);
    expect(voidPower).toBe(FACTION_POWER_MIN);
  });

  it('returns current power for unknown faction without mutating state', () => {
    const before = getAllFactionPowers();
    const result = shiftFactionPower('unknown_faction', 50, 'test', 0, 0);
    expect(result).toBe(FACTION_POWER_NEUTRAL);
    expect(getAllFactionPowers()).toEqual(before);
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

  it('getFactionTone returns higher value for same faction', () => {
    expect(getFactionTone('merchant_guild', 'merchant_guild')).toBe(30);
  });

  it('getFactionTone returns lower value for opposing factions', () => {
    expect(getFactionTone('merchant_guild', 'iron_league')).toBeLessThan(0);
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
      shiftFactionPower('circle_of_nature', 10, 'quest:starter_explore', 360, 12);
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0]![0];
      expect(event.type).toBe('FactionStandingChanged');
      expect(event.factionId).toBe('circle_of_nature');
      expect(event.newPower).toBeGreaterThan(FACTION_POWER_NEUTRAL);
      expect(event.gameTimeMinutes).toBe(360);
      expect(event.turnCount).toBe(12);
    } finally {
      unsubscribe();
    }
  });
});
