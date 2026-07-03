import type { PlayerCoreState, SummonerClass, PlayerPrimaryStats, PlayerSecondaryStats, CreatureSlots } from '../../types/playerCore.ts';
import type { PlayerState } from '../../types/game.ts';
import { calculatePrimaryStats, calculateSecondaryStats, useFinalStats } from './playerStatistics';
import { createEmptyEquipmentSlots } from './equipmentCore';
import { createDefaultCreatureSlots } from './creatureSlotCore';

export const ARCHETYPE_TO_CLASS: Record<string, SummonerClass> = {
  fighter: 'tactician',
  trader: 'alchemist',
  explorer: 'pathfinder',
  spy: 'tactician',
  assassin: 'duelist',
  summoner: 'elementalist',
  pvp: 'duelist',
  pve: 'warden',
};

const DEFAULT_CLASS: SummonerClass = 'elementalist';

export function createDefaultPlayerCoreState(
  name: string,
  options: {
    archetype?: string;
    startingWorldId?: number;
    affinity?: { primary: any };
  } = {}
): PlayerCoreState {
  const archetype = options.archetype ?? 'summoner';
  const startingWorldId = options.startingWorldId ?? 1;
  const sClass = ARCHETYPE_TO_CLASS[archetype] ?? DEFAULT_CLASS;

  const primaryStats = calculatePrimaryStats(sClass, 1);
  const secondaryStats = calculateSecondaryStats(primaryStats, []);

  return {
    identity: {
      id: generateId(),
      name,
      gender: 'unknown',
      appearance: {},
    },
    summonerProfile: {
      class: sClass,
      archetype,
      startingWorldId,
    },
    level: 1,
    experience: 0n,
    elements: options.affinity ?? { primary: 'fire' as any },
    class: sClass,
    primaryStats,
    secondaryStats,
    inventory: [],
    equipment: createEmptyEquipmentSlots(),
    creatureSlots: createDefaultCreatureSlots(),
    skills: [],
    talents: [],
    titles: [],
    achievements: [],
    statistics: {
      worldsUnlocked: 1,
      creaturesContracted: 0,
      dungeonsCleared: 0,
      itemsCrafted: 0,
      tradesCompleted: 0,
      goldEarned: 0,
      bossesDefeated: 0,
      pvpWins: 0,
      housingValue: 0,
      guildContributions: 0,
      questsCompleted: 0,
    },
    reputation: {
      world_rep: {},
      faction_rep: {},
      settlement_rep: {},
      creature_rep: {},
    },
    questHistory: {
      active: [],
      completed: [],
    },
    creatureContracts: [],
    housing: {},
    worldUnlocks: {
      unlockedWorlds: [startingWorldId],
      activeWorldId: startingWorldId,
    },
    saveMetadata: {
      lastSavedAt: new Date().toISOString(),
      playtimeSeconds: 0,
      saveVersion: '1.0.0',
    },
    resources: {
      energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
      nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
      happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
      life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    },
    position: {
      worldId: startingWorldId,
      x: 10,
      y: 10,
    },
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.5,
      showLogTimestamps: true,
    },
    money: 1000,
    skillPoints: 0,
    dayCount: 1,
    gameTimeMinutes: 420,
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function migratePlayerStateToCore(player: PlayerState): PlayerCoreState {
  const sClass = (ARCHETYPE_TO_CLASS[player.archetype ?? 'summoner'] ?? DEFAULT_CLASS) as SummonerClass;
  const currentWorldId = player.currentWorldId ?? 1;

  const unlockedWorlds: number[] = [1];
  for (let w = 2; w <= currentWorldId; w++) {
    if (!unlockedWorlds.includes(w)) unlockedWorlds.push(w);
  }

  const toContract = (creature: any) => ({
    id: creature.id,
    templateKey: creature.templateKey,
    nickname: creature.nickname,
    bondLevel: 1,
    trust: 50,
    loyalty: 50,
    contractStability: 100,
    elementCompatibility: 100,
    commandPermissions: ['follow', 'attack', 'defend', 'retreat'],
    tradeStatus: 'bound' as const,
    breedingRights: false,
    pvpEligibility: false,
    contractedAt: Date.now(),
    instance: creature,
  });

  const primaryStats = useFinalStats({
    strength: player.strength,
    vitality: player.vitality,
    intelligence: player.intelligence,
    dexterity: player.dexterity,
    wisdom: player.wisdom,
    luck: player.luck,
  });

  const secondaryStats = calculateSecondaryStats(primaryStats, []);

  return {
    identity: {
      id: player.id,
      name: player.name,
      gender: player.gender,
      appearance: player.appearance,
    },
    summonerProfile: {
      class: sClass,
      archetype: player.archetype,
      startingWorldId: 1,
    },
    level: player.level,
    experience: player.experience,
    elements: player.affinity,
    class: sClass,
    primaryStats,
    secondaryStats,
    inventory: player.inventory,
    equipment: createEmptyEquipmentSlots(),
    creatureSlots: createDefaultCreatureSlots(),
    skills: Object.entries(player.skillsUnlocked).map(([key, unlocked]) => ({
      key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      unlocked,
    })),
      talents: player.unlocked_node_ids.map((nodeId: string) => ({
        nodeId,
        unlocked: true,
      })),
    titles: [],
    achievements: [],
    statistics: {
      worldsUnlocked: unlockedWorlds.length,
      creaturesContracted: player.creatures.length,
      dungeonsCleared: 0,
      itemsCrafted: 0,
      tradesCompleted: 0,
      goldEarned: player.money,
      bossesDefeated: 0,
      pvpWins: 0,
      housingValue: 0,
      guildContributions: 0,
      questsCompleted: player.completedQuests.length,
    },
    reputation: {
      world_rep: {},
      faction_rep: {},
      settlement_rep: {},
      creature_rep: {},
    },
    questHistory: {
      active: player.activeQuests,
      completed: player.completedQuests,
    },
    creatureContracts: player.creatures.map(toContract),
    housing: {},
    worldUnlocks: {
      unlockedWorlds,
      activeWorldId: currentWorldId,
    },
    saveMetadata: {
      lastSavedAt: new Date().toISOString(),
      playtimeSeconds: 0,
      saveVersion: '1.0.0',
    },
    resources: {
      energy: player.energy,
      nerve: player.nerve,
      happy: player.happy,
      life: player.life,
    },
    position: {
      worldId: currentWorldId,
      x: player.tileX,
      y: player.tileY,
    },
    settings: player.settings,
    money: player.money,
    skillPoints: player.skillPoints,
    dayCount: player.dayCount,
    gameTimeMinutes: player.gameTimeMinutes,
    isOnline: player.isOnline,
  };
}
