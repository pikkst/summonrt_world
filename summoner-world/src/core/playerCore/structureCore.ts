import type { PlayerCoreState } from '../../types/playerCore';
import type { TileData } from '../../types/game';
import type {
  Structure,
  StructureType,
  StructureDefinition,
  StructurePlacementResult,
  TownHallPolicy,
  TownHallPolicyType,
} from '../../types/structure';
import {
  STRUCTURE_DEFINITIONS,
  getTownHallUpgradeCost,
  getTownHallUpgradeLevel,
  getUnlockedPolicyTypes,
  getActiveTownHallPolicies,
  TOWN_HALL_UPGRADE_TABLE,
} from '../../types/structure';
import { getStructureDefinition, isValidStructureType } from '../../types/structure';

export {
  getStructureDefinition,
  isValidStructureType,
  getTownHallUpgradeCost,
  getUnlockedPolicyTypes,
};

export function getAllStructureDefinitions(): Record<StructureType, StructureDefinition> {
  return STRUCTURE_DEFINITIONS;
}

export function canPlaceStructure(
  playerCore: PlayerCoreState,
  worldId: number,
  x: number,
  y: number,
  type: StructureType
): StructurePlacementResult {
  const definition = STRUCTURE_DEFINITIONS[type];

  if (playerCore.level < definition.minPlayerLevel) {
    return { success: false, reason: `Requires player level ${definition.minPlayerLevel}` };
  }

  if (worldId < definition.minWorldId) {
    return { success: false, reason: `Requires world ${definition.minWorldId}` };
  }

  if (playerCore.money < definition.cost) {
    return { success: false, reason: `Not enough money (requires ${definition.cost})` };
  }

  const existingOnTile = playerCore.housing.structures.find(
    (s) => s.worldId === worldId && s.tileX === x && s.tileY === y
  );
  if (existingOnTile) {
    return { success: false, reason: 'Tile already occupied by a structure' };
  }

  for (const structure of playerCore.housing.structures) {
    if (structure.worldId === worldId) {
      const distance = Math.hypot(x - structure.tileX, y - structure.tileY);
      if (distance < definition.minDistanceFromOtherStructures) {
        return {
          success: false,
          reason: `Too close to existing structure (minimum distance ${definition.minDistanceFromOtherStructures})`,
        };
      }
    }
  }

  return { success: true };
}

export function canPlaceStructureOnTile(
  playerCore: PlayerCoreState,
  worldId: number,
  x: number,
  y: number,
  type: StructureType,
  tile: TileData
): StructurePlacementResult {
  const basicCheck = canPlaceStructure(playerCore, worldId, x, y, type);
  if (!basicCheck.success) {
    return basicCheck;
  }

  const definition = STRUCTURE_DEFINITIONS[type];

  if (!tile.discovered) {
    return { success: false, reason: 'Tile not discovered' };
  }

  if (!definition.validBiomes.includes(tile.biome)) {
    return { success: false, reason: `Invalid biome: ${tile.biome}` };
  }

  if (tile.specialType && definition.disallowedSpecialTypes.includes(tile.specialType)) {
    return { success: false, reason: `Cannot place on ${tile.specialType}` };
  }

  return { success: true };
}

export function placeStructure(
  playerCore: PlayerCoreState,
  worldId: number,
  x: number,
  y: number,
  type: StructureType,
  tile?: TileData
): { playerCore: PlayerCoreState; result: StructurePlacementResult } {
  const placement = tile
    ? canPlaceStructureOnTile(playerCore, worldId, x, y, type, tile)
    : canPlaceStructure(playerCore, worldId, x, y, type);

  if (!placement.success) {
    return { playerCore, result: placement };
  }

  const definition = STRUCTURE_DEFINITIONS[type];
  const id = generateStructureId(worldId, x, y, type);

  const structure: Structure = {
    id,
    type,
    worldId,
    tileX: x,
    tileY: y,
    level: 1,
    builtAt: playerCore.gameTimeMinutes,
    ownerId: playerCore.identity.id,
  };

  const updatedHousing = {
    ...playerCore.housing,
    structures: [...playerCore.housing.structures, structure],
  };

  const updatedPlayerCore: PlayerCoreState = {
    ...playerCore,
    housing: updatedHousing,
    money: playerCore.money - definition.cost,
  };

  return { playerCore: updatedPlayerCore, result: { success: true, structure } };
}

export function hasStructureType(playerCore: PlayerCoreState, type: StructureType): boolean {
  return playerCore.housing.structures.some((s) => s.type === type);
}

export function getStructuresOfType(playerCore: PlayerCoreState, type: StructureType): Structure[] {
  return playerCore.housing.structures.filter((s) => s.type === type);
}

export function getStructureById(playerCore: PlayerCoreState, id: string): Structure | undefined {
  return playerCore.housing.structures.find((s) => s.id === id);
}

export function getAllStructures(playerCore: PlayerCoreState): Structure[] {
  return [...playerCore.housing.structures];
}

export function getStructuresInWorld(playerCore: PlayerCoreState, worldId: number): Structure[] {
  return playerCore.housing.structures.filter((s) => s.worldId === worldId);
}

function generateStructureId(worldId: number, x: number, y: number, type: StructureType): string {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `structure_${worldId}_${x}_${y}_${type}_${suffix}`;
}

export function upgradeTownHall(
  playerCore: PlayerCoreState,
  structureId: string
): { playerCore: PlayerCoreState; success: boolean; reason?: string } {
  const structure = playerCore.housing.structures.find((s) => s.id === structureId);
  if (!structure) {
    return { playerCore, success: false, reason: 'Structure not found' };
  }
  if (structure.type !== 'town') {
    return { playerCore, success: false, reason: 'Not a town hall' };
  }
  const currentLevel = structure.level;
  const maxLevel = TOWN_HALL_UPGRADE_TABLE.length;
  if (currentLevel >= maxLevel) {
    return { playerCore, success: false, reason: 'Max level reached' };
  }
  const cost = getTownHallUpgradeCost(currentLevel);
  if (playerCore.money < cost) {
    return { playerCore, success: false, reason: `Not enough money (requires ${cost})` };
  }

  const newLevel = currentLevel + 1;
  const updatedStructures = playerCore.housing.structures.map((s) =>
    s.id === structureId ? { ...s, level: newLevel } : s
  );

  const updatedPlayerCore: PlayerCoreState = {
    ...playerCore,
    money: playerCore.money - cost,
    housing: {
      ...playerCore.housing,
      structures: updatedStructures,
    },
  };

  return { playerCore: updatedPlayerCore, success: true };
}

export function canUpgradeTownHall(playerCore: PlayerCoreState, structureId: string): boolean {
  const result = upgradeTownHall(playerCore, structureId);
  return result.success;
}

export function getTownHallUpgradeInfo(
  playerCore: PlayerCoreState,
  structureId: string
): { cost: number; nextLevel: number; maxLevel: number; passiveIncomeBonus: number } | null {
  const structure = playerCore.housing.structures.find((s) => s.id === structureId);
  if (!structure || structure.type !== 'town') return null;
  const currentLevel = structure.level;
  const maxLevel = TOWN_HALL_UPGRADE_TABLE.length;
  if (currentLevel >= maxLevel) return null;
  const nextLevel = currentLevel + 1;
  const cost = getTownHallUpgradeCost(currentLevel);
  const bonus = getTownHallUpgradeLevel(nextLevel)?.passiveIncomeBonus ?? 0;
  return { cost, nextLevel, maxLevel, passiveIncomeBonus: bonus };
}

export function setTownHallPolicy(
  playerCore: PlayerCoreState,
  policyType: TownHallPolicyType,
  active: boolean
): PlayerCoreState {
  const currentLevel = playerCore.housing.structures
    .filter((s) => s.type === 'town')
    .reduce((max, s) => Math.max(max, s.level), 0);

  const unlocked = getUnlockedPolicyTypes(currentLevel);
  if (!unlocked.includes(policyType)) {
    return playerCore;
  }

  const existingPolicies = playerCore.housing.townHallPolicies ?? [];
  const otherPolicies = existingPolicies.filter((p) => p.type !== policyType);
  const targetPolicy: TownHallPolicy = { type: policyType, active };

  const updatedPolicies = [...otherPolicies, targetPolicy];

  return {
    ...playerCore,
    housing: {
      ...playerCore.housing,
      townHallPolicies: updatedPolicies,
    },
  };
}

export function getActiveTownHallPolicyTypes(playerCore: PlayerCoreState): TownHallPolicyType[] {
  const policies = playerCore.housing.townHallPolicies;
  return getActiveTownHallPolicies(policies).map((p) => p.type);
}

export function getActiveTownHallPolicyCount(playerCore: PlayerCoreState): number {
  return playerCore.housing.townHallPolicies?.filter((p) => p.active).length ?? 0;
}
