import type { Element } from '../../types/game';
import type { ElementIdentity, ElementIdentityModifiers, StarterElement, QuestOnlyElement } from './types';
import { ELEMENT_IDENTITY, STARTER_ELEMENTS, QUEST_ONLY_ELEMENTS, WORLD_100_ELEMENT } from './types';

export function getElementIdentity(element: Element): ElementIdentity | undefined {
  return ELEMENT_IDENTITY[element];
}

export function getStarterElements(): StarterElement[] {
  return STARTER_ELEMENTS;
}

export function getQuestOnlyElements(): QuestOnlyElement[] {
  return QUEST_ONLY_ELEMENTS;
}

export function getWorld100Element(): typeof WORLD_100_ELEMENT {
  return WORLD_100_ELEMENT;
}

export function isStarterElement(element: Element): boolean {
  return STARTER_ELEMENTS.includes(element as StarterElement);
}

export function isQuestOnlyElement(element: Element): boolean {
  return QUEST_ONLY_ELEMENTS.includes(element as QuestOnlyElement);
}

export function getElementModifiers(element: Element | undefined): ElementIdentityModifiers | undefined {
  if (!element) return undefined;
  const identity = ELEMENT_IDENTITY[element];
  return identity?.modifiers;
}

export function getElementModifier(element: Element | undefined, key: keyof ElementIdentityModifiers): number {
  if (!element) return 0;
  const modifiers = getElementModifiers(element);
  return modifiers?.[key] ?? 0;
}

export function getElementSkillDamagePct(element: Element | undefined): number {
  return getElementModifier(element, 'skillDamagePct');
}

export function getElementCreatureAffinityPct(element: Element | undefined): number {
  return getElementModifier(element, 'creatureAffinityPct');
}

export function getElementContractStabilityPct(element: Element | undefined): number {
  return getElementModifier(element, 'contractStabilityPct');
}

export function getElementEquipmentScalingPct(element: Element | undefined): number {
  return getElementModifier(element, 'equipmentScalingPct');
}

export function getElementCraftingSuccessPct(element: Element | undefined): number {
  return getElementModifier(element, 'craftingSuccessPct');
}

export function getElementDungeonRewardPct(element: Element | undefined): number {
  return getElementModifier(element, 'dungeonRewardPct');
}

export function getElementNPCReactionPct(element: Element | undefined): number {
  return getElementModifier(element, 'npcReactionPct');
}

export function getElementWorldTravelSpeedPct(element: Element | undefined): number {
  return getElementModifier(element, 'worldTravelSpeedPct');
}

export function getElementPVPIdentityModifier(element: Element | undefined): number {
   return getElementModifier(element, 'pvpIdentityModifier');
 }

export * from './types';