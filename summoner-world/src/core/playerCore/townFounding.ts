import type { PlayerCoreState } from '../../types/playerCore';
import type { TileData } from '../../types/game';
import type { Structure, StructurePlacementResult } from '../../types/structure';
import { canPlaceStructure, canPlaceStructureOnTile, placeStructure } from './structureCore';

export const TOWN_FOUNDING_MIN_BUILDINGS = 5;

export const TOWN_FOUNDING_MIN_WORLD_ID = 15;

export function getBuildingCount(playerCore: PlayerCoreState, worldId: number): number {
  return playerCore.housing.structures.filter(
    (s) => s.worldId === worldId && s.type !== 'town'
  ).length;
}

export function isTownFoundingEligible(playerCore: PlayerCoreState, worldId: number): boolean {
  return getTownFoundingRequirements(playerCore, worldId).eligible;
}

/**
 * Validates whether a town can be founded at (x, y) in the given world.
 *
 * The `tile` argument must belong to `worldId`. TileData carries no world id, so
 * callers are responsible for passing a tile from the same world; cross-world
 * tiles are not detected here and would produce incorrect biome/discovery checks.
 */
export function canFoundTown(
  playerCore: PlayerCoreState,
  worldId: number,
  x: number,
  y: number,
  tile?: TileData
): StructurePlacementResult {
  const requirements = getTownFoundingRequirements(playerCore, worldId);
  if (!requirements.eligible) {
    if (!requirements.worldUnlocked) {
      return { success: false, reason: `Founding a town requires world ${TOWN_FOUNDING_MIN_WORLD_ID}` };
    }
    return {
      success: false,
      reason: `Founding a town requires at least ${TOWN_FOUNDING_MIN_BUILDINGS} buildings in this world (have ${requirements.buildingCount})`,
    };
  }

  return tile
    ? canPlaceStructureOnTile(playerCore, worldId, x, y, 'town', tile)
    : canPlaceStructure(playerCore, worldId, x, y, 'town');
}

export function foundTown(
  playerCore: PlayerCoreState,
  worldId: number,
  x: number,
  y: number,
  tile?: TileData
): { playerCore: PlayerCoreState; result: StructurePlacementResult } {
  const placement = canFoundTown(playerCore, worldId, x, y, tile);
  if (!placement.success) {
    return { playerCore, result: placement };
  }

  return placeStructure(playerCore, worldId, x, y, 'town', tile);
}

export interface TownFoundingRequirement {
  worldId: number;
  buildingCount: number;
  minBuildings: number;
  minWorldId: number;
  /** True only when the player has actually unlocked `worldId` (progression check). */
  worldUnlocked: boolean;
  meetsBuildingRequirement: boolean;
  eligible: boolean;
}

export function getTownFoundingRequirements(
  playerCore: PlayerCoreState,
  worldId: number
): TownFoundingRequirement {
  const buildingCount = getBuildingCount(playerCore, worldId);
  const meetsBuildingRequirement = buildingCount >= TOWN_FOUNDING_MIN_BUILDINGS;
  const worldUnlocked = (playerCore.worldUnlocks?.unlockedWorlds ?? []).includes(worldId);
  const eligible = worldUnlocked && meetsBuildingRequirement;

  return {
    worldId,
    buildingCount,
    minBuildings: TOWN_FOUNDING_MIN_BUILDINGS,
    minWorldId: TOWN_FOUNDING_MIN_WORLD_ID,
    worldUnlocked,
    meetsBuildingRequirement,
    eligible,
  };
}

export function getFoundedTowns(playerCore: PlayerCoreState, worldId?: number): Structure[] {
  const towns = playerCore.housing.structures.filter((s) => s.type === 'town');
  return worldId === undefined ? towns : towns.filter((s) => s.worldId === worldId);
}
