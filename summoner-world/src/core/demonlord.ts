import type { DemonlordState, DemonlordSkill } from '../types/game';

export const DEMONLORD_FLOOR_MIN = 50;
export const DEMONLORD_FLOOR_MAX = 100;

export const DEMONLORD_SKILLS: DemonlordSkill[] = [
  {
    key: 'hellfire_blast',
    name: 'Hellfire Blast',
    description: 'A devastating fire attack that ignores 20% of enemy defense',
    element: 'fire',
    power: 15,
    cost: 0,
    type: 'signature',
  },
  {
    key: 'void_corruption',
    name: 'Void Corruption',
    description: 'Inflicts a debuff that reduces damage dealt by 15%',
    element: 'void',
    power: 10,
    cost: 0,
    type: 'debuff',
    effects: { damage_reduction: 15 },
  },
  {
    key: 'demon_rift',
    name: 'Demon Rift',
    description: 'Summons lesser demons to aid in combat',
    element: 'darkness',
    power: 12,
    cost: 0,
    type: 'aoe',
  },
  {
    key: 'infernal_shift',
    name: 'Infernal Shift',
    description: 'Changes elemental affinity to fire for next 3 turns',
    element: 'fire',
    power: 0,
    cost: 0,
    type: 'elemental_shift',
  },
  {
    key: 'shadow_veil',
    name: 'Shadow Veil',
    description: 'Becomes immune to attacks for 1 turn, reflecting 50% damage',
    element: 'darkness',
    power: 0,
    cost: 0,
    type: 'floor_manager',
    effects: { damage_reflect: 50 },
  },
];

export interface FloorActivity {
  playerCount: number;
  recentActivity: number;
  lastUpdate: number;
}

export interface DemonlordInfluenceResult {
  influence: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  shouldSpawn: boolean;
}

export function createDemonlordState(): DemonlordState {
  return {
    isActive: true,
    currentLordPlayerId: undefined,
    currentLordPlayerName: undefined,
    floorMin: DEMONLORD_FLOOR_MIN,
    floorMax: DEMONLORD_FLOOR_MAX,
    influence: 100,
    influenceDecayRate: 0.1,
    activityThreshold: 5,
    skills: DEMONLORD_SKILLS,
    pendingChallenges: [],
    activeChallenge: undefined,
    defeatedAt: undefined,
  };
}

export function updateFloorActivity(
  current: FloorActivity,
  playerCountDelta: number,
  currentTime: number
): FloorActivity {
  const decay = Math.max(0, current.recentActivity * 0.95);
  return {
    playerCount: Math.max(0, current.playerCount + playerCountDelta),
    recentActivity: decay + (playerCountDelta > 0 ? playerCountDelta * 10 : 0),
    lastUpdate: currentTime,
  };
}

export function calculateDemonlordInfluence(
  activity: FloorActivity,
  baseInfluence: number = 100
): DemonlordInfluenceResult {
  const playerFactor = Math.max(0, 10 - activity.playerCount) / 10;
  const activityFactor = Math.max(0, 1 - activity.recentActivity / 100);
  const influence = baseInfluence * (playerFactor + activityFactor) / 2;

  let intensity: 'low' | 'medium' | 'high' | 'extreme' = 'low';
  if (influence > 80) intensity = 'extreme';
  else if (influence > 50) intensity = 'high';
  else if (influence > 25) intensity = 'medium';

  const shouldSpawn = influence > 30 && activity.playerCount < 8;

  return { influence, intensity, shouldSpawn };
}

export function selectDemonlordSkill(
  availableSkills: DemonlordSkill[],
  currentTurn: number,
  intensity: 'low' | 'medium' | 'high' | 'extreme'
): DemonlordSkill | null {
  if (availableSkills.length === 0) return null;

  const weightedSkills = [...availableSkills];
  
  if (intensity === 'extreme' || intensity === 'high') {
    const signatureSkills = availableSkills.filter(s => s.type === 'signature');
    if (signatureSkills.length > 0) {
      return signatureSkills[Math.floor(Math.random() * signatureSkills.length)] || null;
    }
  }

  if (currentTurn % 4 === 0) {
    const shiftSkills = availableSkills.filter(s => s.type === 'elemental_shift' || s.type === 'floor_manager');
    if (shiftSkills.length > 0) {
      return shiftSkills[Math.floor(Math.random() * shiftSkills.length)] || null;
    }
  }

  const combatSkills = availableSkills.filter(s => s.type === 'signature' || s.type === 'aoe');
  return combatSkills.length > 0 
    ? combatSkills[Math.floor(Math.random() * combatSkills.length)] || null
    : availableSkills[Math.floor(Math.random() * availableSkills.length)] || null;
}

export function issueChallenge(
  state: DemonlordState,
  challengerId: string,
  challengerName: string,
  currentTime: number
): DemonlordState {
  const existingChallenge = state.pendingChallenges.find(c => c.challengerId === challengerId);
  if (existingChallenge) return state;

  const newChallenge = {
    challengerId,
    challengerName,
    issuedAt: currentTime,
  };

  return {
    ...state,
    pendingChallenges: [...state.pendingChallenges, newChallenge],
  };
}

export function acceptChallenge(
  state: DemonlordState,
  currentTime: number
): DemonlordState {
  if (state.pendingChallenges.length === 0) return state;

  const challenge = state.pendingChallenges[0];
  if (!challenge) return state;

  return {
    ...state,
    activeChallenge: {
      challengerId: challenge.challengerId,
      challengerName: challenge.challengerName,
      acceptedAt: currentTime,
    },
    pendingChallenges: state.pendingChallenges.slice(1),
  };
}

export function resolveChallenge(
  state: DemonlordState,
  victorId: string,
  currentTime: number
): DemonlordState {
  const isDemonlordVictory = victorId !== state.activeChallenge?.challengerId;

  if (isDemonlordVictory) {
    return {
      ...state,
      activeChallenge: undefined,
    };
  }

  const winnerName = state.activeChallenge?.challengerName;
  return {
    ...state,
    currentLordPlayerId: victorId,
    currentLordPlayerName: winnerName,
    activeChallenge: undefined,
    defeatedAt: currentTime,
  };
}

export function applyDemonlordBonuses(
  baseStats: Record<string, number>,
  demonlordInfluence: number
): Record<string, number> {
  const influenceMultiplier = 1 + (demonlordInfluence / 100);
  
  return {
    ...baseStats,
    damage_dealt_pct: (baseStats.damage_dealt_pct || 0) + Math.floor(demonlordInfluence * 0.5),
    damage_taken_pct: (baseStats.damage_taken_pct || 0) - Math.floor(demonlordInfluence * 0.3),
    dungeon_speed_pct: (baseStats.dungeon_speed_pct || 0) - Math.floor(demonlordInfluence * 0.2),
  };
}

export function decayDemonlordInfluence(
  state: DemonlordState,
  hoursPassed: number
): DemonlordState {
  const decayAmount = state.influenceDecayRate * hoursPassed * (state.isActive ? 1 : 2);
  const newInfluence = Math.max(0, state.influence - decayAmount);

  return {
    ...state,
    influence: newInfluence,
  };
}

export function getDemonlordForFloor(floor: number): boolean {
  return floor >= DEMONLORD_FLOOR_MIN;
}