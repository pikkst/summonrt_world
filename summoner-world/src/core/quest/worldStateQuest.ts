import type {
  Element,
  NPCNeed,
  QuestTemplate,
  WorldData,
  WorldMonsterSummary,
  WorldResourceSummary,
  WorldStateSnapshot,
} from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';
import { RESOURCES } from '../../data/constants';
import { getWorldElement } from '../dungeon/BossScaling';
import { registerQuestTemplate } from '../../data/quests';
import type { GeneratedQuestContext } from './questGeneration';

const ALL_RESOURCE_KEYS = Object.keys(RESOURCES);

const MONSTER_NAME_PARTS = ['Brave', 'Wolf', 'Lion', 'Bear', 'Serpent', 'Wing', 'Claw', 'Fang', 'Scale', 'Horn'];

function deriveAvailableMonsters(world: WorldData, count: number): WorldMonsterSummary[] {
  const worldElement = getWorldElement(world.id) as Element;
  const elements: Element[] = ['fire', 'water', 'earth', 'air', 'lightning', 'iron', 'nature', 'ice', 'light', 'darkness'];
  const classes = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'] as const;
  const rng = new SeededRandom(`monsters_${world.id}`);
  const monsters: WorldMonsterSummary[] = [];

  for (let i = 0; i < count; i++) {
    const start = rng.int(0, 8);
    const sliceLen = Math.min(2, 9 - start);
    const monsterElements = elements.slice(start, start + sliceLen);
    if (!monsterElements.includes(worldElement)) {
      monsterElements.push(worldElement);
    }
    const creatureClass = classes[rng.int(0, 4)]!;
    const baseMult = 1 + 0.5 + world.tier * 0.1;
    const monstersName = `${rng.pick(MONSTER_NAME_PARTS) ?? 'Wild'} ${rng.pick(MONSTER_NAME_PARTS) ?? 'Beast'}`;
    monsters.push({
      key: `mon_${world.id}_${i}`,
      name: monstersName,
      elements: monsterElements,
      creatureClass,
      difficulty: Math.floor((8 * baseMult) + (20 * baseMult) * 0.5),
    });
  }

  return monsters;
}

function deriveResources(world: WorldData): WorldResourceSummary[] {
  const present = new Set<string>();
  for (const tile of world.tiles.values()) {
    if (tile.resourceType && (tile.resourceQty ?? 0) > 0) {
      present.add(tile.resourceType);
    }
  }

  return ALL_RESOURCE_KEYS.map((resourceType) => {
    const available = world.tiles.size > 0
      ? [...world.tiles.values()].filter((t) => t.resourceType === resourceType && (t.resourceQty ?? 0) > 0).length
      : 0;
    return {
      resourceType,
      available,
      depleted: !present.has(resourceType),
    };
  });
}

export function deriveWorldStateSnapshot(world: WorldData): WorldStateSnapshot {
  const resources = deriveResources(world);
  const missingResources = resources.filter((r) => r.depleted).map((r) => r.resourceType);

  return {
    worldId: world.id,
    tier: world.tier,
    worldElement: getWorldElement(world.id) as Element,
    availableMonsters: deriveAvailableMonsters(world, 5),
    resources,
    missingResources,
  };
}

export function generateNPCNeeds(
  npcId: string,
  snapshot: WorldStateSnapshot,
  turnCount: number
): NPCNeed[] {
  if (snapshot.availableMonsters.length === 0 && snapshot.missingResources.length === 0) {
    return [];
  }

  const rng = new SeededRandom(`needs_${npcId}_${turnCount}`);
  const needs: NPCNeed[] = [];

  const monster = rng.pick(snapshot.availableMonsters);
  if (monster) {
    needs.push({
      kind: 'monster',
      target: monster.key,
      quantity: rng.int(1, 3),
      reason: `${monster.name} have been troubling the settlement.`,
    });
  }

  const missingResource = rng.pick(snapshot.missingResources);
  if (missingResource) {
    needs.push({
      kind: 'resource',
      target: missingResource,
      quantity: rng.int(3, 8),
      reason: `${RESOURCES[missingResource]?.name ?? missingResource} is scarce in this region.`,
    });
  }

  return needs.slice(0, 2);
}

export function generateWorldStateQuest(
  snapshot: WorldStateSnapshot,
  context: GeneratedQuestContext
): QuestTemplate | null {
  if (snapshot.availableMonsters.length === 0) return null;

  const rng = new SeededRandom(`wstate_${context.seed}_${context.turnCount}`);
  const monster = rng.pick(snapshot.availableMonsters)!;

  return {
    key: `proc_worldstate_combat_${snapshot.worldId}_${context.turnCount}`,
    title: `Threat: ${monster.name}`,
    description: `${monster.name} roam World ${snapshot.worldId}. Subdue them to ease the local danger.`,
    type: 'combat',
    target: monster.key,
    amount: 1 + Math.floor(context.playerLevel / 10),
    rewards: {
      money: 250 + snapshot.tier * 60,
      exp: 180 + context.playerLevel * 12,
    },
    tags: ['world_state', 'monster'],
  };
}

export function generateNPCNeedQuest(
  npcId: string,
  needs: NPCNeed[],
  context: GeneratedQuestContext,
  snapshot: WorldStateSnapshot
): QuestTemplate | null {
  const need = needs[0];
  if (!need) return null;

  if (need.kind === 'resource') {
    const resourceName = RESOURCES[need.target]?.name ?? need.target;
    return {
      key: `proc_need_resource_${npcId}_${context.turnCount}`,
      title: `Supply Run: ${resourceName}`,
      description: `${need.reason ?? resourceName} Deliver ${need.quantity} ${resourceName} to help.`,
      type: 'gather',
      target: need.target,
      amount: need.quantity,
      rewards: {
        money: 120 + need.quantity * 20,
        exp: 80 + context.playerLevel * 6,
      },
      tags: ['world_state', 'npc_need', 'resource'],
    };
  }

  const monster = snapshot.availableMonsters.find((m) => m.key === need.target);
  return {
    key: `proc_need_monster_${npcId}_${context.turnCount}`,
    title: `Bounty: ${monster?.name ?? 'Creature'}`,
    description: `${need.reason ?? 'A creature is causing trouble.'} Defeat ${need.quantity} to claim the bounty.`,
    type: 'combat',
    target: need.target,
    amount: need.quantity,
    rewards: {
      money: 300 + context.playerLevel * 15,
      exp: 200 + context.playerLevel * 10,
    },
    tags: ['world_state', 'npc_need', 'monster'],
  };
}

export function generateWorldStateQuestBundle(
  npcId: string,
  snapshot: WorldStateSnapshot,
  context: GeneratedQuestContext
): QuestTemplate[] {
  const quests: QuestTemplate[] = [];

  const worldStateQuest = generateWorldStateQuest(snapshot, context);
  if (worldStateQuest) {
    registerQuestTemplate(worldStateQuest);
    quests.push(worldStateQuest);
  }

  const needs = generateNPCNeeds(npcId, snapshot, context.turnCount);
  const npcNeedQuest = generateNPCNeedQuest(npcId, needs, context, snapshot);
  if (npcNeedQuest) {
    registerQuestTemplate(npcNeedQuest);
    quests.push(npcNeedQuest);
  }

  return quests;
}
