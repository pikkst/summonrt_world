import { canUnlockNode, getAggregateStats, respecAllNodes, getAllNodes, getNodeById } from '../../../data/careerTree/index';
import type { GameStore, PlayerState, LogEntry, SetState } from '../types.ts';

export const careerActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  unlockSkill: (nodeId: string) => {
    const { player, appendLog } = get();
    if (!player) return;

    const treeData = getAllNodes();
    const targetNode = getNodeById(nodeId);

    if (!targetNode) {
      appendLog(`Skill node ${nodeId} not found.`, 'error');
      return;
    }

    if (!canUnlockNode(player, nodeId, treeData)) {
      appendLog(`Cannot unlock "${targetNode.name}". Check requirements.`, 'warning');
      return;
    }

    const updatedPlayer: PlayerState = {
      ...player,
      unspent_passive_points: player.unspent_passive_points - 1,
      unlocked_node_ids: [...player.unlocked_node_ids, nodeId],
    };

    set({ player: updatedPlayer });
    appendLog(`🌟 Node Unlocked: ${targetNode.name}!`, 'success');
  },

  respecAllNodes: () => {
    const { player, appendLog } = get();
    if (!player) return;

    const updatedPlayer = respecAllNodes(player);
    set({ player: updatedPlayer });
    appendLog('Career tree respecced. All points refunded.', 'system');
  },
});
