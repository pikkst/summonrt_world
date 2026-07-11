import { describe, it, expect } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import {
  CREATURE_SLOT_TYPES,
  BASE_SLOT_COUNTS,
  createDefaultCreatureSlots,
  createEmptyCreatureSlots,
  getSlotGroup,
  getAvailableSlots,
  isSlotFull,
  getTotalMaxSlots,
  getUsedSlotCount,
  assignCreatureToSlot,
  removeCreatureFromSlot,
  moveCreatureBetweenSlots,
  getAssignedCreatures,
  expandSlots,
  expandAllSlots,
  calculateSlotExpansionFromLevel,
  calculateSlotExpansionFromEquipment,
  calculateSlotExpansionFromHousing,
  getFullSlotExpansion,
} from '../core/playerCore/creatureSlotCore';

function createMockPlayerCore(housing: PlayerCoreState['housing']): PlayerCoreState {
  return {
    identity: { id: 'player-1', name: 'Test', gender: 'unknown', appearance: {} },
    summonerProfile: { class: 'elementalist', archetype: 'summoner', startingWorldId: 1 },
    level: 1,
    experience: 0n,
    elements: { primary: 'fire' },
    class: 'elementalist',
    primaryStats: {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    },
    secondaryStats: {
      maxHealth: 100,
      maxMana: 100,
      maxStamina: 100,
      movement: 100,
      criticalChance: 5,
      elementalMastery: 0,
      contractCapacity: 3,
      commandSpeed: 100,
      creatureBondPower: 100,
      inventoryCapacity: 50,
      craftingEfficiency: 100,
      tradeInfluence: 100,
      reputationGain: 100,
      summoningCost: 100,
      travelUtility: 100,
    },
    inventory: [],
    equipment: [],
    skills: [],
    talents: [],
    titles: [],
    achievements: [],
    statistics: {
      worldsUnlocked: 1,
      creaturesContracted: 0,
      dungeonsCleared: 0,
      itemsCrafted: 0,
      tradesCompleted: 0,
      goldEarned: 0,
      bossesDefeated: 0,
      pvpWins: 0,
      housingValue: 0,
      guildContributions: 0,
      questsCompleted: 0,
    },
  reputation: { world_rep: {}, faction_rep: {}, settlement_rep: {}, creature_rep: {} },
  discoveredRumors: [],
  questHistory: { active: [], completed: [] },
    creatureContracts: [],
    creatureSlots: createDefaultCreatureSlots(),
    housing,
    worldUnlocks: { unlockedWorlds: [1], activeWorldId: 1 },
    fastTravel: { points: [], discoveredPointIds: new Set(), activeTravel: undefined },
    saveMetadata: { lastSavedAt: '', playtimeSeconds: 0, saveVersion: '2.0.0' },
    resources: {
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 15, max: 15, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
    },
    position: { worldId: 1, x: 10, y: 10 },
    settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
    money: 1000,
    skillPoints: 0,
    dayCount: 1,
    gameTimeMinutes: 420,
  };
}

describe('creatureSlotCore', () => {
  describe('createDefaultCreatureSlots', () => {
    it('creates all 6 slot types', () => {
      const slots = createDefaultCreatureSlots();
      expect(slots.groups).toHaveLength(6);
      expect(slots.groups.map((g: { type: string }) => g.type)).toEqual(CREATURE_SLOT_TYPES);
    });

    it('assigns correct base counts from BASE_SLOT_COUNTS', () => {
      const slots = createDefaultCreatureSlots();
      for (const group of slots.groups) {
        expect(group.max).toBe(BASE_SLOT_COUNTS[group.type]);
        expect(group.assigned).toEqual([]);
      }
    });

    it('starts with no assigned creatures', () => {
      const slots = createDefaultCreatureSlots();
      for (const group of slots.groups) {
        expect(group.assigned).toHaveLength(0);
      }
    });
  });

  describe('createEmptyCreatureSlots', () => {
    it('uses base counts when no overrides provided', () => {
      const slots = createEmptyCreatureSlots();
      expect(slots.groups).toHaveLength(6);
      for (const group of slots.groups) {
        expect(group.max).toBe(BASE_SLOT_COUNTS[group.type]);
      }
    });

    it('applies overrides for specified types', () => {
      const slots = createEmptyCreatureSlots({
        active_combat: 5,
        reserve: 10,
      });
      expect(getSlotGroup(slots, 'active_combat')!.max).toBe(5);
      expect(getSlotGroup(slots, 'reserve')!.max).toBe(10);
      expect(getSlotGroup(slots, 'utility')!.max).toBe(BASE_SLOT_COUNTS.utility);
    });
  });

  describe('getSlotGroup', () => {
    it('returns the matching group', () => {
      const slots = createDefaultCreatureSlots();
      const group = getSlotGroup(slots, 'active_combat');
      expect(group).toBeDefined();
      expect(group!.type).toBe('active_combat');
      expect(group!.max).toBe(BASE_SLOT_COUNTS.active_combat);
    });

    it('returns undefined for unknown type', () => {
      const slots = createDefaultCreatureSlots();
      expect(getSlotGroup(slots, 'unknown' as any)).toBeUndefined();
    });
  });

  describe('getAvailableSlots', () => {
    it('returns max when no creatures assigned', () => {
      const slots = createDefaultCreatureSlots();
      expect(getAvailableSlots(slots, 'active_combat')).toBe(3);
    });

    it('subtracts assigned creatures from max', () => {
      const { slots } = assignCreatureToSlot(createDefaultCreatureSlots(), 'active_combat', 'c1');
      expect(getAvailableSlots(slots, 'active_combat')).toBe(2);
    });

    it('returns 0 when full', () => {
      let slots = createDefaultCreatureSlots();
      let result;
      do {
        result = assignCreatureToSlot(slots, 'active_combat', `c${Date.now()}`);
        slots = result.slots;
      } while (result.assigned);

      expect(getAvailableSlots(slots, 'active_combat')).toBe(0);
    });
  });

  describe('isSlotFull', () => {
    it('returns false when slots are available', () => {
      expect(isSlotFull(createDefaultCreatureSlots(), 'active_combat')).toBe(false);
    });

    it('returns true when max assigned', () => {
      let slots = createDefaultCreatureSlots();
      let result;
      do {
        result = assignCreatureToSlot(slots, 'active_combat', `c${Date.now()}`);
        slots = result.slots;
      } while (result.assigned);

      expect(isSlotFull(slots, 'active_combat')).toBe(true);
    });
  });

  describe('getTotalMaxSlots', () => {
    it('sums max slots across all groups', () => {
      const slots = createDefaultCreatureSlots();
      const expected = Object.values(BASE_SLOT_COUNTS).reduce((a: number, b: number) => a + b, 0);
      expect(getTotalMaxSlots(slots)).toBe(expected);
    });
  });

  describe('getUsedSlotCount', () => {
    it('counts assigned creatures across all groups', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'c1').slots;
      slots = assignCreatureToSlot(slots, 'reserve', 'c2').slots;
      expect(getUsedSlotCount(slots)).toBe(2);
    });
  });

  describe('assignCreatureToSlot', () => {
    it('assigns creature when space is available', () => {
      const { slots, assigned } = assignCreatureToSlot(
        createDefaultCreatureSlots(),
        'active_combat',
        'creature-1'
      );
      expect(assigned).toBe(true);
      expect(getSlotGroup(slots, 'active_combat')!.assigned).toContain('creature-1');
    });

    it('rejects assignment when slot is full', () => {
      let slots = createDefaultCreatureSlots();
      let result;
      do {
        result = assignCreatureToSlot(slots, 'active_combat', `c${Date.now()}`);
        slots = result.slots;
      } while (result.assigned);

      const finalResult = assignCreatureToSlot(slots, 'active_combat', 'overflow');
      expect(finalResult.assigned).toBe(false);
    });

    it('does not mutate original slots', () => {
      const original = createDefaultCreatureSlots();
      assignCreatureToSlot(original, 'active_combat', 'creature-1');
      expect(getSlotGroup(original, 'active_combat')!.assigned).toHaveLength(0);
    });
  });

  describe('removeCreatureFromSlot', () => {
    it('removes assigned creature', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'creature-1').slots;
      const { slots: updated, removed } = removeCreatureFromSlot(
        slots,
        'active_combat',
        'creature-1'
      );
      expect(removed).toBe(true);
      expect(getSlotGroup(updated, 'active_combat')!.assigned).not.toContain('creature-1');
    });

    it('returns false when creature not in slot', () => {
      const { slots, removed } = removeCreatureFromSlot(
        createDefaultCreatureSlots(),
        'active_combat',
        'missing'
      );
      expect(removed).toBe(false);
      expect(slots).toEqual(createDefaultCreatureSlots());
    });
  });

  describe('moveCreatureBetweenSlots', () => {
    it('moves creature between valid slots', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'creature-1').slots;
      const { slots: updated, moved } = moveCreatureBetweenSlots(
        slots,
        'active_combat',
        'reserve',
        'creature-1'
      );
      expect(moved).toBe(true);
      expect(getSlotGroup(updated, 'active_combat')!.assigned).not.toContain('creature-1');
      expect(getSlotGroup(updated, 'reserve')!.assigned).toContain('creature-1');
    });

    it('rejects move when source does not have creature', () => {
      const { slots, moved } = moveCreatureBetweenSlots(
        createDefaultCreatureSlots(),
        'active_combat',
        'reserve',
        'missing'
      );
      expect(moved).toBe(false);
    });

    it('rejects move when target is full', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'creature-1').slots;

      let result;
      do {
        result = assignCreatureToSlot(slots, 'reserve', `c${Date.now()}`);
        slots = result.slots;
      } while (result.assigned);

      const finalResult = moveCreatureBetweenSlots(
        slots,
        'active_combat',
        'reserve',
        'creature-1'
      );
      expect(finalResult.moved).toBe(false);
    });

    it('does not mutate slots when fromType equals toType', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'creature-1').slots;
      const { slots: updated, moved } = moveCreatureBetweenSlots(
        slots,
        'active_combat',
        'active_combat',
        'creature-1'
      );
      expect(moved).toBe(false);
      expect(getSlotGroup(updated, 'active_combat')!.assigned).toContain('creature-1');
    });
  });

  describe('getAssignedCreatures', () => {
    it('returns copy of assigned creature IDs', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'c1').slots;
      slots = assignCreatureToSlot(slots, 'active_combat', 'c2').slots;

      const assigned = getAssignedCreatures(slots, 'active_combat');
      expect(assigned).toEqual(['c1', 'c2']);
    });

    it('does not mutate internal assigned array', () => {
      let slots = createDefaultCreatureSlots();
      slots = assignCreatureToSlot(slots, 'active_combat', 'c1').slots;
      const assigned = getAssignedCreatures(slots, 'active_combat');
      assigned.push('tampered');
      expect(getSlotGroup(slots, 'active_combat')!.assigned).toHaveLength(1);
    });
  });

  describe('expandSlots', () => {
    it('increases max for specified type', () => {
      const slots = expandSlots(createDefaultCreatureSlots(), 'active_combat', 2);
      expect(getSlotGroup(slots, 'active_combat')!.max).toBe(5);
    });

    it('does not mutate original', () => {
      const original = createDefaultCreatureSlots();
      expandSlots(original, 'active_combat', 2);
      expect(getSlotGroup(original, 'active_combat')!.max).toBe(3);
    });

    it('ignores zero or negative amounts', () => {
      const original = createDefaultCreatureSlots();
      const result = expandSlots(original, 'active_combat', -1);
      expect(result).toEqual(original);
    });
  });

  describe('expandAllSlots', () => {
    it('increases max for all types', () => {
      const slots = expandAllSlots(createDefaultCreatureSlots(), 1);
      for (const group of slots.groups) {
        expect(group.max).toBe(BASE_SLOT_COUNTS[group.type] + 1);
      }
    });
  });

  describe('calculateSlotExpansionFromLevel', () => {
    it('returns 0 for level 1', () => {
      expect(calculateSlotExpansionFromLevel(1, 'active_combat')).toBe(0);
    });

    it('caps active_combat expansion at 5', () => {
      expect(calculateSlotExpansionFromLevel(100, 'active_combat')).toBe(5);
    });

    it('scales reserve expansion slowly', () => {
      expect(calculateSlotExpansionFromLevel(5, 'reserve')).toBe(0);
      expect(calculateSlotExpansionFromLevel(6, 'reserve')).toBe(1);
    });
  });

  describe('calculateSlotExpansionFromEquipment', () => {
    it('returns zeroed record for undefined modifiers', () => {
      const result = calculateSlotExpansionFromEquipment(undefined);
      for (const type of CREATURE_SLOT_TYPES) {
        expect(result[type]).toBe(0);
      }
    });

    it('parses creature_slot_ prefix modifiers', () => {
      const result = calculateSlotExpansionFromEquipment({
        creature_slot_active_combat: 2,
        creature_slot_reserve: 1,
      });
      expect(result.active_combat).toBe(2);
      expect(result.reserve).toBe(1);
    });

    it('ignores modifiers without matching slot type', () => {
      const result = calculateSlotExpansionFromEquipment({
        creature_slot_invalid: 5,
      });
      for (const type of CREATURE_SLOT_TYPES) {
        expect(result[type]).toBe(0);
      }
    });
  });

  describe('calculateSlotExpansionFromHousing', () => {
    it('returns zeroed record for empty structures', () => {
      const player = createMockPlayerCore({ structures: [] });
      const result = calculateSlotExpansionFromHousing(player);
      for (const type of CREATURE_SLOT_TYPES) {
        expect(result[type]).toBe(0);
      }
    });

    it('scales housing slots with structure level', () => {
      const playerWithHouse = createMockPlayerCore({
        structures: [{ id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 1, builtAt: 0, ownerId: 'player-1' }],
      });
      expect(calculateSlotExpansionFromHousing(playerWithHouse).housing).toBe(1);

      const playerWithBigHouse = createMockPlayerCore({
        structures: [{ id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 3, builtAt: 0, ownerId: 'player-1' }],
      });
      expect(calculateSlotExpansionFromHousing(playerWithBigHouse).housing).toBe(3);
      expect(calculateSlotExpansionFromHousing(playerWithBigHouse).active_combat).toBe(1);
    });
  });

  describe('getFullSlotExpansion', () => {
    it('combines level, equipment, housing, and guild bonuses', () => {
      const player = createMockPlayerCore({
        structures: [{ id: 's1', type: 'house', worldId: 1, tileX: 10, tileY: 10, level: 2, builtAt: 0, ownerId: 'player-1' }],
      });
      const result = getFullSlotExpansion(20, { creature_slot_active_combat: 2 }, player, null);
      expect(result.active_combat).toBeGreaterThan(0);
    });

    it('returns zero expansion at level 1 with no bonuses', () => {
      const player = createMockPlayerCore({ structures: [] });
      const result = getFullSlotExpansion(1, undefined, player, null);
      for (const type of CREATURE_SLOT_TYPES) {
        expect(result[type]).toBe(0);
      }
    });
  });
});
