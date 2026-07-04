import { describe, it, expect } from 'vitest';
import { createDefaultPlayerCoreState, migratePlayerStateToCore } from '../core/playerCore/index.ts';
import type { PlayerCoreState } from '../types/playerCore.ts';
import type { PlayerState } from '../types/game.ts';

function makeLegacyPlayer(): PlayerState {
  return {
    id: 'player-legacy-1',
    name: 'Legacy Summoner',
    gender: 'male',
    appearance: { hair: 'blue', eyes: 'green' },
    affinity: { primary: 'fire', secondary: 'air', learned: ['water'] },
    level: 5,
    experience: 500n,
    money: 2500,
    archetype: 'explorer',
    skillPoints: 3,
    skillsUnlocked: { 'fire_mastery': true, 'water_resistance': false, 'earth_armor': true },
    unspent_passive_points: 2,
    unlocked_node_ids: ['root_hub', 'node_fire_1', 'node_earth_1'],
    energy: { current: 80, max: 100, lastUpdate: new Date().toISOString() },
    nerve: { current: 10, max: 15, lastUpdate: new Date().toISOString() },
    happy: { current: 90, max: 100, lastUpdate: new Date().toISOString() },
    life: { current: 120, max: 150, lastUpdate: new Date().toISOString() },
    strength: 15,
    vitality: 10,
    intelligence: 12,
    dexterity: 14,
    wisdom: 10,
    luck: 10,
    defense: 12,
    speed: 18,
    currentWorldId: 3,
    tileX: 50,
    tileY: 60,
    dayCount: 10,
    gameTimeMinutes: 500,
    creatures: [
      {
        id: 'creature-1',
        templateKey: 'fire_spirit',
        nickname: 'Sparky',
        level: 3,
        experience: 100n,
        currentHealth: 40,
        currentMana: 20,
        maxHealth: 50,
        maxMana: 30,
        attack: 12,
        defense: 8,
        speed: 15,
        class: 'common',
        skills: ['scratch'],
        traits: ['strong'],
        mutations: [],
        affection: 10,
        type: 'spirit',
        elements: ['fire'],
        baseExpValue: 20,
        evolutionStage: 0,
        evolvedFromKey: undefined,
      },
      {
        id: 'creature-2',
        templateKey: 'water_elemental',
        nickname: undefined,
        level: 2,
        experience: 50n,
        currentHealth: 30,
        currentMana: 25,
        maxHealth: 40,
        maxMana: 35,
        attack: 8,
        defense: 10,
        speed: 10,
        class: 'uncommon',
        skills: ['water_spray'],
        traits: [],
        mutations: [],
        affection: 5,
        type: 'spirit',
        elements: ['water'],
        baseExpValue: 15,
        evolutionStage: 0,
        evolvedFromKey: undefined,
      },
    ],
    inventory: [
      { templateKey: 'healing_herb', quantity: 5 },
      { templateKey: 'mana_crystal', quantity: 2 },
    ],
    activeQuests: [
      { id: 'quest-1', templateKey: 'gather_herbs', status: 'active', progress: 2, targetProgress: 5 },
    ],
    completedQuests: ['quest-0', 'quest-early_tutorial'],
    discoveredTiles: new Set<string>(['3,10', '3,11']),
    territorialHostilities: {},
    settings: {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      showLogTimestamps: true,
      textSpeed: 40,
      fontSize: 16,
      highContrast: false,
    },
  };
}

describe('PlayerCoreState factory', () => {
it('creates a valid default core state', () => {
     const core = createDefaultPlayerCoreState('Test Summoner', { archetype: 'summoner' });

     expect(core.identity.name).toBe('Test Summoner');
     expect(core.identity.id).toBeDefined();
     expect(core.level).toBe(1);
     expect(core.experience).toBe(0n);
     expect(core.class).toBe('elementalist');
expect(core.inventory).toEqual([]);
      expect(core.equipment).toHaveLength(12);
      expect(core.creatureContracts).toEqual([]);
     expect(core.titles.map((title) => title.key)).toContain('trailfinder');
     expect(core.achievements.find((achievement) => achievement.key === 'first_steps')?.unlocked).toBe(true);
     expect(core.statistics.worldsUnlocked).toBe(1);
     expect(core.statistics.questsCompleted).toBe(0);
     expect(core.worldUnlocks.unlockedWorlds).toEqual([1]);
     expect(core.worldUnlocks.activeWorldId).toBe(1);
     expect(core.saveMetadata.saveVersion).toBe('1.0.0');
     expect(core.resources.life.current).toBe(100);
     expect(core.position.x).toBe(10);
     expect(core.money).toBe(1000);
     expect(core.skillPoints).toBe(0);
     expect(core.primaryStats).toBeDefined();
     expect(core.primaryStats.strength).toBe(10);
     expect(core.secondaryStats).toBeDefined();
     expect(core.secondaryStats.maxHealth).toBeGreaterThan(100);
   });

  it('maps archetypes to summoner classes', () => {
    expect(createDefaultPlayerCoreState('A', { archetype: 'fighter' }).class).toBe('tactician');
    expect(createDefaultPlayerCoreState('A', { archetype: 'trader' }).class).toBe('alchemist');
    expect(createDefaultPlayerCoreState('A', { archetype: 'summoner' }).class).toBe('elementalist');
  });

  it('supports custom starting world and affinity', () => {
    const core = createDefaultPlayerCoreState('A', { startingWorldId: 5, affinity: { primary: 'ice' } });
    expect(core.worldUnlocks.unlockedWorlds).toEqual([5]);
    expect(core.worldUnlocks.activeWorldId).toBe(5);
    expect(core.elements.primary).toBe('ice');
  });
});

describe('migratePlayerStateToCore', () => {
  it('preserves all legacy player fields in the new aggregate', () => {
    const legacy = makeLegacyPlayer();
    const core: PlayerCoreState = migratePlayerStateToCore(legacy);

    expect(core.identity.id).toBe(legacy.id);
    expect(core.identity.name).toBe(legacy.name);
    expect(core.identity.gender).toBe(legacy.gender);
    expect(core.identity.appearance).toEqual(legacy.appearance);

    expect(core.summonerProfile.class).toBe('pathfinder');
    expect(core.summonerProfile.archetype).toBe('explorer');

    expect(core.level).toBe(legacy.level);
    expect(core.experience).toBe(legacy.experience);
    expect(core.elements.primary).toBe('fire');
    expect(core.elements.secondary).toBe('air');
    expect(core.elements.learned).toEqual(['water']);

    expect(core.inventory).toEqual(legacy.inventory);
    expect(core.equipment).toHaveLength(12);

    expect(core.skills).toHaveLength(3);
    expect(core.skills.find(s => s.key === 'fire_mastery')?.unlocked).toBe(true);
    expect(core.skills.find(s => s.key === 'water_resistance')?.unlocked).toBe(false);

    expect(core.talents).toHaveLength(3);
    expect(core.talents.map(t => t.nodeId)).toEqual(['root_hub', 'node_fire_1', 'node_earth_1']);

    expect(core.questHistory.active).toEqual(legacy.activeQuests);
    expect(core.questHistory.completed).toEqual(legacy.completedQuests);

    expect(core.creatureContracts).toHaveLength(2);
    expect(core.creatureContracts[0]!.instance.id).toBe('creature-1');
    expect(core.creatureContracts[0]!.nickname).toBe('Sparky');
    expect(core.creatureContracts[0]!.tradeStatus).toBe('bound');

    expect(core.worldUnlocks.activeWorldId).toBe(3);
    expect(core.worldUnlocks.unlockedWorlds).toEqual([1, 2, 3]);

    expect(core.position.worldId).toBe(3);
    expect(core.position.x).toBe(50);
    expect(core.position.y).toBe(60);

    expect(core.resources.life.current).toBe(120);
    expect(core.resources.life.max).toBe(150);
    expect(core.resources.energy.current).toBe(80);

    expect(core.settings.musicVolume).toBe(0.7);
    expect(core.settings.textSpeed).toBe(40);

    expect(core.money).toBe(2500);
    expect(core.skillPoints).toBe(3);
    expect(core.dayCount).toBe(10);
    expect(core.gameTimeMinutes).toBe(500);

    expect(core.statistics.creaturesContracted).toBe(2);
    expect(core.statistics.questsCompleted).toBe(2);
    expect(core.statistics.goldEarned).toBe(2500);

    expect(core.saveMetadata.lastSavedAt).toBeDefined();
    expect(core.saveMetadata.saveVersion).toBe('1.0.0');
  });

  it('derives statistics from legacy state', () => {
    const core = migratePlayerStateToCore(makeLegacyPlayer());

    expect(core.statistics.dungeonsCleared).toBe(0);
    expect(core.statistics.pvpWins).toBe(0);
    expect(core.statistics.housingValue).toBe(0);
  });

  it('handles world unlock progression for higher world IDs', () => {
    const player = makeLegacyPlayer();
    player.currentWorldId = 7;
    const core = migratePlayerStateToCore(player);

    expect(core.worldUnlocks.unlockedWorlds).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(core.statistics.worldsUnlocked).toBe(7);
  });

  it('assigns default contract metadata to migrated creatures', () => {
    const core = migratePlayerStateToCore(makeLegacyPlayer());
    const contract = core.creatureContracts[0]!;

    expect(contract.bondLevel).toBe(1);
    expect(contract.trust).toBe(50);
    expect(contract.loyalty).toBe(50);
    expect(contract.contractStability).toBe(100);
    expect(contract.elementCompatibility).toBe(100);
    expect(contract.tradeStatus).toBe('bound');
    expect(contract.breedingRights).toBe(false);
    expect(contract.pvpEligibility).toBe(false);
    expect(contract.contractedAt).toBeGreaterThan(0);
  });
});
