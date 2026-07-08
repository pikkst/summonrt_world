import { describe, expect, it } from 'vitest';
import {
  PROFESSION_DEFINITIONS,
  PROFESSION_IDS,
  addPlayerProfessionXp,
  addProfessionXp,
  createDefaultPlayerCoreState,
  createDefaultProfessionState,
  getProfessionAggregateBonuses,
  getProfessionXpRequiredForLevel,
  normalizeProfessionState,
  setActiveProfession,
} from '../core/playerCore/index.ts';
import { deserializePlayerCore, serializePlayerCore } from '../modules/save/playerCoreSaveMigration.ts';
import type { ProfessionId } from '../types/playerCore.ts';

const expectedProfessionIds: ProfessionId[] = [
  'blacksmith',
  'explorer',
  'shopkeeper',
  'broker',
  'official',
  'summoner',
];

describe('T8.17 Profession system', () => {
  it('creates progression entries for all six professions', () => {
    const state = createDefaultProfessionState();

    expect(PROFESSION_IDS).toEqual(expectedProfessionIds);
    expect(Object.keys(state.entries)).toEqual(expectedProfessionIds);
    for (const professionId of expectedProfessionIds) {
      expect(state.entries[professionId]).toMatchObject({
        professionId,
        level: 1,
        xp: 0,
        totalXpEarned: 0,
        unlockedPerkIds: [],
      });
      expect(PROFESSION_DEFINITIONS[professionId].perks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('levels Blacksmith progression and unlocks its profession perks deterministically', () => {
    const state = createDefaultProfessionState('blacksmith');
    const requiredForLevelTwo = getProfessionXpRequiredForLevel(1);
    const progressed = addProfessionXp(state, 'blacksmith', requiredForLevelTwo, 1234);

    expect(progressed.entries.blacksmith).toMatchObject({
      level: 2,
      xp: 0,
      totalXpEarned: requiredForLevelTwo,
      unlockedPerkIds: ['blacksmith_apprentice_smelter'],
      lastAdvancedAt: 1234,
    });
    expect(getProfessionAggregateBonuses(progressed)).toEqual({ smelting_speed_pct: 5 });
  });

  it('supports Explorer, Shopkeeper, Broker, Official, and Summoner profession progression bonuses', () => {
    const levelTenXp = Array.from({ length: 9 }, (_, index) => getProfessionXpRequiredForLevel(index + 1))
      .reduce((sum, value) => sum + value, 0);
    const state = expectedProfessionIds.reduce(
      (current, professionId) => addProfessionXp(current, professionId, levelTenXp),
      createDefaultProfessionState()
    );

    expect(state.entries.explorer.unlockedPerkIds).toEqual([
      'explorer_pathfinder',
      'explorer_surveyor',
      'explorer_secret_sense',
    ]);
    expect(state.entries.shopkeeper.unlockedPerkIds).toContain('shopkeeper_better_margins');
    expect(state.entries.broker.unlockedPerkIds).toContain('broker_tariff_negotiator');
    expect(state.entries.official.unlockedPerkIds).toContain('official_civic_order');
    expect(state.entries.summoner.unlockedPerkIds).toContain('summoner_contract_affinity');
    expect(getProfessionAggregateBonuses(state)).toMatchObject({
      exploration_speed_pct: 5,
      store_traffic_pct: 5,
      caravan_speed_pct: 5,
      tax_revenue_pct: 5,
      capture_bonus_pct: 5,
    });
  });

  it('attaches profession progression to PlayerCoreState and round-trips through save/load', () => {
    const core = createDefaultPlayerCoreState('Profession Save Test');
    const withActiveProfession = {
      ...core,
      professions: setActiveProfession(normalizeProfessionState(core.professions), 'explorer'),
    };
    const progressed = addPlayerProfessionXp(withActiveProfession, 'explorer', getProfessionXpRequiredForLevel(1), 999);
    const restored = deserializePlayerCore(serializePlayerCore(progressed));

    const restoredProfessions = normalizeProfessionState(restored.professions);

    expect(restoredProfessions.activeProfessionId).toBe('explorer');
    expect(restoredProfessions.entries.explorer).toMatchObject({
      level: 2,
      totalXpEarned: 100,
      unlockedPerkIds: ['explorer_pathfinder'],
      lastAdvancedAt: 999,
    });
  });

  it('normalizes missing or invalid persisted profession state with safe defaults', () => {
    const normalized = normalizeProfessionState({
      activeProfessionId: 'not-valid' as ProfessionId,
      entries: {
        blacksmith: {
          professionId: 'blacksmith',
          level: -10,
          xp: Number.NaN,
          totalXpEarned: -1,
          unlockedPerkIds: ['unknown'],
        },
      },
    });

    expect(normalized.activeProfessionId).toBe('summoner');
    expect(normalized.entries.blacksmith).toEqual({
      professionId: 'blacksmith',
      level: 1,
      xp: 0,
      totalXpEarned: 0,
      unlockedPerkIds: [],
      lastAdvancedAt: undefined,
    });
    expect(Object.keys(normalized.entries)).toEqual(expectedProfessionIds);
  });
});
