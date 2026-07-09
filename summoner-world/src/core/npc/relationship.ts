import type { NPCRelationship, RelationshipType } from '../../types/game.ts';

export const RELATIONSHIP_MIN = -100;
export const RELATIONSHIP_MAX = 100;
export const RELATIONSHIP_NEUTRAL = 0;

export function createDefaultRelationship(): NPCRelationship {
  return {
    friendship: RELATIONSHIP_NEUTRAL,
    rivalry: RELATIONSHIP_NEUTRAL,
    romance: RELATIONSHIP_NEUTRAL,
  };
}

export function clampRelationship(value: number): number {
  return Math.max(RELATIONSHIP_MIN, Math.min(RELATIONSHIP_MAX, value));
}

export function updateRelationship(
  current: NPCRelationship,
  type: RelationshipType,
  delta: number
): NPCRelationship {
  const next = { ...current };
  next[type] = clampRelationship(next[type] + delta);
  return next;
}

export function getRelationshipTier(relationship: NPCRelationship): string {
  const total = relationship.friendship + relationship.romance - relationship.rivalry;
  if (total >= 60) return 'allied';
  if (total >= 30) return 'friendly';
  if (total > -30) return 'neutral';
  if (total > -60) return 'unfriendly';
  return 'hostile';
}

export function getRelationshipDelta(
  current: NPCRelationship,
  type: RelationshipType,
  delta: number
): RelationshipType | null {
  const next = updateRelationship(current, type, delta);
  if (next[type] !== current[type]) {
    return type;
  }
  return null;
}
