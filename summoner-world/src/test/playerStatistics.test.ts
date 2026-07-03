import { describe, it, expect } from 'vitest';
import { createDefaultPlayerCoreState } from '../core/playerCore/index';
import { calculatePrimaryStats, calculateSecondaryStats, recalculateAllStats } from '../core/playerCore/playerStatistics';
import type { PlayerPrimaryStats, EquipmentSlot, SummonerClass } from '../types/playerCore';

describe('Player Statistics - Primary Stats', () => {
  it('calculates default primary stats for level 1 player', () => {
    const stats = calculatePrimaryStats('elementalist', 1);
    
    expect(stats.strength).toBe(10);
    expect(stats.vitality).toBe(10);
    expect(stats.intelligence).toBe(12);
    expect(stats.dexterity).toBe(11);
    expect(stats.wisdom).toBe(11);
    expect(stats.luck).toBe(10);
  });

  it('applies class stat modifiers correctly', () => {
    const beastBinderStats = calculatePrimaryStats('beast_binder', 1);
    expect(beastBinderStats.strength).toBe(12);
    expect(beastBinderStats.dexterity).toBe(11);

    const wardenStats = calculatePrimaryStats('warden', 1);
    expect(wardenStats.vitality).toBe(12);
    expect(wardenStats.strength).toBe(11);

    const duelistStats = calculatePrimaryStats('duelist', 1);
    expect(duelistStats.strength).toBe(12);
    expect(duelistStats.dexterity).toBe(11);
  });

  it('applies level scaling to primary stats', () => {
    const level1Stats = calculatePrimaryStats('elementalist', 1);
    const level25Stats = calculatePrimaryStats('elementalist', 25);
    
    expect(level25Stats.strength).toBeGreaterThan(level1Stats.strength);
    expect(level25Stats.vitality).toBeGreaterThan(level1Stats.vitality);
  });

  it('returns deterministic stats for same class and level', () => {
    const stats1 = calculatePrimaryStats('elementalist', 5);
    const stats2 = calculatePrimaryStats('elementalist', 5);
    
    expect(stats1).toEqual(stats2);
  });

  it('creates PlayerCoreState with primary and secondary stats', () => {
    const core = createDefaultPlayerCoreState('Test Summoner', { archetype: 'elementalist' });
    
    expect(core.primaryStats).toBeDefined();
    expect(core.primaryStats.strength).toBe(10);
    expect(core.primaryStats.intelligence).toBe(12);
    
    expect(core.secondaryStats).toBeDefined();
    expect(core.secondaryStats.maxHealth).toBeGreaterThan(100);
    expect(core.secondaryStats.maxMana).toBeGreaterThan(50);
    expect(core.secondaryStats.elementalMastery).toBeGreaterThan(10);
  });
});

describe('Player Statistics - Secondary Stats', () => {
  it('calculates secondary stats from primary stats', () => {
    const primaryStats: PlayerPrimaryStats = {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    };
    
    const secondary = calculateSecondaryStats(primaryStats, []);
    
    expect(secondary.maxHealth).toBe(150);
    expect(secondary.maxMana).toBe(80);
    expect(secondary.maxStamina).toBe(140);
    expect(secondary.movement).toBe(6);
    expect(secondary.criticalChance).toBe(7);
    expect(secondary.elementalMastery).toBe(18);
    expect(secondary.contractCapacity).toBe(7);
    expect(secondary.commandSpeed).toBe(120);
    expect(secondary.creatureBondPower).toBe(120);
    expect(secondary.inventoryCapacity).toBe(25);
    expect(secondary.craftingEfficiency).toBe(110);
    expect(secondary.tradeInfluence).toBe(115);
    expect(secondary.reputationGain).toBe(110);
  });

  it('applies equipment modifiers to secondary stats', () => {
    const primaryStats: PlayerPrimaryStats = {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    };
    
    const equipment: EquipmentSlot[] = [
      {
        slot: 'weapon',
        quantity: 0,
        modifiers: {
          maxHealth: 50,
          elementalMastery: 20,
          movement: 3,
        },
      },
    ];
    
    const secondary = calculateSecondaryStats(primaryStats, equipment);
    
    expect(secondary.maxHealth).toBe(200);
    expect(secondary.elementalMastery).toBe(38);
    expect(secondary.movement).toBe(9);
  });

  it('includes summoning cost modifier in secondary stats', () => {
    const primaryStats: PlayerPrimaryStats = {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    };
    
    const equipment: EquipmentSlot[] = [
      {
        slot: 'summoner_focus',
        quantity: 0,
        modifiers: {
          summoningCost: -20,
        },
      },
    ];
    
    const secondary = calculateSecondaryStats(primaryStats, equipment);
    expect(secondary.summoningCost).toBe(80);
  });

  it('includes travel utility modifier in secondary stats', () => {
    const primaryStats: PlayerPrimaryStats = {
      strength: 10,
      vitality: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      luck: 10,
    };
    
    const equipment: EquipmentSlot[] = [
      {
        slot: 'amulet',
        quantity: 0,
        modifiers: {
          travelUtility: 15,
        },
      },
    ];
    
    const secondary = calculateSecondaryStats(primaryStats, equipment);
    expect(secondary.travelUtility).toBe(15);
  });

  it('calculates secondary stats deterministically for same primary stats', () => {
    const primaryStats: PlayerPrimaryStats = {
      strength: 15,
      vitality: 12,
      intelligence: 14,
      dexterity: 13,
      wisdom: 11,
      luck: 8,
    };
    
    const secondary1 = calculateSecondaryStats(primaryStats, []);
    const secondary2 = calculateSecondaryStats(primaryStats, []);
    
    expect(secondary1).toEqual(secondary2);
  });

  it('secondary stats scale with vitality for maxHealth', () => {
    const lowVitality: PlayerPrimaryStats = { strength: 10, vitality: 5, intelligence: 10, dexterity: 10, wisdom: 10, luck: 10 };
    const highVitality: PlayerPrimaryStats = { strength: 10, vitality: 20, intelligence: 10, dexterity: 10, wisdom: 10, luck: 10 };
    
    const lowSecondary = calculateSecondaryStats(lowVitality, []);
    const highSecondary = calculateSecondaryStats(highVitality, []);
    
    expect(highSecondary.maxHealth).toBeGreaterThan(lowSecondary.maxHealth);
  });

it('secondary stats scale with intelligence for maxMana', () => {
     const lowInt: PlayerPrimaryStats = { strength: 10, vitality: 10, intelligence: 5, dexterity: 10, wisdom: 10, luck: 10 };
     const highInt: PlayerPrimaryStats = { strength: 10, vitality: 10, intelligence: 20, dexterity: 10, wisdom: 10, luck: 10 };
     
     const lowSecondary = calculateSecondaryStats(lowInt, []);
     const highSecondary = calculateSecondaryStats(highInt, []);
     
     expect(highSecondary.maxMana).toBeGreaterThan(lowSecondary.maxMana);
   });
});

describe('Player Statistics - Stat Recalculation', () => {
   it('recalculateAllStats returns both stat groups', () => {
     const context = {
       level: 10,
       classId: 'elementalist' as SummonerClass,
       equipment: [],
     };
     
     const result = recalculateAllStats(context);
     
     expect(result.primaryStats).toBeDefined();
     expect(result.secondaryStats).toBeDefined();
     expect(result.secondaryStats.maxHealth).toBeGreaterThan(100);
   });

   it('equipment modifiers are applied in recalculateAllStats', () => {
     const context = {
       level: 5,
       classId: 'warden' as SummonerClass,
       equipment: [
         { slot: 'chest' as const, quantity: 0, modifiers: { maxHealth: 100 } },
       ],
     };
     
     const result = recalculateAllStats(context);
     
     expect(result.secondaryStats.maxHealth).toBeGreaterThan(150);
   });

   it('produces deterministic results across multiple calls', () => {
     const context = {
       level: 7,
       classId: 'pathfinder' as SummonerClass,
       equipment: [
         { slot: 'ring_1' as const, quantity: 0, modifiers: { elementalMastery: 15 } },
       ],
     };
     
     const result1 = recalculateAllStats(context);
     const result2 = recalculateAllStats(context);
     
     expect(result1).toEqual(result2);
   });
});