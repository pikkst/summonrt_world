import type { GameStore, GameStoreState, DemonlordState, PlayerState, CreatureInstance, SetState } from '../types.ts';
import { createLog } from '../helpers.ts';
import { DEMONLORD_FLOOR_MIN, DEMONLORD_FLOOR_MAX, DEMONLORD_SKILLS, createDemonlordState, issueChallenge, acceptChallenge, resolveChallenge, calculateDemonlordInfluence, applyDemonlordBonuses, getDemonlordForFloor, FloorActivity, updateFloorActivity } from '../../../core/demonlord';
import { getAllNodes, getAggregateStats } from '../../../data/careerTree/index';
import { getCareerSystemBonuses } from '../../../data/careerTreeIntegration';

export const demonlordActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  initDemonlord: () => {
    const state = get();
    if (state.demonlordState) return;

    const demonlordState = createDemonlordState();
    set({ demonlordState });
  },

  challengeDemonlord: () => {
    const { player, demonlordState, appendLog } = get();
    if (!player) return;

    if (!demonlordState) {
      get().initDemonlord();
      return get().challengeDemonlord();
    }

    if (!get().isOnDemonlordFloor()) {
      appendLog('The Demonlord can only be challenged on floors 50+. Find a dungeon entrance on those floors.', 'warning');
      return;
    }

    const now = Date.now();
    const updatedState = issueChallenge(demonlordState, player.id, player.name, now);
    set({ demonlordState: updatedState });
    appendLog(`You have issued a challenge to the Demonlord! Wait for acceptance...`, 'system');
  },

  acceptDemonlordChallenge: () => {
    const { demonlordState, appendLog } = get();
    if (!demonlordState || demonlordState.pendingChallenges.length === 0) {
      appendLog('No pending challenges to accept.', 'warning');
      return;
    }

    const now = Date.now();
    const updatedState = acceptChallenge(demonlordState, now);
    set({ demonlordState: updatedState });
    
    const activeChallenge = updatedState.activeChallenge;
    if (activeChallenge) {
      appendLog(`${activeChallenge.challengerName}'s challenge has been accepted! Prepare for combat!`, 'warning');
    }
  },

  resolveDemonlordCombat: (victorId: string) => {
    const { demonlordState, player, appendLog } = get();
    if (!demonlordState || !player) return;

    const now = Date.now();
    const updatedState = resolveChallenge(demonlordState, victorId, now);
    set({ demonlordState: updatedState });

    if (victorId === player.id) {
      set({
        player: {
          ...player,
          unspent_passive_points: (player.unspent_passive_points || 0) + 5,
        },
      });
      appendLog(`🎉 VICTORY! You have defeated the Demonlord and claimed the title! +5 Passive Points awarded!`, 'success');
    } else {
      appendLog(`The challenger was defeated by the Demonlord. The title remains contested.`, 'warning');
    }
  },

  isOnDemonlordFloor: (): boolean => {
    const { player, currentWorldId } = get();
    if (!player) return false;
    return getDemonlordForFloor(currentWorldId);
  },

  updateDemonlordInfluence: (playerCountDelta: number) => {
    const { demonlordState, currentWorldId } = get();
    if (!demonlordState || !get().isOnDemonlordFloor()) return;

    const floorActivity = (get().demonlordFloorActivity || { playerCount: 0, recentActivity: 0, lastUpdate: Date.now() }) as FloorActivity;
    const updatedActivity = updateFloorActivity(floorActivity, playerCountDelta, Date.now());
    
    set({ demonlordFloorActivity: updatedActivity });
    
    const influenceResult = calculateDemonlordInfluence(updatedActivity, demonlordState.influence);
    set((state) => ({
      demonlordState: state.demonlordState ? { ...state.demonlordState, influence: influenceResult.influence } : undefined
    }));
  },

  getDemonlordInfluenceForCombat: (): number => {
    const { demonlordState } = get();
    return demonlordState?.influence ?? 0;
  },

  applyDemonlordCombatBonuses: (baseDamage: number, baseDefense: number): { damage: number; defense: number } => {
    const { demonlordState, player, currentWorldId } = get();
    if (!player) return { damage: baseDamage, defense: baseDefense };

    const bonuses = { damage_dealt_pct: 0, damage_taken_pct: 0 };
    
    const treeData = getAllNodes();
    const aggregatedStats = getAggregateStats(player, treeData);
    const careerBonuses = getCareerSystemBonuses(aggregatedStats);

    const demonlordInfluence = demonlordState?.influence ?? 0;
    const demonlordBonuses = applyDemonlordBonuses(bonuses, demonlordInfluence);

const finalDamage = Math.max(1, Math.floor(baseDamage * (1 + (demonlordBonuses.damage_dealt_pct || 0) / 100)));
    const finalDefense = Math.max(1, Math.floor(baseDefense * (1 + (demonlordBonuses.damage_taken_pct || 0) / 100)));

    const careerDamage = finalDamage;
    const withCareerDamage = 1 + ((careerBonuses.damage_dealt_pct || 0) / 100);
    const withCareerDefense = 1 + ((careerBonuses.damage_taken_pct || 0) / 100);

    return {
      damage: Math.max(1, Math.floor(finalDamage * withCareerDamage)),
      defense: Math.max(1, Math.floor(finalDefense * withCareerDefense)),
    };
  },

  setDemonlordFloorActivity: (activity: FloorActivity) => {
    set({ demonlordFloorActivity: activity });
  },

  getDemonlordFloorActivity: (): FloorActivity => {
    const { demonlordFloorActivity } = get();
    return demonlordFloorActivity || { playerCount: 0, recentActivity: 0, lastUpdate: Date.now() };
  },
});

export { DEMONLORD_FLOOR_MIN, DEMONLORD_FLOOR_MAX, DEMONLORD_SKILLS, getDemonlordForFloor };