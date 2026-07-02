import { describe, it, expect } from 'vitest';
import type { Element } from '../types/game';
import { ELEMENT_IDENTITY, STARTER_ELEMENTS, QUEST_ONLY_ELEMENTS, getWorld100Element } from '../data/playerElements';
import {
  getElementIdentity,
  isStarterElement,
  isQuestOnlyElement,
  getElementModifiers,
  getElementSkillDamagePct,
  getElementCreatureAffinityPct,
  getElementContractStabilityPct,
  getElementEquipmentScalingPct,
  getElementCraftingSuccessPct,
  getElementDungeonRewardPct,
  getElementNPCReactionPct,
  getElementWorldTravelSpeedPct,
  getElementPVPIdentityModifier,
} from '../data/playerElements';
import {
  getElementCombatBonuses,
  getElementAffinityBonuses,
  getElementCraftingBonuses,
  applyElementSkillDamageBoost,
  applyElementAffinityBoost,
  applyElementContractStabilityBoost,
  applyElementCraftingBoost,
  canObtainElement,
  getElementCategory,
} from '../core/playerCore/elementIdentity';

describe('playerElements', () => {
  describe('ELEMENT_IDENTITY', () => {
it('has all 10 starter elements defined', () => {
       expect(Object.keys(ELEMENT_IDENTITY)).toHaveLength(14);
       STARTER_ELEMENTS.forEach((el: any) => {
         const identity = ELEMENT_IDENTITY[el as Element];
         expect(identity).toBeDefined();
         expect(identity!.category).toBe('starter');
       });
     });

     it('has all 3 quest-only elements defined', () => {
       QUEST_ONLY_ELEMENTS.forEach((el: any) => {
         const identity = ELEMENT_IDENTITY[el as Element];
         expect(identity).toBeDefined();
         expect(identity!.category).toBe('quest');
       });
     });

     it('has world 100 element defined', () => {
       const omni = getWorld100Element();
       const identity = ELEMENT_IDENTITY[omni];
       expect(identity).toBeDefined();
       expect(identity!.category).toBe('endgame');
     });
  });

  describe('getElementIdentity', () => {
    it('returns correct identity for valid elements', () => {
      const fireIdentity = getElementIdentity('fire');
      expect(fireIdentity?.name).toBe('Pyre');
      expect(fireIdentity?.element).toBe('fire');
    });

it('returns undefined for unknown element', () => {
       expect(getElementIdentity('unknown' as any)).toBeUndefined();
     });
  });

  describe('isStarterElement', () => {
    it('returns true for starter elements', () => {
      expect(isStarterElement('fire')).toBe(true);
      expect(isStarterElement('water')).toBe(true);
      expect(isStarterElement('light')).toBe(true);
    });

    it('returns false for quest-only elements', () => {
      expect(isStarterElement('void')).toBe(false);
      expect(isStarterElement('starlight')).toBe(false);
    });
  });

  describe('isQuestOnlyElement', () => {
    it('returns true for quest-only elements', () => {
      expect(isQuestOnlyElement('void')).toBe(true);
      expect(isQuestOnlyElement('starlight')).toBe(true);
      expect(isQuestOnlyElement('chaos')).toBe(true);
    });

    it('returns false for starter elements', () => {
      expect(isQuestOnlyElement('fire')).toBe(false);
      expect(isQuestOnlyElement('water')).toBe(false);
    });
  });

  describe('getElementModifiers', () => {
    it('returns modifiers for all elements', () => {
      const fireMods = getElementModifiers('fire');
      expect(fireMods).toBeDefined();
      expect(fireMods?.skillDamagePct).toBeGreaterThan(0);
      expect(fireMods?.creatureAffinityPct).toBeGreaterThan(0);
      expect(fireMods?.contractStabilityPct).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Individual modifier getters', () => {
    it('returns skill damage pct for element', () => {
      expect(getElementSkillDamagePct('fire')).toBe(10);
      expect(getElementSkillDamagePct('darkness')).toBe(20);
      expect(getElementSkillDamagePct('omni')).toBe(50);
    });

    it('returns creature affinity pct for element', () => {
      expect(getElementCreatureAffinityPct('water')).toBe(20);
      expect(getElementCreatureAffinityPct('nature')).toBe(20);
    });

    it('returns contract stability pct for element', () => {
      expect(getElementContractStabilityPct('light')).toBe(20);
      expect(getElementContractStabilityPct('darkness')).toBe(8);
    });

    it('returns equipment scaling pct for element', () => {
      expect(getElementEquipmentScalingPct('iron')).toBe(20);
      expect(getElementEquipmentScalingPct('fire')).toBe(8);
    });

    it('returns crafting success pct for element', () => {
      expect(getElementCraftingSuccessPct('earth')).toBe(15);
      expect(getElementCraftingSuccessPct('iron')).toBe(20);
    });

    it('returns dungeon reward pct for element', () => {
      expect(getElementDungeonRewardPct('darkness')).toBe(15);
      expect(getElementDungeonRewardPct('omni')).toBe(30);
    });

    it('returns NPC reaction pct for element', () => {
      expect(getElementNPCReactionPct('light')).toBe(20);
      expect(getElementNPCReactionPct('darkness')).toBe(-10);
    });

    it('returns world travel speed pct for element', () => {
      expect(getElementWorldTravelSpeedPct('air')).toBe(15);
      expect(getElementWorldTravelSpeedPct('earth')).toBe(-5);
    });

    it('returns PvP identity modifier for element', () => {
      expect(getElementPVPIdentityModifier('omni')).toBe(2);
      expect(getElementPVPIdentityModifier('fire')).toBe(1);
    });

it('returns zero for undefined element', () => {
       expect(getElementSkillDamagePct(undefined as any)).toBe(0);
       expect(getElementCreatureAffinityPct(undefined as any)).toBe(0);
     });
  });

  describe('getElementCombatBonuses', () => {
    it('returns combat bonuses for element', () => {
      const fireBonuses = getElementCombatBonuses('fire');
      expect(fireBonuses.skillDamagePct).toBe(10);
      expect(fireBonuses.elementDamageMultiplier).toBe(1.1);
    });
  });

  describe('getElementAffinityBonuses', () => {
    it('returns affinity bonuses for element', () => {
      const waterBonuses = getElementAffinityBonuses('water');
      expect(waterBonuses.affinityPct).toBe(20);
      expect(waterBonuses.contractStabilityPct).toBe(10);
    });
  });

  describe('applyElementSkillDamageBoost', () => {
    it('boosts damage for element', () => {
      expect(applyElementSkillDamageBoost(100, 'fire')).toBe(110);
      expect(applyElementSkillDamageBoost(50, 'none' as any)).toBe(50);
    });
  });

  describe('applyElementAffinityBoost', () => {
    it('boosts affinity chance', () => {
      expect(applyElementAffinityBoost(0.5, 'water')).toBeGreaterThan(0.5);
      expect(applyElementAffinityBoost(0.3, undefined)).toBe(0.3);
    });
  });

  describe('applyElementContractStabilityBoost', () => {
    it('boosts contract stability', () => {
      expect(applyElementContractStabilityBoost(80, 'light')).toBe(100);
      expect(applyElementContractStabilityBoost(90, undefined)).toBe(90);
    });
  });

  describe('applyElementCraftingBoost', () => {
    it('boosts crafting success', () => {
      expect(applyElementCraftingBoost(0.5, 'iron')).toBeGreaterThan(0.5);
      expect(applyElementCraftingBoost(0.5, undefined)).toBe(0.5);
    });
  });

describe('canObtainElement', () => {
     it('rejects elements when no player data', () => {
       const result = canObtainElement('fire', null as any);
       expect(result.allowed).toBe(false);
       expect(result.reason).toBe('No player data');
     });

     it('allows starter elements when player has the element', () => {
       const player = { affinity: { primary: 'fire' } } as any;
       const result = canObtainElement('fire', player);
       expect(result.allowed).toBe(true);
     });

     it('handles endgame elements via getElementCategory', () => {
       const player = { affinity: { primary: 'omni' } } as any;
       const result = canObtainElement('omni', player);
       expect(result.allowed).toBe(true);
       expect(result.reason).toBe('Endgame elements must be unlocked through endgame content');
     });
   });

  describe('getElementCategory', () => {
    it('returns correct category for each element type', () => {
      expect(getElementCategory('fire')).toBe('starter');
      expect(getElementCategory('void')).toBe('quest');
      expect(getElementCategory('omni')).toBe('endgame');
    });
  });
});