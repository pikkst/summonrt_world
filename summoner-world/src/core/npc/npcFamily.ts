import type { NPC, NPCMarriageRecord, NPCInheritanceEvent, WorldData, TileData } from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';
import { worldEventBus } from '../worldEventBus';

export const MARRIAGE_ROMANCE_THRESHOLD = 40;
export const MARRIAGE_CHANCE_PER_TICK = 0.02;
export const CHILD_BIRTH_CHANCE_PER_TICK = 0.01;
export const NPC_DEATH_WEALTH_THRESHOLD = 0;
export const NPC_MAX_CHILDREN = 3;

interface NPCMarriageParams {
  npcA: NPC;
  npcB: NPC;
  seed: number | string;
}

export function checkMarriageEligibility(npcA: NPC, npcB: NPC): { eligible: boolean; reason?: string } {
  if (npcA.spouseId || npcB.spouseId) {
    return { eligible: false, reason: 'already_married' };
  }

  const relAB = npcA.relationships?.[npcB.id];
  const relBA = npcB.relationships?.[npcA.id];

  if (!relAB || !relBA) {
    return { eligible: false, reason: 'no_relationship' };
  }

  const avgRomance = (relAB.romance + relBA.romance) / 2;
  if (avgRomance < MARRIAGE_ROMANCE_THRESHOLD) {
    return { eligible: false, reason: 'low_romance' };
  }

  return { eligible: true };
}

export function createMarriageRecord(params: NPCMarriageParams): NPCMarriageRecord {
  const { npcA, npcB, seed } = params;
  const rng = new SeededRandom(seed);
  return {
    id: `marriage_${npcA.id}_${npcB.id}`,
    partnerAId: npcA.id,
    partnerBId: npcB.id,
    createdAt: rng.int(0, 100000),
  };
}

export function applyMarriage(params: NPCMarriageParams): {
  marriage: NPCMarriageRecord;
  updatedA: NPC;
  updatedB: NPC;
} {
  const { npcA, npcB, seed } = params;
  const eligibility = checkMarriageEligibility(npcA, npcB);
  if (!eligibility.eligible) {
    throw new Error(`Cannot marry: ${eligibility.reason}`);
  }

  const marriage = createMarriageRecord({ npcA, npcB, seed });
  const rng = new SeededRandom(seed);
  const combinedWealth = (npcA.wealth ?? 0) + (npcB.wealth ?? 0);
  const sharedWealth = combinedWealth / 2;
  const familyName = rng.pick([npcA.familyName, npcB.familyName]) ?? npcA.familyName;

  const updatedA: NPC = {
    ...npcA,
    spouseId: npcB.id,
    familyName,
    wealth: sharedWealth,
    relationships: {
      ...npcA.relationships,
      [npcB.id]: { ...(npcA.relationships?.[npcB.id] ?? createDefaultRelationship()), romance: MARRIAGE_ROMANCE_THRESHOLD },
    },
  };

  const updatedB: NPC = {
    ...npcB,
    spouseId: npcA.id,
    familyName,
    wealth: sharedWealth,
    relationships: {
      ...npcB.relationships,
      [npcA.id]: { ...(npcB.relationships?.[npcA.id] ?? createDefaultRelationship()), romance: MARRIAGE_ROMANCE_THRESHOLD },
    },
  };

  return { marriage, updatedA, updatedB };
}

export function createChildNPC(params: {
  npcA: NPC;
  npcB: NPC;
  seed: number | string;
  firstName?: string;
}): { child: NPC; updatedA: NPC; updatedB: NPC } {
  const { npcA, npcB, seed, firstName } = params;
  const rng = new SeededRandom(seed);

  const familyName = npcA.familyName ?? npcB.familyName ?? 'Unknown';
  const first = firstName ?? generateInheritedFirstName(rng, npcA, npcB);
  const childId = `npc_${npcA.id}_${npcB.id}_${rng.int(0, 9999)}`;

  const child: NPC = {
    id: childId,
    name: `${first} ${familyName}`,
    role: rng.pick(['quest_giver', 'merchant', 'healer', 'trainer']) ?? 'quest_giver',
    dialogue: ['Hello!'],
    schedule: [],
    currentActivity: 'work',
    parentIds: [npcA.id, npcB.id],
    familyName,
    wealth: 0,
    relationships: {},
  };

  const updatedA: NPC = {
    ...npcA,
    childIds: [...(npcA.childIds ?? []), child.id],
  };

  const updatedB: NPC = {
    ...npcB,
    childIds: [...(npcB.childIds ?? []), child.id],
  };

  return { child, updatedA, updatedB };
}

function generateInheritedFirstName(rng: SeededRandom, npcA: NPC, npcB: NPC): string {
  const firstA = npcA.name.split(' ')[0] || 'An';
  const firstB = npcB.name.split(' ')[0] || 'An';

  if (rng.chance(0.5)) {
    return firstA;
  }

  const mixed = `${firstA}${firstB}`;
  if (mixed.length > 1) {
    return mixed.charAt(0).toUpperCase() + mixed.slice(1);
  }

  return firstB;
}

function createDefaultRelationship(): { friendship: number; rivalry: number; romance: number } {
  return { friendship: 0, rivalry: 0, romance: 0 };
}

export function getHeirIds(npc: NPC): string[] {
  const ids: string[] = [];
  if (npc.spouseId) ids.push(npc.spouseId);
  ids.push(...(npc.childIds ?? []));
  return [...new Set(ids)];
}

export function processInheritance(
  deceasedNPC: NPC,
  resolveNPC: (id: string) => NPC | undefined
): { events: NPCInheritanceEvent[]; updatedNPCs: NPC[] } {
  const heirIds = getHeirIds(deceasedNPC);
  const totalWealth = deceasedNPC.wealth ?? 0;

  if (heirIds.length === 0 || totalWealth <= 0) {
    return { events: [], updatedNPCs: [] };
  }

  const share = totalWealth / heirIds.length;
  const events: NPCInheritanceEvent[] = [];
  const updatedNPCs: NPC[] = [];

  for (const heirId of heirIds) {
    const heir = resolveNPC(heirId);
    if (!heir) continue;

    const enriched: NPC = {
      ...heir,
      wealth: (heir.wealth ?? 0) + share,
    };

    events.push({
      deceasedId: deceasedNPC.id,
      sharePerHeir: share,
      totalWealthShare: totalWealth / heirIds.length,
      heirs: [{ npcId: heirId, share }],
      timestamp: Date.now(),
    });

    updatedNPCs.push(enriched);

    worldEventBus.publish({
      type: 'NPCInheritedProperty',
      deceasedId: deceasedNPC.id,
      heirId,
      inheritedWealth: share,
      gameTimeMinutes: 0,
      turnCount: 0,
    });
  }

  return { events, updatedNPCs };
}

export function tickNPCFamilies(
  worlds: Map<number, WorldData>,
  turnCount: number,
  gameTimeMinutes: number
): Map<number, WorldData> {
  const newWorlds = new Map(worlds);
  let anyWorldChanged = false;

  newWorlds.forEach((world, worldId) => {
    const newTiles = new Map(world.tiles);
    let worldChanged = false;
    const tilesToAdd = new Map<string, TileData>();
    const tilesToRemove: string[] = [];

    const npcMap = new Map<string, NPC>();
    newTiles.forEach((tile) => {
      if (tile.npc) npcMap.set(tile.npc.id, tile.npc);
    });

    newTiles.forEach((tile, tileKey) => {
      if (!tile.npc) return;
      const npc = tile.npc;
      const npcSeed = `${npc.id}-${worldId}-${turnCount}`;

      if ((npc.wealth ?? 0) < 0) {
        const { events, updatedNPCs } = processInheritance(npc, (id) => npcMap.get(id));
        worldChanged = true;
        tilesToRemove.push(tileKey);

        for (const updated of updatedNPCs) {
          npcMap.set(updated.id, updated);
          newTiles.forEach((t, key) => {
            if (t.npc?.id === updated.id) {
              newTiles.set(key, { ...t, npc: updated });
            }
          });
        }
        return;
      }

      const spouseId = npc.spouseId;
      if (!spouseId) {
        const eligiblePartner = findEligiblePartner(npc, newTiles, npcMap, turnCount);
        if (eligiblePartner) {
          const rng = new SeededRandom(`${npcSeed}-marriage`);
          if (rng.chance(MARRIAGE_CHANCE_PER_TICK)) {
            const { marriage, updatedA, updatedB } = applyMarriage({
              npcA: npc,
              npcB: eligiblePartner,
              seed: `${npcSeed}-marriage`,
            });

            worldChanged = true;
            npcMap.set(updatedA.id, updatedA);
            npcMap.set(updatedB.id, updatedB);
            newTiles.forEach((t, key) => {
              if (t.npc?.id === updatedA.id) {
                newTiles.set(key, { ...t, npc: updatedA });
              }
              if (t.npc?.id === updatedB.id) {
                newTiles.set(key, { ...t, npc: updatedB });
              }
            });

            worldEventBus.publish({
              type: 'NPCMarried',
              npcId: updatedA.id,
              partnerId: updatedB.id,
              marriageId: marriage.id,
              gameTimeMinutes,
              turnCount,
            });
          }
        }
      }

      if (npc.spouseId && (npc.childIds?.length ?? 0) < NPC_MAX_CHILDREN) {
        const rng = new SeededRandom(`${npcSeed}-child`);
        if (rng.chance(CHILD_BIRTH_CHANCE_PER_TICK)) {
          const spouse = npcMap.get(npc.spouseId);
          if (spouse) {
            const { child, updatedA, updatedB } = createChildNPC({
              npcA: npc,
              npcB: spouse,
              seed: `${npcSeed}-child`,
            });

            worldChanged = true;
            npcMap.set(child.id, child);
            npcMap.set(updatedA.id, updatedA);
            npcMap.set(updatedB.id, updatedB);
            tilesToAdd.set(`child_${child.id}_${tileKey}`, {
              x: tile.x ?? 0,
              y: tile.y ?? 0,
              biome: tile.biome,
              discovered: false,
              explored: false,
              npc: child,
            });

            newTiles.forEach((t, key) => {
              if (t.npc?.id === updatedA.id) {
                newTiles.set(key, { ...t, npc: updatedA });
              }
              if (t.npc?.id === updatedB.id) {
                newTiles.set(key, { ...t, npc: updatedB });
              }
            });

            worldEventBus.publish({
              type: 'NPCChildBorn',
              childNpcId: child.id,
              parentAId: npc.id,
              parentBId: spouse.id,
              familyName: child.familyName ?? 'Unknown',
              gameTimeMinutes,
              turnCount,
            });
          }
        }
      }
    });

    if (worldChanged) {
      tilesToRemove.forEach((key) => {
        const existing = newTiles.get(key);
        if (existing) {
          newTiles.set(key, { ...existing, npc: undefined });
        }
      });
      tilesToAdd.forEach((tile, key) => {
        newTiles.set(key, tile);
      });

      newWorlds.set(worldId, {
        ...world,
        tiles: newTiles,
      });
      anyWorldChanged = true;
    }
  });

  return newWorlds;
}

function findEligiblePartner(
  npc: NPC,
  tiles: Map<string, TileData>,
  npcMap: Map<string, NPC>,
  turnCount: number
): NPC | null {
  const rng = new SeededRandom(`${npc.id}-${turnCount}-partner-search`);
  const candidates: NPC[] = [];

  tiles.forEach((tile) => {
    if (!tile.npc || tile.npc.id === npc.id) return;
    const other = tile.npc;
    if (other.spouseId) return;

    const rel = npc.relationships?.[other.id];
    const relOther = other.relationships?.[npc.id];
    if (!rel || !relOther) return;

    const avgRomance = (rel.romance + relOther.romance) / 2;
    if (avgRomance >= MARRIAGE_ROMANCE_THRESHOLD) {
      candidates.push(other);
    }
  });

  if (candidates.length === 0) return null;
  return rng.pick(candidates) ?? null;
}
