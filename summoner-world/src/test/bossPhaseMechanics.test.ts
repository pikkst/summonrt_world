import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../stores/gameStore';
import { applyDamageTakenReduction, applyCombatCareerBonuses, getCareerSystemBonuses } from '../data/careerTreeIntegration';
import type { CareerSystemBonuses } from '../data/careerTreeIntegration';

describe('T6.5 Boss Phase Mechanics', () => {
  beforeEach(() => {
    useGameStore.setState({
      combat: {
        active: false,
        phase: 'player_turn',
        log: [],
        enemyName: '',
        enemyHp: 0,
        enemyMaxHp: 0,
        enemyTemplate: null,
        playerCreatureId: '',
        turns: 0,
      },
      player: null,
    });
  });

  it('applies environmental hazard damage during boss combat', () => {
    useGameStore.setState({
      combat: {
        active: true,
        phase: 'player_turn',
        log: ['A wild Test Boss appears! It looks ready to fight.'],
        enemyName: 'Test Boss',
        enemyHp: 100,
        enemyMaxHp: 100,
        enemyTemplate: {
          key: 'test_boss',
          name: 'Test Boss',
          class: 'epic',
          type: 'demon',
          elements: ['fire'],
          baseHealth: 100,
          baseAttack: 10,
          baseDefense: 5,
          baseSpeed: 5,
          baseMana: 10,
          baseExpValue: 20,
          skills: [],
          description: 'A test boss',
          isBoss: true,
        },
        playerCreatureId: 'creature1',
        turns: 0,
        isBoss: true,
        bossPhasesTriggered: [false, false, false],
        activeBossElement: 'fire',
        activeHazard: {
          key: 'lava_burst',
          name: 'Lava Burst',
          element: 'fire',
          description: 'Lava bursts erupt from the ground!',
          baseDamage: 8,
        },
        encounterType: 'normal',
      },
      player: {
        id: 'player1',
        name: 'Test Player',
        gender: 'other',
        appearance: {},
        affinity: { primary: 'fire' },
        level: 1,
        experience: 0n,
        money: 0,
        archetype: 'summoner',
        isOnline: false,
        skillPoints: 0,
        skillsUnlocked: {},
        unspent_passive_points: 0,
        unlocked_node_ids: ['root_hub', 'summoner_elite_2'],
        energy: { current: 100, max: 100, lastUpdate: '' },
        nerve: { current: 100, max: 100, lastUpdate: '' },
        happy: { current: 100, max: 100, lastUpdate: '' },
        life: { current: 100, max: 100, lastUpdate: '' },
        strength: 10,
        defense: 5,
        speed: 5,
        dexterity: 5,
        currentWorldId: 1,
        tileX: 0,
        tileY: 0,
        dayCount: 1,
        gameTimeMinutes: 360,
        creatures: [
          {
            id: 'creature1',
            templateKey: 'test',
            nickname: 'Testy',
            elements: ['fire'],
            level: 1,
            experience: 0n,
            currentHealth: 50,
            currentMana: 10,
            maxHealth: 50,
            maxMana: 10,
            attack: 10,
            defense: 5,
            speed: 5,
            skills: [],
            traits: [],
            mutations: [],
            affection: 0,
          },
        ],
        inventory: [],
        activeQuests: [],
        completedQuests: [],
        discoveredTiles: new Set(),
        settings: {
          musicVolume: 50,
          sfxVolume: 50,
          showLogTimestamps: false,
        },
      } as any,
    });

    const initialHealth = useGameStore.getState().player!.creatures[0]!.currentHealth;
    useGameStore.getState().applyEnvironmentalHazardDamage();
    const finalHealth = useGameStore.getState().player!.creatures[0]!.currentHealth;

    expect(finalHealth).toBeLessThan(initialHealth);
    const combatLog = useGameStore.getState().combat.log;
    expect(combatLog.some(l => l.includes('Lava Burst'))).toBe(true);
  });

  it('rotates through hazard types across boss phases', () => {
    useGameStore.setState({
      combat: {
        active: true,
        phase: 'player_turn',
        log: [],
        enemyName: 'Test Boss',
        enemyHp: 100,
        enemyMaxHp: 100,
        enemyTemplate: {
          key: 'test_boss',
          name: 'Test Boss',
          class: 'epic',
          type: 'demon',
          elements: ['fire'],
          baseHealth: 100,
          baseAttack: 10,
          baseDefense: 5,
          baseSpeed: 5,
          baseMana: 10,
          baseExpValue: 20,
          skills: [],
          description: 'A test boss',
          isBoss: true,
        },
        playerCreatureId: '',
        turns: 0,
        isBoss: true,
        bossPhasesTriggered: [false, false, false],
        activeBossElement: 'fire',
        activeHazard: undefined,
        encounterType: 'normal',
      },
      player: null,
    });

    useGameStore.setState({
      combat: {
        ...useGameStore.getState().combat,
        enemyHp: 70,
      },
    });
    useGameStore.getState().applyBossPhaseMechanics();
    const hazard1 = useGameStore.getState().combat.activeHazard?.key;

    useGameStore.setState({
      combat: {
        ...useGameStore.getState().combat,
        enemyHp: 45,
      },
    });
    useGameStore.getState().applyBossPhaseMechanics();
    const hazard2 = useGameStore.getState().combat.activeHazard?.key;

    useGameStore.setState({
      combat: {
        ...useGameStore.getState().combat,
        enemyHp: 20,
      },
    });
    useGameStore.getState().applyBossPhaseMechanics();
    const hazard3 = useGameStore.getState().combat.activeHazard?.key;

    expect(hazard1).toBe('lava_burst');
    expect(hazard2).toBe('frost_spikes');
    expect(hazard3).toBe('storm_pulse');
  });

  it('Summoner career bonus reduces environmental hazard damage', () => {
    const bonuses: CareerSystemBonuses = {
      damage_taken_pct: -5,
    };

    const baseDamage = 10;
    const reducedDamage = applyDamageTakenReduction(baseDamage, bonuses);
    expect(reducedDamage).toBeLessThan(baseDamage);

    const noBonus = applyDamageTakenReduction(baseDamage, {});
    expect(noBonus).toBe(baseDamage);
  });

  it('Summoner damage_dealt_pct increases player damage in combat calculations', () => {
    const bonuses: CareerSystemBonuses = {
      damage_dealt_pct: 5,
    };

    const baseDamage = 100;
    const boostedDamage = applyCombatCareerBonuses(baseDamage, bonuses);
    expect(boostedDamage).toBeGreaterThan(baseDamage);
  });

  it('activates Summoner career bonuses for damage calculations', () => {
    const bonuses: CareerSystemBonuses = {
      damage_dealt_pct: 5,
      damage_taken_pct: -5,
    };

    const rawDamage = 10;
    const dealtDamage = applyDamageTakenReduction(rawDamage, bonuses);
    expect(dealtDamage).toBeLessThan(rawDamage);
  });
});
