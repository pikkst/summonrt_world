import { describe, expect, it } from 'vitest';
import {
  generateFactionQuest,
  generateExplorationQuest,
  generateCraftingQuest,
  generateStoryQuest,
  generateLegendaryQuest,
  generateNPCQuestBundle,
} from '../core/quest/questGeneration';
import {
  deriveWorldStateSnapshot,
  generateNPCNeeds,
  generateNPCNeedQuest,
  generateWorldStateQuest,
  generateWorldStateQuestBundle,
} from '../core/quest/worldStateQuest';
import type { GeneratedQuestContext } from '../core/quest/questGeneration';
import type { WorldData, WorldStateSnapshot } from '../types/game';

const baseContext: GeneratedQuestContext = {
  worldId: 5,
  playerLevel: 10,
  turnCount: 3,
  seed: 'npc_test_1',
};

const snapshotFixture: WorldStateSnapshot = {
  worldId: 5,
  tier: 5,
  worldElement: 'fire',
  availableMonsters: [
    { key: 'mon_5_0', name: 'Ember Wolf', elements: ['fire', 'nature'], creatureClass: 'rare', difficulty: 140 },
    { key: 'mon_5_1', name: 'Ash Bear', elements: ['fire', 'iron'], creatureClass: 'uncommon', difficulty: 110 },
  ],
  resources: [
    { resourceType: 'wood', available: 3, depleted: false },
    { resourceType: 'crystal', available: 0, depleted: true },
  ],
  missingResources: ['crystal'],
};

const worldFixture: WorldData = {
  id: 5,
  seed: 12345,
  name: 'Test World',
  tier: 5,
  bossDefeated: false,
  dungeonFloors: 8,
  tiles: new Map(),
  startTile: { x: 10, y: 10 },
  weather: {} as WorldData['weather'],
  settlements: [],
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

    it('adds world-state quests when a world snapshot is provided', () => {
      const quests = generateNPCQuestBundle('npc_1', undefined, 5, 10, 3, snapshotFixture);
      const tags = quests.flatMap((q) => q.tags ?? []);
      expect(tags.some((t) => t === 'world_state')).toBe(true);
    });

    it('does not add world-state quests when no snapshot is provided', () => {
      const quests = generateNPCQuestBundle('npc_1', undefined, 5, 10, 3);
      const tags = quests.flatMap((q) => q.tags ?? []);
      expect(tags.some((t) => t === 'world_state')).toBe(false);
    });
  });

  describe('deriveWorldStateSnapshot', () => {
    it('derives available monsters and missing resources deterministically', () => {
      const snap1 = deriveWorldStateSnapshot(worldFixture);
      const snap2 = deriveWorldStateSnapshot(worldFixture);
      expect(snap1.availableMonsters.length).toBeGreaterThan(0);
      expect(snap1.availableMonsters.map((m) => m.key)).toEqual(snap2.availableMonsters.map((m) => m.key));
      expect(snap1.worldElement).toBe('lightning');
    });

    it('flags resources with no available tiles as missing', () => {
      const snap = deriveWorldStateSnapshot(worldFixture);
      expect(snap.resources.every((r) => typeof r.available === 'number')).toBe(true);
      expect(snap.missingResources.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateNPCNeeds', () => {
    it('generates needs pulled from world state', () => {
      const needs = generateNPCNeeds('npc_1', snapshotFixture, 3);
      expect(needs.length).toBeGreaterThan(0);
      expect(['monster', 'resource']).toContain(needs[0]!.kind);
      expect(needs[0]!.quantity).toBeGreaterThan(0);
    });

    it('returns empty needs when world state is empty', () => {
      const empty: WorldStateSnapshot = {
        worldId: 1,
        tier: 1,
        worldElement: 'water',
        availableMonsters: [],
        resources: [],
        missingResources: [],
      };
      expect(generateNPCNeeds('npc_1', empty, 1)).toEqual([]);
    });
  });

  describe('generateWorldStateQuest', () => {
    it('creates a combat quest targeting an available monster', () => {
      const quest = generateWorldStateQuest(snapshotFixture, baseContext);
      expect(quest).not.toBeNull();
      expect(quest!.type).toBe('combat');
      expect(quest!.target).toBe('mon_5_0');
      expect(quest!.tags).toContain('world_state');
    });

    it('returns null when no monsters are available', () => {
      const empty: WorldStateSnapshot = { ...snapshotFixture, availableMonsters: [] };
      expect(generateWorldStateQuest(empty, baseContext)).toBeNull();
    });
  });

  describe('generateNPCNeedQuest', () => {
    it('creates a resource supply quest from an NPC need', () => {
      const needs = generateNPCNeeds('npc_1', snapshotFixture, 3).filter((n) => n.kind === 'resource');
      const quest = needs[0] ? generateNPCNeedQuest('npc_1', needs, baseContext, snapshotFixture) : null;
      if (needs[0]) {
        expect(quest).not.toBeNull();
        expect(quest!.type).toBe('gather');
        expect(quest!.target).toBe('crystal');
      } else {
        expect(quest).toBeNull();
      }
    });

    it('creates a monster bounty quest from an NPC need', () => {
      const needs = generateNPCNeeds('npc_1', snapshotFixture, 3).filter((n) => n.kind === 'monster');
      const quest = needs[0] ? generateNPCNeedQuest('npc_1', needs, baseContext, snapshotFixture) : null;
      if (needs[0]) {
        expect(quest).not.toBeNull();
        expect(quest!.type).toBe('combat');
        expect(quest!.target).toBe(needs[0]!.target);
      } else {
        expect(quest).toBeNull();
      }
    });
  });

  describe('generateWorldStateQuestBundle', () => {
    it('produces world-state and npc-need quests', () => {
      const quests = generateWorldStateQuestBundle('npc_1', snapshotFixture, baseContext);
      expect(quests.length).toBeGreaterThan(0);
      expect(quests.every((q) => q.tags?.includes('world_state'))).toBe(true);
    });

    it('is deterministic for identical inputs', () => {
      const q1 = generateWorldStateQuestBundle('npc_1', snapshotFixture, baseContext).map((q) => q.key);
      const q2 = generateWorldStateQuestBundle('npc_1', snapshotFixture, baseContext).map((q) => q.key);
      expect(q1).toEqual(q2);
    });
  });
});
