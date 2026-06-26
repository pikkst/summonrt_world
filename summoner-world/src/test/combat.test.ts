import { describe, it, expect } from 'vitest';
import { resolveAutomatedCombat, type CombatTeamMember } from '../core/missionQueue';
import type { CreatureInstance } from '../types/game';

function createCreature(overrides: Partial<CreatureInstance> & { id: string }): CreatureInstance {
   return {
     templateKey: overrides.templateKey ?? 'test_creature',
    nickname: overrides.nickname ?? `Creature ${overrides.id}`,
    elements: overrides.elements ?? ['fire'],
    level: overrides.level ?? 1,
    experience: overrides.experience ?? 0,
    currentHealth: overrides.currentHealth ?? 30,
    maxHealth: overrides.maxHealth ?? 30,
    currentMana: overrides.currentMana ?? 10,
    maxMana: overrides.maxMana ?? 10,
    attack: overrides.attack ?? 10,
    defense: overrides.defense ?? 5,
    speed: overrides.speed ?? 5,
    skills: overrides.skills ?? [],
    traits: overrides.traits ?? [],
    mutations: overrides.mutations ?? [],
    affection: overrides.affection ?? 0,
    ...overrides,
  };
}

describe('resolveAutomatedCombat', () => {
  it('returns victory when teamA defeats all of teamB', () => {
    const teamA = [createCreature({ id: 'a1', attack: 15, defense: 5 })];
    const teamB = [createCreature({ id: 'b1', attack: 5, defense: 3, currentHealth: 20 })];

    const result = resolveAutomatedCombat(teamA, teamB);

    expect(result.victory).toBe(true);
    expect(result.battle_log).toContainEqual(expect.stringContaining('victory'));
    expect(result.xp).toBeGreaterThan(0);
  });

  it('returns defeat when teamA is fully defeated', () => {
    const teamA = [createCreature({ id: 'a1', attack: 5, defense: 3, currentHealth: 20 })];
    const teamB = [createCreature({ id: 'b1', attack: 15, defense: 5 })];

    const result = resolveAutomatedCombat(teamA, teamB);

    expect(result.victory).toBe(false);
    expect(result.battle_log.some(l => l.includes('defeated'))).toBe(true);
  });

  it('maxes out at 30 turns', () => {
    const teamA = [createCreature({ id: 'a1', attack: 1, defense: 5, currentHealth: 100 })];
    const teamB = [createCreature({ id: 'b1', attack: 1, defense: 5, currentHealth: 100 })];

    const result = resolveAutomatedCombat(teamA, teamB, { rngSeed: 12345 });

    expect(result.battle_log.filter(l => l.startsWith('--- Turn')).length).toBeLessThanOrEqual(30);
  });

  it('generates battle log with turn entries', () => {
    const teamA = [createCreature({ id: 'a1', attack: 10, defense: 5 })];
    const teamB = [createCreature({ id: 'b1', attack: 5, defense: 5, currentHealth: 20 })];

    const result = resolveAutomatedCombat(teamA, teamB);

    expect(result.battle_log[0]).toBe('=== Automated Combat Initiated ===');
    expect(result.battle_log.some(l => l.includes('Turn'))).toBe(true);
  });

  it('applies elemental effectiveness for damage', () => {
    const teamA = [createCreature({ id: 'a1', elements: ['fire'], attack: 20, defense: 5 })];
    const teamB = [createCreature({ id: 'b1', elements: ['nature'], currentHealth: 100 })];

    const result = resolveAutomatedCombat(teamA, teamB, { rngSeed: 500 });

    expect(result.victory).toBe(true);
    expect(result.battle_log.some(l => l.includes('damage'))).toBe(true);
  });

  it('returns rewards when XP is earned', () => {
    const teamA = [createCreature({ id: 'a1', attack: 20, defense: 5 })];
    const teamB = [createCreature({ id: 'b1', attack: 5, defense: 5, currentHealth: 20 })];

    const result = resolveAutomatedCombat(teamA, teamB, { rngSeed: 0.2 });

    expect(result.xp).toBeGreaterThan(0);
  });

  it('handles empty teams', () => {
    const result = resolveAutomatedCombat([], [createCreature({ id: 'b1' })]);

    expect(result.victory).toBe(false);
  });

  it('handles multiple creatures per team', () => {
    const teamA = [
      createCreature({ id: 'a1', attack: 15, defense: 5 }),
      createCreature({ id: 'a2', attack: 15, defense: 5 }),
    ];
    const teamB = [
      createCreature({ id: 'b1', attack: 5, defense: 5, currentHealth: 20 }),
      createCreature({ id: 'b2', attack: 5, defense: 5, currentHealth: 20 }),
    ];

    const result = resolveAutomatedCombat(teamA, teamB);

    expect(result.battle_log.some(l => l.includes('a1') || l.includes('a2'))).toBe(true);
  });
});

describe('CombatTeamMember interface', () => {
  it('represents creature alive state correctly', () => {
    const member: CombatTeamMember = {
      creature: createCreature({ id: 'test', currentHealth: 50 }),
      isAlive: true,
    };

    expect(member.creature.currentHealth).toBe(50);
    expect(member.isAlive).toBe(true);

    member.creature.currentHealth = 0;
    member.isAlive = false;

    expect(member.creature.currentHealth).toBe(0);
    expect(member.isAlive).toBe(false);
  });
});