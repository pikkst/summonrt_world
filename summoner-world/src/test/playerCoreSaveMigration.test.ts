import { describe, expect, it } from 'vitest';
import {
  PLAYER_CORE_SAVE_SCHEMA,
  PLAYER_CORE_SAVE_VERSION,
  createSaveEnvelopeV2,
  deserializePlayerCore,
  deserializeLegacyPlayer,
  deserializeWorlds,
  migrateLegacyPlayerToCore,
  migrateSaveToV2,
  projectCoreToLegacyPlayer,
  serializePlayerCore,
  serializeLegacyPlayer,
} from '../modules/save/playerCoreSaveMigration.ts';
import { createDefaultPlayerCoreState } from '../core/playerCore/index.ts';
import type { PlayerState, WorldData, WeatherState } from '../types/game.ts';

function makeLegacyPlayer(): PlayerState {
  return {
    id: 'player-save-1',
    name: 'Save Summoner',
    gender: 'unknown',
    appearance: { hair: 'silver' },
    affinity: { primary: 'fire', secondary: 'air', learned: ['water'] },
    level: 9,
    experience: 900719925474099312345n,
    money: 4321,
    archetype: 'explorer',
    isOnline: false,
    skillPoints: 4,
    skillsUnlocked: { fire_mastery: true, water_resistance: false },
    unspent_passive_points: 2,
    unlocked_node_ids: ['root_hub', 'explorer_minor_1'],
    energy: { current: 77, max: 100, lastUpdate: '2026-07-04T00:00:00.000Z' },
    nerve: { current: 11, max: 15, lastUpdate: '2026-07-04T00:00:00.000Z' },
    happy: { current: 88, max: 100, lastUpdate: '2026-07-04T00:00:00.000Z' },
    life: { current: 91, max: 120, lastUpdate: '2026-07-04T00:00:00.000Z' },
    strength: 12,
    vitality: 13,
    intelligence: 14,
    dexterity: 15,
    wisdom: 16,
    luck: 17,
    defense: 18,
    speed: 19,
    currentWorldId: 4,
    tileX: 22,
    tileY: 33,
    dayCount: 12,
    gameTimeMinutes: 720,
    creatures: [
      {
        id: 'creature-save-1',
        templateKey: 'fire_spirit',
        nickname: 'Cinder',
        level: 5,
        experience: 12345678901234567890n,
        currentHealth: 44,
        currentMana: 25,
        maxHealth: 55,
        maxMana: 30,
        attack: 21,
        defense: 12,
        speed: 18,
        class: 'rare',
        skills: ['ember'],
        traits: ['bright'],
        mutations: ['spark'],
        affection: 20,
        type: 'spirit',
        elements: ['fire'],
        baseExpValue: 25,
      },
    ],
    inventory: [
      { templateKey: 'healing_herb', quantity: 5, modifiers: { potency: 2, source: 'legacy' } },
    ],
    activeQuests: [
      { id: 'quest-save-1', templateKey: 'gather_herbs', status: 'active', progress: 1, targetProgress: 3 },
    ],
    completedQuests: ['quest-tutorial'],
    discoveredTiles: new Set(['4:22,33', '4:22,34']),
    territorialHostilities: {},
    settings: {
      musicVolume: 0.3,
      sfxVolume: 0.4,
      showLogTimestamps: true,
      textSpeed: 45,
      fontSize: 18,
      highContrast: true,
    },
  };
}

function makeWorld(): WorldData {
  const weather: WeatherState = {
    currentWeather: 'Clear',
    weatherIntensity: 1.0,
    nextChangeTurn: 100,
    baseDuration: 100,
  };
  return {
    id: 4,
    seed: 404,
    name: 'Fourth Test World',
    tier: 4,
    bossDefeated: false,
    dungeonFloors: 7,
    startTile: { x: 22, y: 33 },
    tiles: new Map([
      ['22,33', { x: 22, y: 33, biome: 'forest', discovered: true, explored: true }],
    ]),
    weather,
  };
}

describe('player core save migration', () => {
  it('serializes PlayerCoreState BigInt experience as strings and restores them', () => {
    const core = createDefaultPlayerCoreState('Big Save');
    core.experience = 900719925474099312345n;
    core.creatureContracts = [
      {
        id: 'contract-1',
        templateKey: 'fire_spirit',
        bondLevel: 1,
        trust: 50,
        loyalty: 50,
        contractStability: 100,
        elementCompatibility: 100,
        commandPermissions: ['combat'],
        tradeStatus: 'bound',
        breedingRights: false,
        pvpEligibility: false,
        contractedAt: 1,
        instance: {
          id: 'creature-1',
          templateKey: 'fire_spirit',
          level: 1,
          experience: 12345678901234567890n,
          currentHealth: 10,
          currentMana: 5,
          maxHealth: 10,
          maxMana: 5,
          attack: 3,
          defense: 2,
          speed: 4,
          skills: [],
          traits: [],
          mutations: [],
          affection: 0,
        },
      },
    ];

    const serialized = serializePlayerCore(core);
    expect(serialized.experience).toBe('900719925474099312345');
    expect(serialized.creatureContracts[0]!.instance.experience).toBe('12345678901234567890');

    const restored = deserializePlayerCore(serialized);
    expect(restored.experience).toBe(900719925474099312345n);
    expect(restored.creatureContracts[0]!.instance.experience).toBe(12345678901234567890n);
  });

  it('migrates active 1.1.0 saves into the v2 player-core envelope', () => {
    const legacy = makeLegacyPlayer();
    const v1Payload = {
      version: '1.1.0',
      player: serializeLegacyPlayer(legacy),
      worlds: [[4, { ...makeWorld(), tiles: Array.from(makeWorld().tiles.entries()) }]],
      currentWorldId: 4,
      turnCount: 42,
      screen: 'inventory',
      missions: [{ mission_id: 'mission-1', status: 'IN_PROGRESS' }],
      log: [{ id: 'log-1', turn: 1, text: 'Saved.', type: 'system', timestamp: 1 }],
      savedAt: 123,
    };

    const envelope = migrateSaveToV2(v1Payload);
    const core = deserializePlayerCore(envelope.playerCore);
    const projected = projectCoreToLegacyPlayer(core, deserializeLegacyPlayer(envelope.legacyPlayer));

    expect(envelope.version).toBe(PLAYER_CORE_SAVE_VERSION);
    expect(envelope.schema).toBe(PLAYER_CORE_SAVE_SCHEMA);
    expect(core.identity.id).toBe(legacy.id);
    expect(core.experience).toBe(legacy.experience);
    expect(core.creatureContracts[0]!.instance.experience).toBe(legacy.creatures[0]!.experience);
    expect(core.inventory[0]!.modifiers).toEqual({ potency: 2, source: 'legacy' });
    expect(core.position).toEqual({ worldId: 4, x: 22, y: 33 });
    expect(projected.discoveredTiles).toEqual(legacy.discoveredTiles);
    expect(envelope.runtime.currentWorldId).toBe(4);
    expect(envelope.runtime.turnCount).toBe(42);
  });

  it('migrates old helper-key payload shape without changing the source object', () => {
    const legacy = makeLegacyPlayer();
    const helperPayload = {
      player: serializeLegacyPlayer(legacy),
      worlds: [[4, { ...makeWorld(), tiles: Array.from(makeWorld().tiles.entries()) }]],
      currentWorldId: 4,
      turnCount: 7,
    };

    const envelope = migrateSaveToV2(helperPayload);
    const worlds = deserializeWorlds(envelope.runtime.worlds);

    expect(envelope.version).toBe(PLAYER_CORE_SAVE_VERSION);
    expect(deserializePlayerCore(envelope.playerCore).identity.name).toBe('Save Summoner');
    expect(worlds.get(4)?.tiles.get('22,33')?.explored).toBe(true);
    expect(helperPayload).not.toHaveProperty('version', PLAYER_CORE_SAVE_VERSION);
  });

  it('keeps save/load idempotent for already migrated v2 payloads', () => {
    const legacy = makeLegacyPlayer();
    const core = migrateLegacyPlayerToCore(legacy);
    const envelope = createSaveEnvelopeV2({
      playerCore: core,
      legacyPlayer: legacy,
      worlds: new Map([[4, makeWorld()]]),
      currentWorldId: 4,
      turnCount: 10,
      screen: 'explore',
      combat: { active: false, phase: 'player_turn', log: [], turns: 0 },
      dungeon: { active: false, worldId: 4, currentFloor: 0, totalFloors: 7, clearedFloors: [], bossDefeated: false, inEncounter: false },
      activity: null,
      missions: [],
      exploring: null,
      searching: null,
      capturing: null,
      log: [],
      savedAt: 456,
    });

    const migratedAgain = migrateSaveToV2(envelope);

    expect(migratedAgain).toEqual(envelope);
  });

  it('preserves tracked Player Core statistics when regenerating from legacy state', () => {
    const legacy = makeLegacyPlayer();
    const previousCore = migrateLegacyPlayerToCore(legacy);
    previousCore.statistics.dungeonsCleared = 3;
    previousCore.statistics.bossesDefeated = 4;
    previousCore.statistics.itemsCrafted = 9;
    previousCore.statistics.tradesCompleted = 2;
    previousCore.statistics.goldEarned = 10000;

    const regenerated = migrateLegacyPlayerToCore(legacy, previousCore);

    expect(regenerated.statistics.worldsUnlocked).toBe(4);
    expect(regenerated.statistics.creaturesContracted).toBe(1);
    expect(regenerated.statistics.questsCompleted).toBe(1);
    expect(regenerated.statistics.dungeonsCleared).toBe(3);
    expect(regenerated.statistics.bossesDefeated).toBe(4);
    expect(regenerated.statistics.itemsCrafted).toBe(9);
    expect(regenerated.statistics.tradesCompleted).toBe(2);
    expect(regenerated.statistics.goldEarned).toBe(10000);
  });
});
