import type { CareerTree, CareerNode, CareerCategory } from './types';
import nodesData from './nodes.json' assert { type: 'json' };
import type { PlayerState } from '../../types/game';

const careerTree: CareerTree = (nodesData as unknown as CareerNode[]).reduce(
  (acc, node) => {
    acc[node.id] = node;
    return acc;
  },
  {} as CareerTree
);

export function getAllNodes(): CareerTree {
  return careerTree;
}

export function getNodeById(nodeId: string): CareerNode | undefined {
  return careerTree[nodeId];
}

export function getNodesByCategory(category: CareerCategory): CareerNode[] {
  return Object.values(careerTree).filter(
    (node) => node.career_category === category
  );
}

export function canUnlockNode(
  playerState: PlayerState,
  targetNodeId: string,
  treeData: CareerTree
): boolean {
  const hasPoints = playerState.unspent_passive_points >= 1;
  if (!hasPoints) return false;

  const targetNode = treeData[targetNodeId];
  if (!targetNode) return false;

  const alreadyUnlocked = playerState.unlocked_node_ids.includes(targetNodeId);
  if (alreadyUnlocked) return false;

  const hasPrereq = targetNode.connections.some((connId) =>
    playerState.unlocked_node_ids.includes(connId)
  );
  if (!hasPrereq) return false;

  return true;
}

export function getAggregateStats(
  playerState: PlayerState,
  treeData: CareerTree
): Record<string, number> {
  const aggregated: Record<string, number> = {};

  for (const nodeId of playerState.unlocked_node_ids) {
    const node = treeData[nodeId];
    if (node) {
      for (const [stat, value] of Object.entries(node.stats)) {
        aggregated[stat] = (aggregated[stat] || 0) + (value as number);
      }
    }
  }

  return aggregated;
}

export function respecAllNodes(playerState: PlayerState): PlayerState {
  const nodesToRefund = playerState.unlocked_node_ids.filter(
    (id) => id !== 'root_hub'
  ).length;

  return {
    ...playerState,
    unlocked_node_ids: ['root_hub'],
    unspent_passive_points: (playerState.unspent_passive_points || 0) + nodesToRefund,
  };
}

import type { MissionModifiers } from '../../core/missionQueue';

export function getCareerModifiers(
  aggregatedStats: Record<string, number>
): MissionModifiers {
  const modifiers: MissionModifiers = {};

  if (aggregatedStats.exploration_speed_pct) {
    modifiers.tree_speed_pct = aggregatedStats.exploration_speed_pct;
  }
  if (aggregatedStats.caravan_speed_pct) {
    modifiers.caravan_speed_pct = aggregatedStats.caravan_speed_pct;
  }
  if (aggregatedStats.store_traffic_pct) {
    modifiers.store_traffic_pct = aggregatedStats.store_traffic_pct;
  }
  if (aggregatedStats.crafting_speed_pct) {
    modifiers.crafting_speed_pct = aggregatedStats.crafting_speed_pct;
  }
  if (aggregatedStats.yield_bonus_pct) {
    modifiers.yield_bonus_pct = aggregatedStats.yield_bonus_pct;
  }

  return modifiers;
}

export type { CareerTree, CareerNode, CareerNodeType, CareerCategory } from './types';