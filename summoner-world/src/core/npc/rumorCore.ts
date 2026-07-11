import type { NPC, NPCRelationship, WorldData, Rumor, RumorCategory } from '../../types/game.ts';
import { getRelationshipTier } from './relationship.ts';
import { QUEST_TEMPLATES } from '../../data/quests.ts';
import { getWorldElement } from '../dungeon/BossScaling.ts';

export const RUMOR_TRUST_THRESHOLD: Record<string, number> = {
  hostile: 0,
  unfriendly: 0,
  neutral: 20,
  friendly: 45,
  allied: 70,
};

export const RUMOR_CATEGORIES_BY_TIER: Record<string, RumorCategory[]> = {
  hostile: [],
  unfriendly: [],
  neutral: ['world_secret'],
  friendly: ['world_secret', 'dungeon_tip', 'creature_location'],
  allied: ['world_secret', 'dungeon_tip', 'creature_location', 'boss_weakness', 'hidden_quest'],
};

export function getAvailableRumorCategories(relationship: NPCRelationship): RumorCategory[] {
  const tier = getRelationshipTier(relationship);
  return RUMOR_CATEGORIES_BY_TIER[tier] ?? [];
}

export function getTrustRequirement(category: RumorCategory): number {
  const tierOrder = ['hostile', 'unfriendly', 'neutral', 'friendly', 'allied'];
  for (const tier of tierOrder) {
    if (RUMOR_CATEGORIES_BY_TIER[tier]?.includes(category)) {
      return RUMOR_TRUST_THRESHOLD[tier] ?? 0;
    }
  }
  return 100;
}

export function generateRumor(category: RumorCategory, npc: NPC, world: WorldData, turnCount: number): Rumor | null {
  const id = `rumor_${npc.id}_${category}_${turnCount}`;

  switch (category) {
    case 'boss_weakness': {
      const worldElement = getWorldElement(world.id);
      const weaknessName = worldElement.charAt(0).toUpperCase() + worldElement.slice(1);
      return {
        id,
        category,
        content: `I heard the Floor Boss here is vulnerable to ${weaknessName} elemental attacks.`,
        worldId: world.id,
        trustRequired: getTrustRequirement(category),
        sourceNpcId: npc.id,
      };
    }
    case 'hidden_quest': {
      const hiddenQuests = Object.entries(QUEST_TEMPLATES).filter(([key]) => key !== 'starter_explore' && key !== 'starter_capture');
      const index = deterministicIndex(npc.id, category, turnCount, hiddenQuests.length);
      const quest = hiddenQuests[index];
      if (!quest) return null;
      return {
        id,
        category,
        content: `Word is, there's a quest called "${quest[1].title}" that not everyone knows about.`,
        worldId: world.id,
        trustRequired: getTrustRequirement(category),
        sourceNpcId: npc.id,
      };
    }
    case 'dungeon_tip': {
      const safeInterval = Math.max(10, Math.floor(world.dungeonFloors / 10) * 10);
      return {
        id,
        category,
        content: `Safe floors in this world's spire appear every ${safeInterval} floors. Rest and resupply there before pushing deeper.`,
        worldId: world.id,
        trustRequired: getTrustRequirement(category),
        sourceNpcId: npc.id,
      };
    }
    case 'world_secret': {
      return {
        id,
        category,
        content: `This world holds secrets beyond the spire. Some say rare creatures appear far from the starting zones.`,
        worldId: world.id,
        trustRequired: getTrustRequirement(category),
        sourceNpcId: npc.id,
      };
    }
    case 'creature_location': {
      return {
        id,
        category,
        content: `I've spotted unusual creature activity near the edges of the map. Worth investigating if you're looking for rare captures.`,
        worldId: world.id,
        trustRequired: getTrustRequirement(category),
        sourceNpcId: npc.id,
      };
    }
    default:
      return null;
  }
}

export function shareRumor(npc: NPC, playerRel: NPCRelationship, world: WorldData, turnCount: number): Rumor | null {
  const available = getAvailableRumorCategories(playerRel);
  if (available.length === 0) return null;

  const index = deterministicIndex(npc.id, 'share', turnCount, available.length);
  const category = available[index];
  if (!category) return null;
  return generateRumor(category, npc, world, turnCount);
}

export function isRumorDiscovered(rumor: Rumor, discoveredRumors: Rumor[]): boolean {
  return discoveredRumors.some((r) => r.id === rumor.id);
}

function deterministicIndex(seedA: string, seedB: string, seedC: number, max: number): number {
  const str = `${seedA}_${seedB}_${seedC}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % Math.max(1, max));
}
