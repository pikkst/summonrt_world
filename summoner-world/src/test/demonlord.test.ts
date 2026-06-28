import { describe, it, expect } from 'vitest';
import {
  createDemonlordState,
  updateFloorActivity,
  calculateDemonlordInfluence,
  selectDemonlordSkill,
  issueChallenge,
  acceptChallenge,
  resolveChallenge,
  applyDemonlordBonuses,
  decayDemonlordInfluence,
  getDemonlordForFloor,
  DEMONLORD_SKILLS,
  FloorActivity,
} from '../core/demonlord';
import type { DemonlordState } from '../types/game';

describe('createDemonlordState', () => {
  it('creates initial state with default values', () => {
    const state = createDemonlordState();
    expect(state.isActive).toBe(true);
    expect(state.floorMin).toBe(50);
    expect(state.floorMax).toBe(100);
    expect(state.influence).toBe(100);
    expect(state.skills).toHaveLength(5);
    expect(state.pendingChallenges).toHaveLength(0);
  });

  it('includes all expected demonlord skills', () => {
    const state = createDemonlordState();
    const skillKeys = state.skills.map(s => s.key);
    expect(skillKeys).toContain('hellfire_blast');
    expect(skillKeys).toContain('void_corruption');
    expect(skillKeys).toContain('demon_rift');
    expect(skillKeys).toContain('infernal_shift');
    expect(skillKeys).toContain('shadow_veil');
  });
});

describe('updateFloorActivity', () => {
  it('increments player count on entry', () => {
    const current: FloorActivity = { playerCount: 3, recentActivity: 0, lastUpdate: 0 };
    const updated = updateFloorActivity(current, 1, 1000);
    expect(updated.playerCount).toBe(4);
  });

  it('decrements player count on exit', () => {
    const current: FloorActivity = { playerCount: 3, recentActivity: 0, lastUpdate: 0 };
    const updated = updateFloorActivity(current, -1, 1000);
    expect(updated.playerCount).toBe(2);
  });

  it('does not allow negative player count', () => {
    const current: FloorActivity = { playerCount: 0, recentActivity: 0, lastUpdate: 0 };
    const updated = updateFloorActivity(current, -1, 1000);
    expect(updated.playerCount).toBe(0);
  });

  it('updates recent activity based on player count delta', () => {
    const current: FloorActivity = { playerCount: 5, recentActivity: 100, lastUpdate: 1000 };
    const updated = updateFloorActivity(current, 2, 2000);
    expect(updated.recentActivity).toBeGreaterThan(100);
  });
});

describe('calculateDemonlordInfluence', () => {
  it('returns higher influence with fewer players', () => {
    const lowPlayers: FloorActivity = { playerCount: 0, recentActivity: 0, lastUpdate: Date.now() };
    const highPlayers: FloorActivity = { playerCount: 10, recentActivity: 0, lastUpdate: Date.now() };
    
    const lowResult = calculateDemonlordInfluence(lowPlayers, 100);
    const highResult = calculateDemonlordInfluence(highPlayers, 100);
    
    expect(lowResult.influence).toBeGreaterThan(highResult.influence);
  });

  it('returns higher influence with lower recent activity', () => {
    const lowActivity: FloorActivity = { playerCount: 5, recentActivity: 0, lastUpdate: Date.now() };
    const highActivity: FloorActivity = { playerCount: 5, recentActivity: 100, lastUpdate: Date.now() };
    
    const lowResult = calculateDemonlordInfluence(lowActivity, 100);
    const highResult = calculateDemonlordInfluence(highActivity, 100);
    
    expect(lowResult.influence).toBeGreaterThan(highResult.influence);
  });

  it('sets intensity based on influence level', () => {
    const activity: FloorActivity = { playerCount: 0, recentActivity: 0, lastUpdate: Date.now() };
    const result = calculateDemonlordInfluence(activity, 100);
    
    if (result.influence > 80) {
      expect(result.intensity).toBe('extreme');
    } else if (result.influence > 50) {
      expect(result.intensity).toBe('high');
    } else if (result.influence > 25) {
      expect(result.intensity).toBe('medium');
    } else {
      expect(result.intensity).toBe('low');
    }
  });

  it('shouldSpawn is true when influence is high and players are low', () => {
    const activity: FloorActivity = { playerCount: 2, recentActivity: 0, lastUpdate: Date.now() };
    const result = calculateDemonlordInfluence(activity, 100);
    
    expect(result.shouldSpawn).toBe(result.influence > 30 && activity.playerCount < 8);
  });

  it('influence scales between 0 and 100', () => {
    const activity: FloorActivity = { playerCount: 5, recentActivity: 50, lastUpdate: Date.now() };
    const result = calculateDemonlordInfluence(activity, 100);
    
    expect(result.influence).toBeGreaterThanOrEqual(0);
    expect(result.influence).toBeLessThanOrEqual(100);
  });
});

describe('selectDemonlordSkill', () => {
  it('returns a skill when available skills exist', () => {
    const skill = selectDemonlordSkill(DEMONLORD_SKILLS, 1, 'high');
    expect(skill).not.toBeNull();
  });

  it('returns null when no skills available', () => {
    const skill = selectDemonlordSkill([], 1, 'high');
    expect(skill).toBeNull();
  });

  it('prioritizes signature skills in extreme/high intensity', () => {
    const skillsWithSignature = [
      ...DEMONLORD_SKILLS,
      { key: 'random_skill', name: 'Random', description: '', element: 'fire' as const, power: 5, cost: 0, type: 'debuff' as const },
    ];
    
    const selectedSkill = selectDemonlordSkill(skillsWithSignature, 1, 'extreme');
    expect(selectedSkill?.type).toBe('signature');
  });

  it('selects elemental shift skills every 4 turns', () => {
    const selectedSkill = selectDemonlordSkill(DEMONLORD_SKILLS, 4, 'medium');
    expect(['elemental_shift', 'floor_manager']).toContain(selectedSkill?.type);
  });

  it('returns a skill with valid type', () => {
    const skill = selectDemonlordSkill(DEMONLORD_SKILLS, 2, 'medium');
    expect(['signature', 'elemental_shift', 'floor_manager', 'aoe', 'debuff']).toContain(skill?.type);
  });
});

describe('issueChallenge', () => {
  it('adds challenger to pending challenges', () => {
    const state = createDemonlordState();
    const updated = issueChallenge(state, 'player_123', 'TestPlayer', Date.now());
    
    expect(updated.pendingChallenges).toHaveLength(1);
    expect(updated.pendingChallenges[0]?.challengerId).toBe('player_123');
    expect(updated.pendingChallenges[0]?.challengerName).toBe('TestPlayer');
  });

  it('does not add duplicate challenges from same player', () => {
    const state = createDemonlordState();
    const updated1 = issueChallenge(state, 'player_123', 'TestPlayer', Date.now());
    const updated2 = issueChallenge(updated1, 'player_123', 'TestPlayer', Date.now());
    
    expect(updated2.pendingChallenges).toHaveLength(1);
  });

  it('allows multiple different challengers', () => {
    const state = createDemonlordState();
    const time = Date.now();
    const updated1 = issueChallenge(state, 'player_1', 'Player1', time);
    const updated2 = issueChallenge(updated1, 'player_2', 'Player2', time + 1000);
    
    expect(updated2.pendingChallenges).toHaveLength(2);
  });
});

describe('acceptChallenge', () => {
  it('moves pending challenge to active Challenge', () => {
    const state = createDemonlordState();
    const time = Date.now();
    const withChallenge = issueChallenge(state, 'player_123', 'TestPlayer', time);
    const accepted = acceptChallenge(withChallenge, Date.now() + 1000);
    
    expect(accepted.activeChallenge?.challengerId).toBe('player_123');
    expect(accepted.pendingChallenges).toHaveLength(0);
  });

  it('returns unchanged state when no pending challenges', () => {
    const state = createDemonlordState();
    const accepted = acceptChallenge(state, Date.now());
    
    expect(accepted.activeChallenge).toBeUndefined();
  });
});

describe('resolveChallenge', () => {
  it('sets player as winner when defeating demonlord', () => {
    const state: DemonlordState = {
      ...createDemonlordState(),
      currentLordPlayerId: undefined,
      activeChallenge: {
        challengerId: 'player_123',
        challengerName: 'TestPlayer',
        acceptedAt: Date.now(),
      },
    };
    
    const resolved = resolveChallenge(state, 'player_123', Date.now());
    
    expect(resolved.currentLordPlayerId).toBe('player_123');
    expect(resolved.currentLordPlayerName).toBe('TestPlayer');
  });

  it('clears active challenge when demonlord wins', () => {
    const state: DemonlordState = {
      ...createDemonlordState(),
      activeChallenge: {
        challengerId: 'player_123',
        challengerName: 'TestPlayer',
        acceptedAt: Date.now(),
      },
    };
    
    const resolved = resolveChallenge(state, 'demonlord', Date.now());
    
    expect(resolved.activeChallenge).toBeUndefined();
    expect(resolved.currentLordPlayerId).toBeUndefined();
  });
});

describe('applyDemonlordBonuses', () => {
  it('boosts damage_dealt_pct based on influence', () => {
    const baseStats = { damage_dealt_pct: 10 };
    const boosted = applyDemonlordBonuses(baseStats, 50);
    
    expect(boosted.damage_dealt_pct).toBeGreaterThan(10);
  });

  it('reduces damage_taken_pct based on influence', () => {
    const baseStats = { damage_taken_pct: 0 };
    const boosted = applyDemonlordBonuses(baseStats, 50);
    
    expect(boosted.damage_taken_pct).toBeLessThan(0);
  });

  it('preserves existing stats not modified', () => {
    const baseStats = { damage_dealt_pct: 10, capture_rate_pct: 20 };
    const boosted = applyDemonlordBonuses(baseStats, 50);
    
    expect(boosted.capture_rate_pct).toBe(20);
  });

  it('applies correct influence multiplier', () => {
    const baseStats = { damage_dealt_pct: 0 };
    const result = applyDemonlordBonuses(baseStats, 100);
    
    expect(result.damage_dealt_pct).toBe(50);
  });
});

describe('decayDemonlordInfluence', () => {
  it('decreases influence over time', () => {
    const state = createDemonlordState();
    const decayed = decayDemonlordInfluence(state, 10);
    
    expect(decayed.influence).toBeLessThan(100);
  });

  it('influence cannot go below 0', () => {
    let state = createDemonlordState();
    state = { ...state, influence: 5 };
    const decayed = decayDemonlordInfluence(state, 10);
    
    expect(decayed.influence).toBeGreaterThanOrEqual(0);
  });

  it('decay rate is applied per hour', () => {
    const state = createDemonlordState();
    const decayed = decayDemonlordInfluence(state, 1);
    
    expect(decayed.influence).toBe(99.9);
  });
});

describe('getDemonlordForFloor', () => {
  it('returns true for floors 50-100', () => {
    expect(getDemonlordForFloor(50)).toBe(true);
    expect(getDemonlordForFloor(75)).toBe(true);
    expect(getDemonlordForFloor(100)).toBe(true);
  });

  it('returns false for floors below 50', () => {
    expect(getDemonlordForFloor(1)).toBe(false);
    expect(getDemonlordForFloor(49)).toBe(false);
  });

  it('returns false for floors above 100', () => {
    expect(getDemonlordForFloor(101)).toBe(false);
    expect(getDemonlordForFloor(150)).toBe(false);
  });
});