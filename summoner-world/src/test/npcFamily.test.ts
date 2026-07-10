import { describe, it, expect } from 'vitest';
import {
  checkMarriageEligibility,
  createMarriageRecord,
  applyMarriage,
  createChildNPC,
  getHeirIds,
  processInheritance,
  MARRIAGE_ROMANCE_THRESHOLD,
  NPC_MAX_CHILDREN,
} from '../core/npc/npcFamily';
import { createDefaultRelationship } from '../core/npc/relationship';
import type { NPC } from '../types/game';

function createTestNPC(overrides: Partial<NPC> = {}): NPC {
  return {
    id: 'npc_a',
    name: 'Test NPC',
    role: 'quest_giver',
    dialogue: ['Hi'],
    schedule: [],
    currentActivity: 'work',
    relationships: {},
    wealth: 100,
    ...overrides,
  };
}

describe('NPC family and marriage', () => {
  describe('checkMarriageEligibility', () => {
    it('returns eligible when both NPCs have sufficient romance', () => {
      const npcA = createTestNPC({
        relationships: {
          npc_b: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        name: 'Partner',
        relationships: {
          npc_a: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
      });

      const result = checkMarriageEligibility(npcA, npcB);
      expect(result.eligible).toBe(true);
    });

    it('returns not eligible when one NPC is already married', () => {
      const npcA = createTestNPC({
        spouseId: 'other',
        relationships: {
          npc_b: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        relationships: {
          npc_a: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
      });

      const result = checkMarriageEligibility(npcA, npcB);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('already_married');
    });

    it('returns not eligible when romance is below threshold', () => {
      const npcA = createTestNPC({
        relationships: {
          npc_b: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD - 1 },
        },
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        relationships: {
          npc_a: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD - 1 },
        },
      });

      const result = checkMarriageEligibility(npcA, npcB);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('low_romance');
    });

    it('returns not eligible when no relationship exists', () => {
      const npcA = createTestNPC();
      const npcB = createTestNPC({ id: 'npc_b' });

      const result = checkMarriageEligibility(npcA, npcB);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('no_relationship');
    });
  });

  describe('applyMarriage', () => {
    it('creates a marriage and updates both NPCs', () => {
      const npcA = createTestNPC({
        relationships: {
          npc_b: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
        wealth: 100,
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        name: 'Partner',
        relationships: {
          npc_a: { friendship: 20, rivalry: 0, romance: MARRIAGE_ROMANCE_THRESHOLD },
        },
        wealth: 200,
      });

      const { marriage, updatedA, updatedB } = applyMarriage({
        npcA,
        npcB,
        seed: 'marriage-seed',
      });

      expect(marriage.partnerAId).toBe(npcA.id);
      expect(marriage.partnerBId).toBe(npcB.id);
      expect(updatedA.spouseId).toBe(npcB.id);
      expect(updatedB.spouseId).toBe(npcA.id);
      expect(updatedA.familyName).toBe(updatedB.familyName);
      expect(updatedA.wealth).toBe(150);
      expect(updatedB.wealth).toBe(150);
    });

    it('throws when marriage is not eligible', () => {
      const npcA = createTestNPC();
      const npcB = createTestNPC({ id: 'npc_b' });

      expect(() =>
        applyMarriage({
          npcA,
          npcB,
          seed: 'marriage-seed',
        })
      ).toThrow('Cannot marry: no_relationship');
    });
  });

  describe('createChildNPC', () => {
    it('creates a child and returns both parents with childIds updated', () => {
      const npcA = createTestNPC({
        familyName: 'Greenwood',
        relationships: {},
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        name: 'Partner B',
        familyName: 'Greenwood',
        relationships: {},
      });

      const { child, updatedA, updatedB } = createChildNPC({
        npcA,
        npcB,
        seed: 'child-seed',
      });

      expect(child.parentIds).toContain(npcA.id);
      expect(child.parentIds).toContain(npcB.id);
      expect(child.wealth).toBe(0);
      expect(child.familyName).toBe('Greenwood');
      expect(child.id).toBeDefined();
      expect(child.name).toContain('Greenwood');
      expect(updatedA.childIds).toEqual([child.id]);
      expect(updatedB.childIds).toEqual([child.id]);
      expect(updatedA.id).toBe(npcA.id);
      expect(updatedB.id).toBe(npcB.id);
    });

    it('never returns duplicate child references for the same parents', () => {
      const npcA = createTestNPC({
        familyName: 'Greenwood',
        childIds: [],
        relationships: {},
      });
      const npcB = createTestNPC({
        id: 'npc_b',
        name: 'Partner B',
        familyName: 'Greenwood',
        childIds: [],
        relationships: {},
      });

      const first = createChildNPC({ npcA, npcB, seed: 'child-seed' });
      const second = createChildNPC({ npcA: first.updatedA, npcB: first.updatedB, seed: 'child-seed-2' });

      expect(first.updatedA.childIds).toHaveLength(1);
      expect(first.updatedB.childIds).toHaveLength(1);
      expect(second.updatedA.childIds).toHaveLength(2);
      expect(second.updatedB.childIds).toHaveLength(2);
    });
  });

  describe('getHeirIds', () => {
    it('returns spouse and children', () => {
      const npc = createTestNPC({
        spouseId: 'spouse_1',
        childIds: ['child_1', 'child_2'],
      });

      const heirs = getHeirIds(npc);
      expect(heirs).toEqual(['spouse_1', 'child_1', 'child_2']);
    });

    it('returns only children when no spouse', () => {
      const npc = createTestNPC({
        childIds: ['child_1'],
      });

      const heirs = getHeirIds(npc);
      expect(heirs).toEqual(['child_1']);
    });
  });

  describe('processInheritance', () => {
    it('distributes wealth equally among heirs', () => {
      const deceased = createTestNPC({
        id: 'deceased',
        wealth: 100,
        childIds: ['child_1', 'child_2'],
      });

      const resolveNPC = (id: string) => {
        if (id === 'child_1') return createTestNPC({ id: 'child_1', wealth: 0, childIds: [] });
        if (id === 'child_2') return createTestNPC({ id: 'child_2', wealth: 0, childIds: [] });
        return undefined;
      };

      const { events, updatedNPCs } = processInheritance(deceased, resolveNPC);

      expect(events).toHaveLength(2);
      expect(events[0]!.sharePerHeir).toBe(50);
      expect(events[1]!.sharePerHeir).toBe(50);
      expect(updatedNPCs).toHaveLength(2);
      expect(updatedNPCs[0]!.wealth).toBe(50);
      expect(updatedNPCs[1]!.wealth).toBe(50);
    });

    it('returns empty when no heirs or no wealth', () => {
      const deceased = createTestNPC({
        id: 'deceased',
        wealth: 0,
      });

      const { events, updatedNPCs } = processInheritance(deceased, () => undefined);
      expect(events).toHaveLength(0);
      expect(updatedNPCs).toHaveLength(0);
    });

    it('includes spouse in inheritance', () => {
      const deceased = createTestNPC({
        id: 'deceased',
        wealth: 100,
        spouseId: 'spouse_1',
        childIds: ['child_1'],
      });

      const resolveNPC = (id: string) => {
        if (id === 'spouse_1') return createTestNPC({ id: 'spouse_1', wealth: 0, childIds: [] });
        if (id === 'child_1') return createTestNPC({ id: 'child_1', wealth: 0, childIds: [] });
        return undefined;
      };

      const { events } = processInheritance(deceased, resolveNPC);
      expect(events).toHaveLength(2);
      expect(events[0]!.heirs[0]!.npcId).toBe('spouse_1');
      expect(events[1]!.heirs[0]!.npcId).toBe('child_1');
      expect(events[0]!.sharePerHeir).toBe(50);
      expect(events[1]!.sharePerHeir).toBe(50);
    });
  });
});
