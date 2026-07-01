import type { ClassDefinition, SummonerClassId } from './types';

export const SUMMONER_CLASSES: Record<SummonerClassId, ClassDefinition> = {
  beast_binder: {
    id: 'beast_binder',
    name: 'Beast Binder',
    description: 'Stronger creature bonds and contract stability',
    icon: '🐾',
    statBias: { strength: 2, dexterity: 1, luck: 1 },
    startingBonus: { items: [{ templateKey: 'soul_crystal_common', quantity: 3 }] },
  },
  elementalist: {
    id: 'elementalist',
    name: 'Elementalist',
    description: 'Stronger elemental scaling and spell access',
    icon: '🔥',
    statBias: { intelligence: 2, wisdom: 1, dexterity: 1 },
    startingBonus: { items: [{ templateKey: 'mana_crystal', quantity: 5 }] },
  },
  warden: {
    id: 'warden',
    name: 'Warden',
    description: 'Defensive play, survival, healing, protection',
    icon: '🛡️',
    statBias: { vitality: 2, strength: 1, defense: 1 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 5 }] },
  },
  ritualist: {
    id: 'ritualist',
    name: 'Ritualist',
    description: 'Advanced summoning, rare contracts, sacrifice mechanics',
    icon: '🔮',
    statBias: { intelligence: 2, wisdom: 2 },
    startingBonus: { money: 500, items: [{ templateKey: 'soul_crystal_common', quantity: 2 }] },
  },
  tactician: {
    id: 'tactician',
    name: 'Tactician',
    description: 'Command speed, formation bonuses, combat control',
    icon: '⚔️',
    statBias: { dexterity: 2, intelligence: 1, speed: 1 },
    startingBonus: { items: [{ templateKey: 'basic_food', quantity: 5 }] },
  },
  alchemist: {
    id: 'alchemist',
    name: 'Alchemist',
    description: 'Crafting, mutation, consumables, material conversion',
    icon: '⚗️',
    statBias: { intelligence: 2, dexterity: 1, wisdom: 1 },
    startingBonus: { money: 500, items: [{ templateKey: 'essence', quantity: 3 }] },
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Travel, exploration, scouting, world traversal',
    icon: '🗺️',
    statBias: { speed: 2, dexterity: 2 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 3 }] },
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    description: 'PvP, direct combat, elite single-creature synergy',
    icon: '🗡️',
    statBias: { strength: 2, speed: 2 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 3 }] },
  },
};

export type { ClassDefinition } from './types';
export type { SummonerClassId } from './types';

export function getClassById(id: SummonerClassId): ClassDefinition | undefined {
  return SUMMONER_CLASSES[id];
}

export function getAllClasses(): ClassDefinition[] {
  return Object.values(SUMMONER_CLASSES);
}

export interface ClassModifiers {
  statBias: ClassDefinition['statBias'];
  startingBonus: ClassDefinition['startingBonus'];
}

export function getClassModifiers(classId: SummonerClassId): ClassModifiers | undefined {
  const cls = SUMMONER_CLASSES[classId];
  if (!cls) return undefined;
  return {
    statBias: cls.statBias,
    startingBonus: cls.startingBonus,
  };
}
