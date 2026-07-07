import type { PlayerCoreState } from '../../types/playerCore';
import type { TileData } from '../../types/game';
import type { Structure, StructureType, StructureDefinition, StructurePlacementResult } from '../../types/structure';
import { STRUCTURE_DEFINITIONS } from '../../types/structure';
import { getStructureDefinition, isValidStructureType } from '../../types/structure';

export { getStructureDefinition, isValidStructureType };

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
