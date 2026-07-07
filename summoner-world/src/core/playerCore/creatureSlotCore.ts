import type { CreatureSlotType, CreatureSlotGroup, CreatureSlots, PlayerCoreState } from '../../types/playerCore.ts';

export const CREATURE_SLOT_TYPES: CreatureSlotType[] = [
  'active_combat',
  'reserve',
  'utility',
  'housing',
  'marketplace',
  'breeding',
];

export const BASE_SLOT_COUNTS: Record<CreatureSlotType, number> = {
  active_combat: 3,
  reserve: 3,
  utility: 2,
  housing: 2,
  marketplace: 1,
  breeding: 1,
};

export function createDefaultCreatureSlots(): CreatureSlots {
  return {
    groups: CREATURE_SLOT_TYPES.map((type) => ({
      type,
      max: BASE_SLOT_COUNTS[type],
      assigned: [],
    })),
  };
}

export function createEmptyCreatureSlots(
  overrides: Partial<Record<CreatureSlotType, number>> = {}
): CreatureSlots {
  return {
    groups: CREATURE_SLOT_TYPES.map((type) => ({
      type,
      max: overrides[type] ?? BASE_SLOT_COUNTS[type],
      assigned: [],
    })),
  };
}

export function getSlotGroup(
  slots: CreatureSlots,
  type: CreatureSlotType
): CreatureSlotGroup | undefined {
  return slots.groups.find((group) => group.type === type);
}

export function getAvailableSlots(
  slots: CreatureSlots,
  type: CreatureSlotType
): number {
  const group = getSlotGroup(slots, type);
  if (!group) return 0;
  return Math.max(0, group.max - group.assigned.length);
}

export function isSlotFull(slots: CreatureSlots, type: CreatureSlotType): boolean {
  return getAvailableSlots(slots, type) <= 0;
}

export function getTotalMaxSlots(slots: CreatureSlots): number {
  return slots.groups.reduce((sum, group) => sum + group.max, 0);
}

export function getUsedSlotCount(slots: CreatureSlots): number {
  return slots.groups.reduce((sum, group) => sum + group.assigned.length, 0);
}

export function assignCreatureToSlot(
  slots: CreatureSlots,
  type: CreatureSlotType,
  creatureContractId: string
): { slots: CreatureSlots; assigned: boolean } {
  const group = getSlotGroup(slots, type);
  if (!group || group.assigned.length >= group.max) {
    return { slots, assigned: false };
  }

  const updatedGroups = slots.groups.map((g) =>
    g.type === type
      ? { ...g, assigned: [...g.assigned, creatureContractId] }
      : g
  );

  return { slots: { ...slots, groups: updatedGroups }, assigned: true };
}

export function removeCreatureFromSlot(
  slots: CreatureSlots,
  type: CreatureSlotType,
  creatureContractId: string
): { slots: CreatureSlots; removed: boolean } {
  const group = getSlotGroup(slots, type);
  if (!group || !group.assigned.includes(creatureContractId)) {
    return { slots, removed: false };
  }

  const updatedGroups = slots.groups.map((g) =>
    g.type === type
      ? { ...g, assigned: g.assigned.filter((id) => id !== creatureContractId) }
      : g
  );

  return { slots: { ...slots, groups: updatedGroups }, removed: true };
}

export function moveCreatureBetweenSlots(
  slots: CreatureSlots,
  fromType: CreatureSlotType,
  toType: CreatureSlotType,
  creatureContractId: string
): { slots: CreatureSlots; moved: boolean } {
  if (fromType === toType) {
    return { slots, moved: false };
  }

  const fromGroup = getSlotGroup(slots, fromType);
  const toGroup = getSlotGroup(slots, toType);

  if (
    !fromGroup ||
    !toGroup ||
    !fromGroup.assigned.includes(creatureContractId) ||
    toGroup.assigned.length >= toGroup.max
  ) {
    return { slots, moved: false };
  }

  const updatedGroups = slots.groups.map((g) => {
    if (g.type === fromType) {
      return { ...g, assigned: g.assigned.filter((id) => id !== creatureContractId) };
    }
    if (g.type === toType) {
      return { ...g, assigned: [...g.assigned, creatureContractId] };
    }
    return g;
  });

  return { slots: { ...slots, groups: updatedGroups }, moved: true };
}

export function getAssignedCreatures(
  slots: CreatureSlots,
  type: CreatureSlotType
): string[] {
  const group = getSlotGroup(slots, type);
  return group ? [...group.assigned] : [];
}

export function expandSlots(
  slots: CreatureSlots,
  type: CreatureSlotType,
  amount: number
): CreatureSlots {
  if (amount <= 0) return slots;

  const updatedGroups = slots.groups.map((g) =>
    g.type === type ? { ...g, max: g.max + amount } : g
  );

  return { ...slots, groups: updatedGroups };
}

export function expandAllSlots(
  slots: CreatureSlots,
  amount: number
): CreatureSlots {
  if (amount <= 0) return slots;

  const updatedGroups = slots.groups.map((g) => ({
    ...g,
    max: g.max + amount,
  }));

  return { ...slots, groups: updatedGroups };
}

export function calculateSlotExpansionFromLevel(
  level: number,
  type: CreatureSlotType
): number {
  if (level <= 1) return 0;

  let points = 0;
  const tiers = Math.floor((level - 1) / 10);

  switch (type) {
    case 'active_combat':
      points = Math.min(tiers, 5);
      break;
    case 'reserve':
      points = Math.min(Math.floor((level - 1) / 5), 10);
      break;
    case 'utility':
      points = Math.min(Math.floor(level / 15), 4);
      break;
    case 'housing':
      points = Math.min(Math.floor(level / 20), 5);
      break;
    case 'marketplace':
      points = Math.min(Math.floor(level / 25), 3);
      break;
    case 'breeding':
      points = Math.min(Math.floor(level / 30), 3);
      break;
    default:
      return 0;
  }

  return points;
}

export function calculateSlotExpansionFromEquipment(
  modifiers: Record<string, number> | undefined
): Record<CreatureSlotType, number> {
  const result: Record<CreatureSlotType, number> = {
    active_combat: 0,
    reserve: 0,
    utility: 0,
    housing: 0,
    marketplace: 0,
    breeding: 0,
  };

  if (!modifiers) return result;

  for (const [key, value] of Object.entries(modifiers)) {
    if (key.startsWith('creature_slot_')) {
      const slotType = key.replace('creature_slot_', '') as CreatureSlotType;
      if (CREATURE_SLOT_TYPES.includes(slotType)) {
        result[slotType] += value;
      }
    }
  }

  return result;
}

export function calculateSlotExpansionFromHousing(
  playerCore: PlayerCoreState
): Record<CreatureSlotType, number> {
  const result: Record<CreatureSlotType, number> = {
    active_combat: 0,
    reserve: 0,
    utility: 0,
    housing: 0,
    marketplace: 0,
    breeding: 0,
  };

  for (const structure of playerCore.housing.structures) {
    const level = structure.level;
    result.active_combat += Math.floor(level / 3);
    result.reserve += Math.floor(level / 2);
    result.utility += Math.floor(level / 4);
    result.housing += level;
    result.marketplace += Math.floor(level / 2);
    result.breeding += Math.floor(level / 3);
  }

  return result;
}

export function calculateSlotExpansionFromGuild(
  _guildBonus: unknown
): Record<CreatureSlotType, number> {
  return {
    active_combat: 0,
    reserve: 0,
    utility: 0,
    housing: 0,
    marketplace: 0,
    breeding: 0,
  };
}

export function getFullSlotExpansion(
  level: number,
  modifiers: Record<string, number> | undefined,
  playerCore: PlayerCoreState,
  _guildBonus: unknown
): Record<CreatureSlotType, number> {
  const levelExp = CREATURE_SLOT_TYPES.reduce(
    (acc, type) => {
      acc[type] = calculateSlotExpansionFromLevel(level, type);
      return acc;
    },
    {} as Record<CreatureSlotType, number>
  );

  const equipExp = calculateSlotExpansionFromEquipment(modifiers);
  const housingExp = calculateSlotExpansionFromHousing(playerCore);
  const guildExp = calculateSlotExpansionFromGuild(_guildBonus);

  return CREATURE_SLOT_TYPES.reduce(
    (acc, type) => {
      acc[type] =
        (levelExp[type] || 0) +
        (equipExp[type] || 0) +
        (housingExp[type] || 0) +
        (guildExp[type] || 0);
      return acc;
    },
    {} as Record<CreatureSlotType, number>
  );
}
