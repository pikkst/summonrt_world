import { describe, expect, it } from 'vitest';
import type { PlayerCoreState } from '../types/playerCore';
import type { Structure } from '../types/structure';
import {
  MAX_EQUIPMENT_DURABILITY,
  REPAIR_COST_PER_DURABILITY,
  applyEquipmentWear,
  applyFusionMaterialDecay,
  calculateHousingTax,
  getEquipmentRepairCost,
  isFusionMaterial,
  repairEquipmentSlot,
} from '../core/economy/inflationSinks';

function createMockPlayerCore(overrides: Partial<PlayerCoreState> = {}): PlayerCoreState {
  return {
    identity: { id: 'player-1', name: 'Test', gender: 'unknown', appearance: {} },
    summonerProfile: { class: 'elementalist', archetype: 'summoner', startingWorldId: 1 },
    level: 1,
    experience: 0n,
    elements: { primary: 'fire' },
    class: 'elementalist',
    primaryStats: {
      strength: 10, vitality: 10, intelligence: 10, dexterity: 10, wisdom: 10, luck: 10,
    },
    secondaryStats: {
      maxHealth: 100, maxMana: 100, maxStamina: 100, movement: 100, criticalChance: 5,
      elementalMastery: 0, contractCapacity: 3, commandSpeed: 100, creatureBondPower: 100,
      inventoryCapacity: 50, craftingEfficiency: 100, tradeInfluence: 100, reputationGain: 100,
      summoningCost: 100, travelUtility: 100,
    },
    inventory: [],
    equipment: [],
    skills: [], talents: [], titles: [], achievements: [],
    statistics: {
      worldsUnlocked: 1, creaturesContracted: 0, dungeonsCleared: 0, itemsCrafted: 0,
      tradesCompleted: 0, goldEarned: 0, bossesDefeated: 0, pvpWins: 0, housingValue: 0,
      guildContributions: 0, questsCompleted: 0,
    },
    reputation: { world_rep: {}, faction_rep: {}, settlement_rep: {}, creature_rep: {} },
    questHistory: { active: [], completed: [] },
    creatureContracts: [],
    creatureSlots: {
      groups: [
        { type: 'active_combat', max: 3, assigned: [] },
        { type: 'reserve', max: 3, assigned: [] },
        { type: 'utility', max: 2, assigned: [] },
        { type: 'housing', max: 2, assigned: [] },
        { type: 'marketplace', max: 1, assigned: [] },
        { type: 'breeding', max: 1, assigned: [] },
      ],
    },
    housing: { structures: [] },
    worldUnlocks: { unlockedWorlds: [1], activeWorldId: 1 },
    fastTravel: { points: [], discoveredPointIds: new Set(), activeTravel: undefined },
    saveMetadata: { lastSavedAt: '', playtimeSeconds: 0, saveVersion: '2.0.0' },
    resources: {
      energy: { current: 100, max: 100, lastUpdate: '' },
      nerve: { current: 15, max: 15, lastUpdate: '' },
      happy: { current: 100, max: 100, lastUpdate: '' },
      life: { current: 100, max: 100, lastUpdate: '' },
    },
    position: { worldId: 1, x: 10, y: 10 },
    settings: { musicVolume: 0.5, sfxVolume: 0.5, showLogTimestamps: true },
    money: 1000,
    skillPoints: 0,
    dayCount: 1,
    gameTimeMinutes: 420,
    ...overrides,
  };
}

function createStructure(type: Structure['type'], passiveIncomeRate: number): Structure {
  return {
    id: `structure-${type}`,
    type,
    worldId: 1,
    tileX: 100,
    tileY: 100,
    level: 1,
    builtAt: 0,
    ownerId: 'player-1',
    ...({ passiveIncomeRate } as object),
  } as Structure;
}

describe('T8.13 - Inflation Sinks', () => {
  describe('Housing taxes', () => {
    it('returns 0 tax for no structures', () => {
      expect(calculateHousingTax([])).toBe(0);
    });

    it('applies HOUSING_TAX_RATE_PCT to base passive income', () => {
      const structures = [createStructure('town', 30), createStructure('castle', 15)];
      expect(calculateHousingTax(structures)).toBe(Math.floor(45 * 0.1));
    });

    it('never produces negative tax', () => {
      const structures = [createStructure('house', 1)];
      expect(calculateHousingTax(structures)).toBe(0);
    });
  });

  describe('Equipment repair costs', () => {
    it('reduces durability on combat wear', () => {
      const equipment = [
        { slot: 'weapon' as const, itemKey: 'iron_sword', quantity: 1, durability: 100 },
        { slot: 'head' as const, quantity: 0 },
      ];
      const worn = applyEquipmentWear(equipment, 10);
      expect(worn[0]?.durability).toBe(90);
      expect(worn[1]?.durability).toBeUndefined();
    });

    it('clamps durability at 0', () => {
      const equipment = [{ slot: 'weapon' as const, itemKey: 'iron_sword', quantity: 1, durability: 3 }];
      const worn = applyEquipmentWear(equipment, 10);
      expect(worn[0]?.durability).toBe(0);
    });

    it('treats missing durability as full when worn', () => {
      const equipment = [{ slot: 'weapon' as const, itemKey: 'iron_sword', quantity: 1 }];
      const worn = applyEquipmentWear(equipment, 10);
      expect(worn[0]?.durability).toBe(MAX_EQUIPMENT_DURABILITY - 10);
    });

    it('computes repair cost from missing durability', () => {
      const equipment = [{ slot: 'weapon' as const, itemKey: 'iron_sword', quantity: 1, durability: 50 }];
      expect(getEquipmentRepairCost(equipment, 'weapon')).toBe(50 * REPAIR_COST_PER_DURABILITY);
    });

    it('repairs a slot fully when affordable', () => {
      const player = createMockPlayerCore({
        money: 1000,
        equipment: [{ slot: 'weapon', itemKey: 'iron_sword', quantity: 1, durability: 50 }],
      });
      const result = repairEquipmentSlot(player, 'weapon');
      expect(result.repaired).toBe(true);
      expect(result.playerCore.money).toBe(1000 - 50 * REPAIR_COST_PER_DURABILITY);
      const slot = result.playerCore.equipment.find((s) => s.slot === 'weapon');
      expect(slot?.durability).toBe(MAX_EQUIPMENT_DURABILITY);
    });

    it('partially repairs when money is insufficient', () => {
      const player = createMockPlayerCore({
        money: 5,
        equipment: [{ slot: 'weapon', itemKey: 'iron_sword', quantity: 1, durability: 50 }],
      });
      const result = repairEquipmentSlot(player, 'weapon');
      expect(result.repaired).toBe(true);
      expect(result.playerCore.money).toBe(1);
      expect(result.restoredDurability).toBe(2);
    });

    it('does not repair already full equipment', () => {
      const player = createMockPlayerCore({
        money: 1000,
        equipment: [{ slot: 'weapon', itemKey: 'iron_sword', quantity: 1, durability: 100 }],
      });
      const result = repairEquipmentSlot(player, 'weapon');
      expect(result.repaired).toBe(false);
      expect(result.playerCore.money).toBe(1000);
    });
  });

  describe('Fusion material decay', () => {
    it('identifies soul crystal items as fusion materials', () => {
      expect(isFusionMaterial('soul_crystal_common')).toBe(true);
      expect(isFusionMaterial('iron_ingot')).toBe(false);
    });

    it('does not decay fusion materials when rng fails', () => {
      const inventory = [{ templateKey: 'soul_crystal_common', quantity: 10, category: 'contract' as const, rarity: 'common' as const, binding: 'tradeable' as const, addedAt: 0 }];
      const result = applyFusionMaterialDecay(inventory, () => 0.99);
      expect(result[0]?.quantity).toBe(10);
    });

    it('decays fusion materials by one per successful roll', () => {
      const inventory = [{ templateKey: 'soul_crystal_common', quantity: 10, category: 'contract' as const, rarity: 'common' as const, binding: 'tradeable' as const, addedAt: 0 }];
      const result = applyFusionMaterialDecay(inventory, () => 0.001);
      expect(result[0]?.quantity).toBe(9);
    });

    it('removes fusion material stacks that reach zero', () => {
      const inventory = [{ templateKey: 'soul_crystal_common', quantity: 1, category: 'contract' as const, rarity: 'common' as const, binding: 'tradeable' as const, addedAt: 0 }];
      const result = applyFusionMaterialDecay(inventory, () => 0.001);
      expect(result.find((i) => i.templateKey === 'soul_crystal_common')).toBeUndefined();
    });

    it('does not affect non-fusion materials', () => {
      const inventory = [{ templateKey: 'iron_ingot', quantity: 10, category: 'material' as const, rarity: 'common' as const, binding: 'tradeable' as const, addedAt: 0 }];
      const result = applyFusionMaterialDecay(inventory, () => 0.001);
      expect(result[0]?.quantity).toBe(10);
    });
  });
});
