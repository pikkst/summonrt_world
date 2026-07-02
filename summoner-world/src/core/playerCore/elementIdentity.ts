import type { Element, PlayerState } from '../../types/game';
import {
  getElementModifiers,
  isStarterElement,
  isQuestOnlyElement,
  getElementSkillDamagePct as getElementSkillDamagePctCore,
} from '../../data/playerElements';

export interface ElementCombatBonuses {
  skillDamagePct: number;
  elementDamageMultiplier: number;
}

export interface ElementAffinityBonuses {
  affinityPct: number;
  contractStabilityPct: number;
}

export interface ElementCraftingBonuses {
  craftingSuccessPct: number;
  equipmentScalingPct: number;
}

export function getElementCombatBonuses(element: Element | undefined): ElementCombatBonuses {
  if (!element) return { skillDamagePct: 0, elementDamageMultiplier: 1 };
  const modifiers = getElementModifiers(element);
  return {
    skillDamagePct: modifiers?.skillDamagePct ?? 0,
    elementDamageMultiplier: 1 + ((modifiers?.skillDamagePct ?? 0) / 100),
  };
}

export function getElementAffinityBonuses(element: Element | undefined): ElementAffinityBonuses {
  if (!element) return { affinityPct: 0, contractStabilityPct: 0 };
  const modifiers = getElementModifiers(element);
  return {
    affinityPct: modifiers?.creatureAffinityPct ?? 0,
    contractStabilityPct: modifiers?.contractStabilityPct ?? 0,
  };
}

export function getElementCraftingBonuses(element: Element | undefined): ElementCraftingBonuses {
  if (!element) return { craftingSuccessPct: 0, equipmentScalingPct: 0 };
  const modifiers = getElementModifiers(element);
  return {
    craftingSuccessPct: modifiers?.craftingSuccessPct ?? 0,
    equipmentScalingPct: modifiers?.equipmentScalingPct ?? 0,
  };
}

export function applyElementSkillDamageBoost(baseDamage: number, element: Element | undefined): number {
  if (!element) return baseDamage;
  const bonuses = getElementCombatBonuses(element);
  return Math.max(1, Math.floor(baseDamage * bonuses.elementDamageMultiplier));
}

export function applyElementAffinityBoost(_baseChance: number, element: Element | undefined): number {
  if (!element) return _baseChance;
  const bonuses = getElementAffinityBonuses(element);
  return Math.min(0.95, _baseChance + bonuses.affinityPct / 100);
}

export function applyElementContractStabilityBoost(_baseStability: number, element: Element | undefined): number {
  if (!element) return _baseStability;
  const bonuses = getElementAffinityBonuses(element);
  return Math.min(100, _baseStability + bonuses.contractStabilityPct);
}

export function applyElementCraftingBoost(baseSuccess: number, element: Element | undefined): number {
  if (!element) return baseSuccess;
  const bonuses = getElementCraftingBonuses(element);
  return Math.min(0.98, baseSuccess + bonuses.craftingSuccessPct / 100);
}

export function getElementSkillDamagePct(element: Element | undefined): number {
  if (!element) return 0;
  return getElementSkillDamagePctCore(element);
}

export function getElementDungeonRewardPct(element: Element | undefined): number {
  if (!element) return 0;
  const modifiers = getElementModifiers(element);
  return modifiers?.dungeonRewardPct ?? 0;
}

export function getElementNPCReactionPct(element: Element | undefined): number {
  if (!element) return 0;
  const modifiers = getElementModifiers(element);
  return modifiers?.npcReactionPct ?? 0;
}

export function getElementWorldTravelSpeedPct(element: Element | undefined): number {
  if (!element) return 0;
  const modifiers = getElementModifiers(element);
  return modifiers?.worldTravelSpeedPct ?? 0;
}

export function getElementPVPIdentityModifier(element: Element | undefined): number {
  if (!element) return 1;
  const modifiers = getElementModifiers(element);
  return modifiers?.pvpIdentityModifier ?? 1;
}

export function canObtainElement(element: Element, player: PlayerState | null): { allowed: boolean; reason?: string } {
  if (!player) return { allowed: false, reason: 'No player data' };

  const isStarter = isStarterElement(element);
  const isQuest = isQuestOnlyElement(element);
  const hasPlayerElement = player.affinity.learned?.includes(element) || player.affinity.primary === element;

  if (isStarter) {
    return { allowed: hasPlayerElement };
  }

  if (isQuest) {
    return { allowed: hasPlayerElement, reason: 'Quest-only elements must be unlocked through quest progression' };
  }

  const category = getElementCategory(element);
  if (category === 'endgame') {
    return { allowed: hasPlayerElement, reason: 'Endgame elements must be unlocked through endgame content' };
  }

  return { allowed: false, reason: 'Unknown element type' };
}

export function getElementCategory(element: Element): 'starter' | 'quest' | 'endgame' {
  const modifiers = getElementModifiers(element);
  if (!modifiers) return 'starter';
  return modifiers.contractStabilityPct >= 30 ? 'endgame' : (isQuestOnlyElement(element) ? 'quest' : 'starter');
}