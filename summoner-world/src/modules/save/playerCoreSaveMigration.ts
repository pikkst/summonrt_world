import type { CombatState, DungeonState, InventoryStack, LogEntry, PlayerState, Screen, WorldData } from '../../types/game.ts';
import type { PlayerCoreState } from '../../types/playerCore.ts';
import type { Structure } from '../../types/structure.ts';
import type { ActiveMission } from '../../core/missionQueue.ts';
import { createDefaultPlayerCoreState, migratePlayerStateToCore } from '../../core/playerCore/index.ts';
import { normalizeSkillEntry, normalizeTalentNode } from '../../core/playerCore/skillTalentCore.ts';
import { mergePlayerStatistics } from '../../core/playerCore/playerStatisticsTracking.ts';
import {
  getUnlockedTitlesForAchievements,
  normalizeAchievementEntry,
  normalizeTitleEntry,
  evaluateAchievements,
} from '../../core/playerCore/titleAchievementCore.ts';
import { normalizeProfessionState } from '../../core/playerCore/professionCore.ts';

export const ACTIVE_SAVE_KEY = 'summonerworld-save';
export const LEGACY_HELPER_SAVE_KEY = 'summonerworld-save-v1';
export const PLAYER_CORE_SAVE_VERSION = '2.0.0';
export const PLAYER_CORE_SAVE_SCHEMA = 'player-core-transition';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type SerializedPlayerCoreState = Jsonify<PlayerCoreState>;
export type SerializedPlayerState = Jsonify<Omit<PlayerState, 'discoveredTiles'>> & {
  discoveredTiles: string[];
};

type Jsonify<T> =
  T extends bigint ? string :
  T extends Set<infer U> ? Jsonify<U>[] :
  T extends Map<infer K, infer V> ? [Jsonify<K>, Jsonify<V>][] :
  T extends Array<infer U> ? Jsonify<U>[] :
  T extends object ? { [K in keyof T]: Jsonify<T[K]> } :
  T;

export interface SaveRuntimeState {
  worlds: SerializedWorldData[];
  currentWorldId: number;
  turnCount: number;
  screen: Screen;
  combat: CombatState | null;
  dungeon: DungeonState | null;
  activity: PlayerState['activity'] | null;
  missions: ActiveMission[];
  exploring: unknown;
  searching: unknown;
  capturing: unknown;
  lastLogoutTimestamp?: number;
  log: LogEntry[];
}

export interface SaveEnvelopeV2 {
  version: typeof PLAYER_CORE_SAVE_VERSION;
  schema: typeof PLAYER_CORE_SAVE_SCHEMA;
  playerCore: SerializedPlayerCoreState;
  legacyPlayer?: SerializedPlayerState;
  runtime: SaveRuntimeState;
  savedAt: number;
}

export type SerializedWorldData = Omit<WorldData, 'tiles'> & {
  tiles: Array<[string, WorldData['tiles'] extends Map<string, infer V> ? V : never]>;
};

export function serializePlayerCore(core: PlayerCoreState): SerializedPlayerCoreState {
  return serializeValue(core) as SerializedPlayerCoreState;
}

export function deserializePlayerCore(data: unknown): PlayerCoreState {
  const raw = deserializeValue(data) as Partial<PlayerCoreState>;
  const name = raw.identity?.name ?? 'Summoner';
  const defaults = createDefaultPlayerCoreState(name, {
    archetype: raw.summonerProfile?.archetype,
    startingWorldId: raw.worldUnlocks?.activeWorldId ?? raw.position?.worldId ?? 1,
    affinity: raw.elements,
  });

  const statistics = {
    ...defaults.statistics,
    ...raw.statistics,
  };
  const achievements = evaluateAchievements(
    statistics,
    normalizeAchievementEntries(raw.achievements, defaults.achievements)
  );
  const titles = getUnlockedTitlesForAchievements(
    achievements,
    normalizeTitleEntries(raw.titles, defaults.titles)
  );

  const fastTravel = raw.fastTravel && typeof raw.fastTravel === 'object'
    ? {
        ...(raw.fastTravel as any),
        discoveredPointIds: Array.isArray((raw.fastTravel as any).discoveredPointIds)
          ? new Set((raw.fastTravel as any).discoveredPointIds)
          : new Set<string>(),
      }
    : defaults.fastTravel;

  return {
    ...defaults,
    ...raw,
    fastTravel,
    identity: {
      ...defaults.identity,
      ...raw.identity,
      appearance: raw.identity?.appearance ?? defaults.identity.appearance,
    },
    summonerProfile: {
      ...defaults.summonerProfile,
      ...raw.summonerProfile,
    },
    primaryStats: {
      ...defaults.primaryStats,
      ...raw.primaryStats,
    },
    secondaryStats: {
      ...defaults.secondaryStats,
      ...raw.secondaryStats,
    },
    statistics,
    reputation: {
      ...defaults.reputation,
      ...raw.reputation,
      world_rep: raw.reputation?.world_rep ?? defaults.reputation.world_rep,
      faction_rep: raw.reputation?.faction_rep ?? defaults.reputation.faction_rep,
      settlement_rep: raw.reputation?.settlement_rep ?? defaults.reputation.settlement_rep,
      creature_rep: raw.reputation?.creature_rep ?? defaults.reputation.creature_rep,
    },
    questHistory: {
      ...defaults.questHistory,
      ...raw.questHistory,
      active: raw.questHistory?.active ?? defaults.questHistory.active,
      completed: raw.questHistory?.completed ?? defaults.questHistory.completed,
    },
    discoveredRumors: raw.discoveredRumors ?? defaults.discoveredRumors,
    creatureSlots: raw.creatureSlots ?? defaults.creatureSlots,
    housing: normalizeHousing(raw.housing, defaults.housing, raw),
    professions: normalizeProfessionState(raw.professions),
    worldUnlocks: {
      ...defaults.worldUnlocks,
      ...raw.worldUnlocks,
      unlockedWorlds: raw.worldUnlocks?.unlockedWorlds ?? defaults.worldUnlocks.unlockedWorlds,
    },
    saveMetadata: {
      ...defaults.saveMetadata,
      ...raw.saveMetadata,
      saveVersion: PLAYER_CORE_SAVE_VERSION,
    },
    resources: {
      ...defaults.resources,
      ...raw.resources,
    },
    position: {
      ...defaults.position,
      ...raw.position,
    },
    settings: {
      ...defaults.settings,
      ...raw.settings,
    },
    inventory: raw.inventory ?? defaults.inventory,
    equipment: raw.equipment ?? defaults.equipment,
    skills: normalizeSkillEntries(raw.skills, defaults.skills),
    talents: normalizeTalentNodes(raw.talents, defaults.talents),
    titles,
    achievements,
    creatureContracts: raw.creatureContracts ?? defaults.creatureContracts,
    level: raw.level ?? defaults.level,
    experience: toBigInt(raw.experience),
    elements: raw.elements ?? defaults.elements,
    class: raw.class ?? defaults.class,
    money: raw.money ?? defaults.money,
    skillPoints: raw.skillPoints ?? defaults.skillPoints,
    dayCount: raw.dayCount ?? defaults.dayCount,
    gameTimeMinutes: raw.gameTimeMinutes ?? defaults.gameTimeMinutes,
    isOnline: raw.isOnline,
  };
}

export function serializeLegacyPlayer(player: PlayerState): SerializedPlayerState {
  return {
    ...(serializeValue(player) as Jsonify<Omit<PlayerState, 'discoveredTiles'>>),
    discoveredTiles: Array.from(player.discoveredTiles ?? []),
  };
}

export function deserializeLegacyPlayer(data: unknown): PlayerState {
  if (!isRecord(data)) {
    throw new Error('Invalid legacy player payload');
  }

  const raw = deserializeValue(data) as Partial<PlayerState> & { discoveredTiles?: unknown };
  const fallback = projectCoreToLegacyPlayer(createDefaultPlayerCoreState(raw.name ?? 'Summoner'));

  return {
    ...fallback,
    ...raw,
    id: typeof raw.id === 'string' ? raw.id : fallback.id,
    name: typeof raw.name === 'string' ? raw.name : fallback.name,
    gender: typeof raw.gender === 'string' ? raw.gender : fallback.gender,
    appearance: isRecord(raw.appearance) ? raw.appearance : fallback.appearance,
    affinity: raw.affinity ?? fallback.affinity,
    level: raw.level ?? fallback.level,
    experience: toBigInt(raw.experience),
    money: raw.money ?? fallback.money,
    skillPoints: raw.skillPoints ?? fallback.skillPoints,
    skillsUnlocked: raw.skillsUnlocked ?? fallback.skillsUnlocked,
    unspent_passive_points: raw.unspent_passive_points ?? fallback.unspent_passive_points,
    unlocked_node_ids: raw.unlocked_node_ids ?? fallback.unlocked_node_ids,
    energy: raw.energy ?? fallback.energy,
    nerve: raw.nerve ?? fallback.nerve,
    happy: raw.happy ?? fallback.happy,
    life: raw.life ?? fallback.life,
    strength: raw.strength ?? fallback.strength,
    vitality: raw.vitality ?? fallback.vitality,
    intelligence: raw.intelligence ?? fallback.intelligence,
    dexterity: raw.dexterity ?? fallback.dexterity,
    wisdom: raw.wisdom ?? fallback.wisdom,
    luck: raw.luck ?? fallback.luck,
    defense: raw.defense ?? fallback.defense,
    speed: raw.speed ?? fallback.speed,
    currentWorldId: raw.currentWorldId ?? fallback.currentWorldId,
    tileX: typeof raw.tileX === 'number' && Number.isFinite(raw.tileX) ? raw.tileX : fallback.tileX,
    tileY: typeof raw.tileY === 'number' && Number.isFinite(raw.tileY) ? raw.tileY : fallback.tileY,
    dayCount: raw.dayCount ?? fallback.dayCount,
    gameTimeMinutes: raw.gameTimeMinutes ?? fallback.gameTimeMinutes,
    creatures: raw.creatures ?? fallback.creatures,
    inventory: raw.inventory ?? fallback.inventory,
    activeQuests: raw.activeQuests ?? fallback.activeQuests,
    completedQuests: raw.completedQuests ?? fallback.completedQuests,
    discoveredTiles: normalizeStringSet(raw.discoveredTiles),
    territorialHostilities: raw.territorialHostilities ?? fallback.territorialHostilities,
    activity: raw.activity,
    settings: {
      ...fallback.settings,
      ...raw.settings,
    },
    archetype: raw.archetype,
    isOnline: raw.isOnline,
  };
}

export function migrateLegacyPlayerToCore(player: PlayerState, previous?: PlayerCoreState): PlayerCoreState {
  const migrated = migratePlayerStateToCore(player);
  const merged: PlayerCoreState = {
    ...migrated,
    equipment: previous?.equipment ?? migrated.equipment,
    titles: previous?.titles ?? migrated.titles,
    achievements: previous?.achievements ?? migrated.achievements,
    statistics: mergePlayerStatistics(previous?.statistics, migrated.statistics),
    reputation: previous?.reputation ?? migrated.reputation,
    housing: previous?.housing ?? migrated.housing,
    professions: previous?.professions ?? migrated.professions,
    saveMetadata: {
      ...(previous?.saveMetadata ?? migrated.saveMetadata),
      lastSavedAt: new Date().toISOString(),
      saveVersion: PLAYER_CORE_SAVE_VERSION,
    },
  };

  const achievements = evaluateAchievements(merged.statistics, merged.achievements);
  const titles = getUnlockedTitlesForAchievements(achievements, merged.titles);

  return {
    ...merged,
    achievements,
    titles,
  };
}

export function projectCoreToLegacyPlayer(core: PlayerCoreState, previous?: PlayerState): PlayerState {
  const skillsUnlocked = Object.fromEntries(core.skills.map((skill) => [skill.key, skill.unlocked]));
  const unlockedNodeIds = core.talents.filter((talent) => talent.unlocked).map((talent) => talent.nodeId);
  const creatures = core.creatureContracts.map((contract) => contract.instance);

  return {
    id: core.identity.id,
    name: core.identity.name,
    gender: core.identity.gender ?? previous?.gender ?? 'unknown',
    appearance: core.identity.appearance,
    affinity: core.elements,
    level: core.level,
    experience: core.experience,
    money: core.money,
    archetype: core.summonerProfile.archetype ?? previous?.archetype,
    isOnline: core.isOnline ?? previous?.isOnline,
    skillPoints: core.skillPoints,
    skillsUnlocked,
    unspent_passive_points: previous?.unspent_passive_points ?? 0,
    unlocked_node_ids: unlockedNodeIds.length > 0 ? unlockedNodeIds : previous?.unlocked_node_ids ?? ['root_hub'],
    energy: core.resources.energy,
    nerve: core.resources.nerve,
    happy: core.resources.happy,
    life: core.resources.life,
    strength: core.primaryStats.strength,
    vitality: core.primaryStats.vitality,
    intelligence: core.primaryStats.intelligence,
    dexterity: core.primaryStats.dexterity,
    wisdom: core.primaryStats.wisdom,
    luck: core.primaryStats.luck,
    defense: previous?.defense ?? 10,
    speed: previous?.speed ?? 10,
    currentWorldId: core.position.worldId,
    tileX: core.position.x,
    tileY: core.position.y,
    dayCount: core.dayCount,
    gameTimeMinutes: core.gameTimeMinutes,
    creatures,
    inventory: core.inventory as InventoryStack[],
    activeQuests: core.questHistory.active,
    completedQuests: core.questHistory.completed,
    discoveredTiles: previous?.discoveredTiles ?? new Set<string>(),
    territorialHostilities: previous?.territorialHostilities ?? {},
    activity: previous?.activity,
    settings: core.settings,
  };
}

export function serializeWorlds(worlds: Map<number, WorldData>): SerializedWorldData[] {
  return Array.from(worlds.values()).map((world) => ({
    ...world,
    tiles: Array.from(world.tiles.entries()),
  }));
}

export function deserializeWorlds(data: unknown): Map<number, WorldData> {
  const worlds = new Map<number, WorldData>();
  if (!Array.isArray(data)) return worlds;

  for (const entry of data) {
    if (Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'number' && isRecord(entry[1])) {
      const world = entry[1] as SerializedWorldData;
      worlds.set(entry[0], {
        ...world,
        tiles: new Map(world.tiles ?? []),
      });
      continue;
    }

    if (isRecord(entry) && typeof entry.id === 'number') {
      const world = entry as SerializedWorldData;
      worlds.set(world.id, {
        ...world,
        tiles: new Map(world.tiles ?? []),
      });
    }
  }

  return worlds;
}

export function migrateSaveToV2(data: unknown): SaveEnvelopeV2 {
  if (!isRecord(data)) {
    throw new Error('Invalid save payload');
  }

  if (data.version === PLAYER_CORE_SAVE_VERSION && data.playerCore) {
    const core = deserializePlayerCore(data.playerCore);
    const legacy = data.legacyPlayer ? deserializeLegacyPlayer(data.legacyPlayer) : projectCoreToLegacyPlayer(core);
    const runtime = isRecord(data.runtime) ? data.runtime : {};

    return {
      version: PLAYER_CORE_SAVE_VERSION,
      schema: PLAYER_CORE_SAVE_SCHEMA,
      playerCore: serializePlayerCore(core),
      legacyPlayer: serializeLegacyPlayer(legacy),
      runtime: normalizeRuntime(runtime),
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : Date.now(),
    };
  }

  const legacyPayload = isRecord(data.player) ? data.player : data;
  const legacyPlayer = deserializeLegacyPlayer(legacyPayload);
  const playerCore = migrateLegacyPlayerToCore(legacyPlayer);

  return {
    version: PLAYER_CORE_SAVE_VERSION,
    schema: PLAYER_CORE_SAVE_SCHEMA,
    playerCore: serializePlayerCore(playerCore),
    legacyPlayer: serializeLegacyPlayer(legacyPlayer),
    runtime: normalizeRuntime(data),
    savedAt: typeof data.savedAt === 'number' ? data.savedAt : Date.now(),
  };
}

export function createSaveEnvelopeV2(params: {
  playerCore: PlayerCoreState;
  legacyPlayer: PlayerState;
  worlds: Map<number, WorldData>;
  currentWorldId: number;
  turnCount: number;
  screen: Screen;
  combat: CombatState;
  dungeon: DungeonState;
  activity: PlayerState['activity'] | null;
  missions: ActiveMission[];
  exploring: unknown;
  searching: unknown;
  capturing: unknown;
  lastLogoutTimestamp?: number;
  log: LogEntry[];
  savedAt?: number;
}): SaveEnvelopeV2 {
  return {
    version: PLAYER_CORE_SAVE_VERSION,
    schema: PLAYER_CORE_SAVE_SCHEMA,
    playerCore: serializePlayerCore(params.playerCore),
    legacyPlayer: serializeLegacyPlayer(params.legacyPlayer),
    runtime: {
      worlds: serializeWorlds(params.worlds),
      currentWorldId: params.currentWorldId,
      turnCount: params.turnCount,
      screen: params.screen,
      combat: params.combat,
      dungeon: params.dungeon,
      activity: params.activity,
      missions: params.missions,
      exploring: params.exploring,
      searching: params.searching,
      capturing: params.capturing,
      lastLogoutTimestamp: params.lastLogoutTimestamp,
      log: params.log.slice(-500),
    },
    savedAt: params.savedAt ?? Date.now(),
  };
}

function normalizeRuntime(data: Record<string, unknown>): SaveRuntimeState {
  const source = isRecord(data.runtime) ? data.runtime : data;
  return {
    worlds: normalizeSerializedWorlds(source.worlds),
    currentWorldId: typeof source.currentWorldId === 'number' ? source.currentWorldId : 1,
    turnCount: typeof source.turnCount === 'number' ? source.turnCount : 0,
    screen: isScreen(source.screen) ? source.screen : 'explore',
    combat: isRecord(source.combat) ? source.combat as unknown as CombatState : null,
    dungeon: isRecord(source.dungeon) ? source.dungeon as unknown as DungeonState : null,
    activity: isRecord(source.activity) ? source.activity as PlayerState['activity'] : null,
    missions: Array.isArray(source.missions) ? source.missions as ActiveMission[] : [],
    exploring: source.exploring ?? null,
    searching: source.searching ?? null,
    capturing: source.capturing ?? null,
    lastLogoutTimestamp: typeof source.lastLogoutTimestamp === 'number' ? source.lastLogoutTimestamp : undefined,
    log: Array.isArray(source.log) ? source.log as LogEntry[] : [],
  };
}

function normalizeSerializedWorlds(data: unknown): SerializedWorldData[] {
  return Array.from(deserializeWorlds(data).values()).map((world) => ({
    ...world,
    tiles: Array.from(world.tiles.entries()),
  }));
}

function normalizeSkillEntries(
  skills: unknown,
  defaults: PlayerCoreState['skills']
): PlayerCoreState['skills'] {
  if (!Array.isArray(skills)) return defaults;

  return skills
    .filter((entry): entry is { key: string } => isRecord(entry) && typeof entry.key === 'string')
    .map((entry) => normalizeSkillEntry(entry));
}

function normalizeTalentNodes(
  talents: unknown,
  defaults: PlayerCoreState['talents']
): PlayerCoreState['talents'] {
  if (!Array.isArray(talents)) return defaults;

  return talents
    .filter((entry): entry is { nodeId: string } => isRecord(entry) && typeof entry.nodeId === 'string')
    .map((entry) => normalizeTalentNode(entry));
}

function normalizeTitleEntries(
  titles: unknown,
  defaults: PlayerCoreState['titles']
): PlayerCoreState['titles'] {
  if (!Array.isArray(titles)) return defaults;

  return titles
    .filter((entry): entry is { key: string } => isRecord(entry) && typeof entry.key === 'string')
    .map((entry) => normalizeTitleEntry(entry));
}

function normalizeAchievementEntries(
  achievements: unknown,
  defaults: PlayerCoreState['achievements']
): PlayerCoreState['achievements'] {
  if (!Array.isArray(achievements)) return defaults;

  return achievements
    .filter((entry): entry is { key: string } => isRecord(entry) && typeof entry.key === 'string')
    .map((entry) => normalizeAchievementEntry(entry));
}

function serializeValue(value: unknown): JsonValue {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Set) return Array.from(value).map(serializeValue);
  if (value instanceof Map) return Array.from(value.entries()).map(([key, entryValue]) => [serializeValue(key), serializeValue(entryValue)]);
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, serializeValue(entryValue)])
    );
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return null;
}

function deserializeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deserializeValue);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, entryValue]) => [
        key,
        key === 'experience' ? toBigInt(entryValue) : deserializeValue(entryValue),
      ])
    );
  }
  return value;
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function normalizeStringSet(value: unknown): Set<string> {
  if (value instanceof Set) return new Set(Array.from(value).filter((entry): entry is string => typeof entry === 'string'));
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((entry): entry is string => typeof entry === 'string'));
}

function normalizeHousing(
  rawHousing: unknown,
  defaults: PlayerCoreState['housing'],
  raw: Record<string, unknown>
): PlayerCoreState['housing'] {
  if (isRecord(rawHousing) && Array.isArray((rawHousing as Record<string, unknown>).structures)) {
    return {
      ...defaults,
      ...(rawHousing as Record<string, unknown>),
      structures: (rawHousing as Record<string, unknown>).structures as Structure[],
    };
  }

  const legacyLevel = isRecord(rawHousing)
    ? (rawHousing as Record<string, unknown>).structureLevel
    : undefined;

  const structures: Structure[] = [];
  const structureLevel = typeof legacyLevel === 'number' && legacyLevel > 0 ? legacyLevel : undefined;

  if (structureLevel) {
    const worldId = typeof raw.position === 'object' && raw.position && 'worldId' in raw.position
      ? (raw.position as Record<string, unknown>).worldId as number
      : 1;
    const x = typeof raw.position === 'object' && raw.position && 'x' in raw.position
      ? (raw.position as Record<string, unknown>).x as number
      : 10;
    const y = typeof raw.position === 'object' && raw.position && 'y' in raw.position
      ? (raw.position as Record<string, unknown>).y as number
      : 10;
    const ownerId = typeof raw.identity === 'object' && raw.identity && 'id' in raw.identity
      ? (raw.identity as Record<string, unknown>).id as string
      : 'player-unknown';

    structures.push({
      id: `structure_legacy_${ownerId}`,
      type: 'house',
      worldId,
      tileX: x,
      tileY: y,
      level: structureLevel,
      builtAt: 0,
      ownerId,
    });
  }

  return {
    ...defaults,
    structures,
    structureLevel,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScreen(value: unknown): value is Screen {
  return typeof value === 'string';
}
