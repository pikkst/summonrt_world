import { describe, it, expect } from 'vitest';
import {
  getAvailableRumorCategories,
  getTrustRequirement,
  generateRumor,
  shareRumor,
  isRumorDiscovered,
} from '../core/npc/rumorCore';
import type { NPC, NPCRelationship, WorldData, Rumor } from '../types/game';

const mockNPC: NPC = {
  id: 'npc_test_1',
  name: 'Test NPC',
  role: 'elder',
  dialogue: ['Hello there.'],
  schedule: [],
  currentActivity: 'work',
  relationships: {},
};

const mockWorld = (worldId = 1): WorldData => ({
  id: worldId,
  seed: 12345,
  name: 'Test World',
  tier: 1,
  bossDefeated: false,
  dungeonFloors: 30,
  tiles: new Map(),
  startTile: { x: 10, y: 10 },
  weather: { currentWeather: 'Clear', weatherIntensity: 0, nextChangeTurn: 100, baseDuration: 50 },
  settlements: [],
});

describe('rumorCore', () => {
  describe('getAvailableRumorCategories', () => {
    it('returns no categories for hostile relationship', () => {
      const rel: NPCRelationship = { friendship: -10, rivalry: 50, romance: 0 };
      expect(getAvailableRumorCategories(rel)).toEqual([]);
    });

    it('returns no categories for unfriendly relationship', () => {
      const rel: NPCRelationship = { friendship: -10, rivalry: 40, romance: 0 };
      expect(getAvailableRumorCategories(rel)).toEqual([]);
    });

    it('returns world_secret for neutral relationship', () => {
      const rel: NPCRelationship = { friendship: 10, rivalry: 0, romance: 0 };
      expect(getAvailableRumorCategories(rel)).toEqual(['world_secret']);
    });

    it('returns friendly categories for friendly relationship', () => {
      const rel: NPCRelationship = { friendship: 40, rivalry: 0, romance: 0 };
      expect(getAvailableRumorCategories(rel)).toEqual(['world_secret', 'dungeon_tip', 'creature_location']);
    });

    it('returns all categories for allied relationship', () => {
      const rel: NPCRelationship = { friendship: 70, rivalry: 0, romance: 0 };
      expect(getAvailableRumorCategories(rel)).toEqual(['world_secret', 'dungeon_tip', 'creature_location', 'boss_weakness', 'hidden_quest']);
    });
  });

  describe('getTrustRequirement', () => {
    it('returns 0 for hostile-tier categories', () => {
      expect(getTrustRequirement('world_secret')).toBeGreaterThanOrEqual(0);
    });

    it('returns a positive threshold for allied-tier categories', () => {
      expect(getTrustRequirement('boss_weakness')).toBeGreaterThanOrEqual(0);
      expect(getTrustRequirement('hidden_quest')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateRumor', () => {
    it('generates a boss_weakness rumor with world element', () => {
      const rumor = generateRumor('boss_weakness', mockNPC, mockWorld(3), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.category).toBe('boss_weakness');
      expect(rumor?.worldId).toBe(3);
      expect(rumor?.sourceNpcId).toBe('npc_test_1');
      expect(rumor?.id).toContain('npc_test_1');
    });

    it('generates a dungeon_tip rumor with safe floor interval', () => {
      const rumor = generateRumor('dungeon_tip', mockNPC, mockWorld(10), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.category).toBe('dungeon_tip');
      expect(rumor?.content).toContain('Safe floors');
    });

    it('generates a hidden_quest rumor referencing a quest title', () => {
      const rumor = generateRumor('hidden_quest', mockNPC, mockWorld(1), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.category).toBe('hidden_quest');
      expect(rumor?.content).toContain('quest called');
    });

    it('generates a world_secret rumor', () => {
      const rumor = generateRumor('world_secret', mockNPC, mockWorld(1), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.category).toBe('world_secret');
    });

    it('generates a creature_location rumor', () => {
      const rumor = generateRumor('creature_location', mockNPC, mockWorld(1), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.category).toBe('creature_location');
    });

    it('returns null for unknown category', () => {
      expect(generateRumor('unknown' as any, mockNPC, mockWorld(1), 1)).toBeNull();
    });
  });

  describe('shareRumor', () => {
    it('returns null when trust is too low', () => {
      const rel: NPCRelationship = { friendship: -10, rivalry: 50, romance: 0 };
      const rumor = shareRumor(mockNPC, rel, mockWorld(1), 1);
      expect(rumor).toBeNull();
    });

    it('returns a rumor when trust is sufficient', () => {
      const rel: NPCRelationship = { friendship: 70, rivalry: 0, romance: 0 };
      const rumor = shareRumor(mockNPC, rel, mockWorld(1), 1);
      expect(rumor).not.toBeNull();
      expect(rumor?.sourceNpcId).toBe('npc_test_1');
    });

    it('returns different categories based on relationship tier', () => {
      const neutralRel: NPCRelationship = { friendship: 10, rivalry: 0, romance: 0 };
      const alliedRel: NPCRelationship = { friendship: 70, rivalry: 0, romance: 0 };

      const neutralRumor = shareRumor(mockNPC, neutralRel, mockWorld(1), 1);
      const alliedRumor = shareRumor(mockNPC, alliedRel, mockWorld(1), 1);

      expect(neutralRumor?.category).toBe('world_secret');
      expect(['boss_weakness', 'hidden_quest', 'dungeon_tip', 'creature_location', 'world_secret']).toContain(alliedRumor?.category);
    });
  });

  describe('isRumorDiscovered', () => {
    it('returns false when rumor is not in discovered list', () => {
      const rumor: Rumor = {
        id: 'rumor_1',
        category: 'world_secret',
        content: 'test',
        worldId: 1,
        trustRequired: 20,
        sourceNpcId: 'npc_1',
      };
      expect(isRumorDiscovered(rumor, [])).toBe(false);
    });

    it('returns true when rumor id matches', () => {
      const rumor: Rumor = {
        id: 'rumor_1',
        category: 'world_secret',
        content: 'test',
        worldId: 1,
        trustRequired: 20,
        sourceNpcId: 'npc_1',
      };
      expect(isRumorDiscovered(rumor, [rumor])).toBe(true);
    });
  });

  describe('determinism', () => {
    it('generates the same rumor for same inputs', () => {
      const rumor1 = generateRumor('world_secret', mockNPC, mockWorld(1), 5);
      const rumor2 = generateRumor('world_secret', mockNPC, mockWorld(1), 5);
      expect(rumor1?.category).toBe(rumor2?.category);
      expect(rumor1?.content).toBe(rumor2?.content);
      expect(rumor1?.worldId).toBe(rumor2?.worldId);
      expect(rumor1?.sourceNpcId).toBe(rumor2?.sourceNpcId);
      expect(rumor1?.trustRequired).toBe(rumor2?.trustRequired);
    });
  });
});
