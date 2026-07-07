import { describe, expect, it } from 'vitest';
import {
  applyPlayerStatisticEvent,
  createCharacter,
  createDefaultPlayerCoreState,
  equipItem,
  evaluateAchievements,
  getClassModifiers,
  getElementModifiers,
  getUnlockedTitlesForAchievements,
  refreshTitleAchievementState,
  validatePlayerContractOwnership,
} from '../core/playerCore/index.ts';
import { deserializePlayerCore, serializePlayerCore } from '../modules/save/playerCoreSaveMigration.ts';
import type { CreatureContract, InventoryItem, PlayerCoreState } from '../types/playerCore.ts';

function getAchievement(core: PlayerCoreState, key: string) {
  return core.achievements.find((achievement) => achievement.key === key);
}

describe('T6P.17 Player Core contract tests', () => {
  it('creates a valid PlayerCoreState through character creation', () => {
    const result = createCharacter({
      name: 'T6P Test Summoner',
      className: 'warden',
      startingElement: 'earth',
      startingWorldId: 2,
      contractPathKey: 'golem',
    });

    const core = result.playerCore;

    expect(core.identity.id).toBeTruthy();
    expect(core.identity.name).toBe('T6P Test Summoner');
    expect(core.class).toBe('warden');
    expect(core.summonerProfile.class).toBe('warden');
    expect(core.elements.primary).toBe('earth');
    expect(core.worldUnlocks).toEqual({ unlockedWorlds: [2], activeWorldId: 2 });
    expect(core.level).toBe(1);
    expect(core.experience).toBe(0n);
    expect(core.primaryStats.vitality).toBeGreaterThan(core.primaryStats.intelligence);
    expect(core.secondaryStats.maxHealth).toBeGreaterThan(100);
    expect(core.creatureContracts).toHaveLength(1);
    expect(core.creatureContracts[0]!.id).toBe(result.startingCreature.id);
    expect(validatePlayerContractOwnership(core).valid).toBe(true);
  });

  it('keeps element and class modifier decisions deterministic', () => {
    expect(getClassModifiers('elementalist')).toEqual(getClassModifiers('elementalist'));
    expect(getClassModifiers('elementalist')).toMatchObject({
      statBias: { intelligence: 2, wisdom: 1, dexterity: 1 },
      startingBonus: { items: [{ templateKey: 'mana_crystal', quantity: 5 }] },
    });

    expect(getClassModifiers('warden')).toEqual(getClassModifiers('warden'));
    expect(getClassModifiers('warden')).toMatchObject({
      statBias: { vitality: 2, strength: 1, defense: 1 },
      startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 5 }] },
    });

    expect(getElementModifiers('fire')).toEqual(getElementModifiers('fire'));
    expect(getElementModifiers('fire')).toMatchObject({
      skillDamagePct: 10,
      creatureAffinityPct: 15,
      contractStabilityPct: 5,
      equipmentScalingPct: 8,
    });

    expect(getElementModifiers('light')).toEqual(getElementModifiers('light'));
    expect(getElementModifiers('light')).toMatchObject({
      skillDamagePct: 15,
      creatureAffinityPct: 12,
      contractStabilityPct: 20,
      npcReactionPct: 20,
    });
  });

  it('round-trips inventory and equipment through Player Core save/load', () => {
    const core = createDefaultPlayerCoreState('Round Trip Summoner');
    const playerId = core.identity.id;
    const focus: InventoryItem = {
      templateKey: 'apprentice_focus',
      quantity: 1,
      category: 'equipment',
      rarity: 'uncommon',
      binding: 'bound',
      ownerId: playerId,
      addedAt: 100,
      modifiers: {
        elementalMastery: 7,
        contractCapacity: 1,
        summoningCost: -5,
      },
    };
    const herb: InventoryItem = {
      templateKey: 'healing_herb',
      quantity: 12,
      category: 'consumable',
      rarity: 'common',
      binding: 'tradeable',
      ownerId: playerId,
      addedAt: 101,
      modifiers: { potency: 2 },
    };

    const equipped = equipItem(core.equipment, 'summoner_focus', focus);
    const saved = serializePlayerCore({
      ...core,
      inventory: [focus, herb],
      equipment: equipped.equipment,
    });
    const restored = deserializePlayerCore(saved);

    expect(restored.inventory).toEqual([focus, herb]);
    expect(restored.equipment.find((slot) => slot.slot === 'summoner_focus')).toEqual({
      slot: 'summoner_focus',
      itemKey: 'apprentice_focus',
      quantity: 1,
      modifiers: focus.modifiers,
      durability: 100,
    });
    expect(restored.saveMetadata.saveVersion).toBe('2.0.0');
  });

  it('rejects creature contracts that are detached from player ownership', () => {
    const owned = createCharacter({ name: 'Owner Test', contractPathKey: 'companion' }).playerCore;
    const valid = validatePlayerContractOwnership(owned);
    const orphaned: PlayerCoreState = {
      ...owned,
      identity: { ...owned.identity, id: '' },
    };
    const duplicateContract: CreatureContract = {
      ...owned.creatureContracts[0]!,
      instance: {
        ...owned.creatureContracts[0]!.instance,
        id: 'detached-creature',
      },
    };
    const mismatched = validatePlayerContractOwnership({
      ...owned,
      creatureContracts: [duplicateContract],
    });

    expect(valid.valid).toBe(true);
    expect(validatePlayerContractOwnership(orphaned)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(['Creature contracts require a player owner']),
    });
    expect(mismatched.valid).toBe(false);
    expect(mismatched.errors.some((error) => error.includes('must own matching creature instance'))).toBe(true);
  });

  it('updates statistics and achievements from gameplay events', () => {
    const core = createDefaultPlayerCoreState('Progression Test');
    const events = [
      { type: 'CreatureContracted' },
      { type: 'ItemCrafted', count: 1 },
      { type: 'TradeCompleted', count: 1 },
      { type: 'DungeonCleared', worldId: 1 },
      { type: 'BossDefeated', worldId: 1 },
      { type: 'GoldEarned', amount: 1_000 },
      { type: 'QuestCompleted', questKey: 'first_request' },
    ] as const;
    const statistics = events.reduce((current, event) => applyPlayerStatisticEvent(current, event), core.statistics);

    const achievements = evaluateAchievements(statistics, core.achievements, 1234);
    const titles = getUnlockedTitlesForAchievements(achievements, core.titles, 1234);
    const updated = refreshTitleAchievementState({ ...core, statistics, achievements, titles }, 1234);

    expect(updated.statistics).toMatchObject({
      creaturesContracted: 1,
      itemsCrafted: 1,
      tradesCompleted: 1,
      dungeonsCleared: 1,
      bossesDefeated: 1,
      goldEarned: 1000,
      questsCompleted: 1,
    });
    expect(getAchievement(updated, 'contracted_companion')).toMatchObject({ unlocked: true, progress: 1 });
    expect(getAchievement(updated, 'first_craft')).toMatchObject({ unlocked: true, progress: 1 });
    expect(getAchievement(updated, 'first_trade')).toMatchObject({ unlocked: true, progress: 1 });
    expect(getAchievement(updated, 'first_clear')).toMatchObject({ unlocked: true, progress: 1 });
    expect(getAchievement(updated, 'boss_breaker')).toMatchObject({ unlocked: true, progress: 1 });
    expect(getAchievement(updated, 'earned_purse')).toMatchObject({ unlocked: true, progress: 1000 });
    expect(getAchievement(updated, 'quest_known')).toMatchObject({ unlocked: true, progress: 1 });
    expect(updated.titles.map((title) => title.key)).toEqual(expect.arrayContaining([
      'beast_keeper',
      'workshop_initiate',
      'market_hand',
      'tower_delver',
    ]));
  });
});
