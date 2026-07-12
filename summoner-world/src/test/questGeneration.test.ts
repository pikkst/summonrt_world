import { describe, expect, it } from 'vitest';
import {
  generateFactionQuest,
  generateExplorationQuest,
  generateCraftingQuest,
  generateStoryQuest,
  generateLegendaryQuest,
  generateNPCQuestBundle,
} from '../core/quest/questGeneration';
import type { GeneratedQuestContext } from '../core/quest/questGeneration';

const baseContext: GeneratedQuestContext = {
  worldId: 5,
  playerLevel: 10,
  turnCount: 3,
  seed: 'npc_test_1',
};

describe('questGeneration', () => {
  describe('generateFactionQuest', () => {
    it('returns null for unknown faction', () => {
      const quest = generateFactionQuest('unknown_faction', baseContext);
      expect(quest).toBeNull();
    });

    it('generates a valid faction quest for merchant_guild', () => {
      const quest = generateFactionQuest('merchant_guild', baseContext);
      expect(quest).not.toBeNull();
      expect(quest!.type).toBe('faction');
      expect(quest!.target).toBe('merchant_guild');
      expect(quest!.title).toContain('Merchant Guild');
      expect(quest!.rewards.money).toBeGreaterThan(0);
      expect(quest!.rewards.exp).toBeGreaterThan(0);
    });

    it('generates deterministic quests for same inputs', () => {
      const quest1 = generateFactionQuest('circle_of_nature', baseContext);
      const quest2 = generateFactionQuest('circle_of_nature', baseContext);
      expect(quest1!.key).toBe(quest2!.key);
      expect(quest1!.title).toBe(quest2!.title);
      expect(quest1!.amount).toBe(quest2!.amount);
    });
  });

  describe('generateExplorationQuest', () => {
    it('generates a valid exploration quest', () => {
      const quest = generateExplorationQuest(baseContext);
      expect(quest.type).toBe('explore');
      expect(quest.amount).toBeGreaterThan(0);
      expect(quest.rewards.money).toBeGreaterThan(0);
      expect(quest.rewards.exp).toBeGreaterThan(0);
    });

    it('generates deterministic quests for same inputs', () => {
      const quest1 = generateExplorationQuest(baseContext);
      const quest2 = generateExplorationQuest(baseContext);
      expect(quest1.key).toBe(quest2.key);
      expect(quest1.title).toBe(quest2.title);
      expect(quest1.amount).toBe(quest2.amount);
    });
  });

  describe('generateCraftingQuest', () => {
    it('returns a valid crafting quest when recipes are available', () => {
      const quest = generateCraftingQuest(baseContext);
      expect(quest).not.toBeNull();
      expect(quest!.type).toBe('crafting');
      expect(quest!.target).toBeDefined();
      expect(quest!.amount).toBeGreaterThan(0);
    });

    it('generates deterministic quests for same inputs', () => {
      const quest1 = generateCraftingQuest(baseContext);
      const quest2 = generateCraftingQuest(baseContext);
      expect(quest1!.key).toBe(quest2!.key);
      expect(quest1!.title).toBe(quest2!.title);
    });
  });

  describe('generateStoryQuest', () => {
    it('generates a valid story quest', () => {
      const quest = generateStoryQuest(baseContext);
      expect(['combat', 'summon', 'gather']).toContain(quest.type);
      expect(quest.amount).toBeGreaterThan(0);
      expect(quest.rewards.money).toBeGreaterThan(0);
      expect(quest.rewards.exp).toBeGreaterThan(0);
    });

    it('generates deterministic quests for same inputs', () => {
      const quest1 = generateStoryQuest(baseContext);
      const quest2 = generateStoryQuest(baseContext);
      expect(quest1.key).toBe(quest2.key);
      expect(quest1.title).toBe(quest2.title);
    });
  });

  describe('generateLegendaryQuest', () => {
    it('returns null for low player level', () => {
      const context: GeneratedQuestContext = {
        ...baseContext,
        playerLevel: 5,
      };
      const quest = generateLegendaryQuest(context);
      expect(quest).toBeNull();
    });

    it('generates a valid legendary quest for high level', () => {
      const context: GeneratedQuestContext = {
        ...baseContext,
        playerLevel: 25,
      };
      const quest = generateLegendaryQuest(context);
      expect(quest).not.toBeNull();
      expect(['combat', 'summon']).toContain(quest!.type);
      expect(quest!.rewards.money).toBeGreaterThan(0);
      expect(quest!.rewards.exp).toBeGreaterThan(0);
    });

    it('generates deterministic quests for same inputs', () => {
      const context: GeneratedQuestContext = {
        ...baseContext,
        playerLevel: 30,
      };
      const quest1 = generateLegendaryQuest(context);
      const quest2 = generateLegendaryQuest(context);
      expect(quest1!.key).toBe(quest2!.key);
      expect(quest1!.title).toBe(quest2!.title);
    });
  });

  describe('generateNPCQuestBundle', () => {
    it('returns at least exploration and crafting quests', () => {
      const quests = generateNPCQuestBundle('npc_1', undefined, 1, 1, 1);
      expect(quests.length).toBeGreaterThanOrEqual(2);
      const types = quests.map((q) => q.type);
      expect(types).toContain('explore');
    });

    it('includes faction quest when NPC has faction alignment', () => {
      const quests = generateNPCQuestBundle('npc_1', { factionId: 'merchant_guild', loyalty: 10 }, 1, 1, 1);
      const types = quests.map((q) => q.type);
      expect(types).toContain('faction');
    });

    it('includes story quest when loyalty is high', () => {
      const quests = generateNPCQuestBundle('npc_1', { factionId: 'merchant_guild', loyalty: 50 }, 1, 30, 1);
      const types = quests.map((q) => q.type);
      expect(types.some((t) => ['combat', 'summon', 'gather'].includes(t))).toBe(true);
    });

    it('includes legendary quest when loyalty and level are high', () => {
      const quests = generateNPCQuestBundle('npc_1', { factionId: 'merchant_guild', loyalty: 60 }, 1, 30, 1);
      const types = quests.map((q) => q.type);
      expect(types.some((t) => ['combat', 'summon'].includes(t))).toBe(true);
    });

    it('returns deterministic bundles for same inputs', () => {
      const quests1 = generateNPCQuestBundle('npc_1', { factionId: 'merchant_guild', loyalty: 40 }, 5, 15, 2);
      const quests2 = generateNPCQuestBundle('npc_1', { factionId: 'merchant_guild', loyalty: 40 }, 5, 15, 2);
      expect(quests1.map((q) => q.key)).toEqual(quests2.map((q) => q.key));
    });
  });
});
