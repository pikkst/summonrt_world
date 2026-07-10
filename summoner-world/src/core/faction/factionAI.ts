import type { Faction, NPCFactionAlignment } from '../../types/game.ts';
import { FACTIONS } from '../../data/factions.ts';
import { worldEventBus } from '../worldEventBus.ts';

export const FACTION_POWER_MIN = 0;
export const FACTION_POWER_MAX = 100;
export const FACTION_POWER_NEUTRAL = 50;

const factionPowerState: Record<string, number> = {};

export function initializeFactionPower(): void {
  const entries = Object.entries(FACTIONS) as [keyof typeof FACTIONS, Faction][];
  for (const [key, faction] of entries) {
    factionPowerState[key] = faction.defaultPower;
    FACTIONS[key] = { ...faction, power: faction.defaultPower };
  }
}

function ensureInitialized(): void {
  if (Object.keys(factionPowerState).length === 0) {
    initializeFactionPower();
  }
}

export function getFactionPower(factionId: string): number {
  ensureInitialized();
  return factionPowerState[factionId] ?? FACTION_POWER_NEUTRAL;
}

export function getFactionObject(factionId: string): Faction | undefined {
  ensureInitialized();
  return FACTIONS[factionId];
}

export function getAllFactionPowers(): Record<string, number> {
  ensureInitialized();
  return { ...factionPowerState };
}

export function shiftFactionPower(factionId: string, delta: number, source: string): number {
  const current = getFactionPower(factionId);
  const next = clampFactionPower(current + delta);
  factionPowerState[factionId] = next;
  FACTIONS[factionId] = { ...(FACTIONS[factionId]!), power: next };

  worldEventBus.publish({
    type: 'FactionStandingChanged',
    factionId,
    previousPower: current,
    newPower: next,
    source,
    gameTimeMinutes: 0,
    turnCount: 0,
  });

  return next;
}

export function getFactionTone(factionIdA: string, factionIdB: string): number {
  const factionA = FACTIONS[factionIdA];
  const factionB = FACTIONS[factionIdB];
  if (!factionA || !factionB) return 0;

  if (factionA.opposingFactions?.includes(factionIdB)) return -40;
  if (factionA.id === factionIdB) return 30;
  if (factionA.alignment === factionB.alignment) return 15;
  return 0;
}

export function getNPCToneTowardFaction(npcAlignment: NPCFactionAlignment | undefined, factionId: string): number {
  if (!npcAlignment) return 0;
  if (npcAlignment.factionId === factionId) {
    return npcAlignment.loyalty > 0 ? 20 : npcAlignment.loyalty < 0 ? -20 : 0;
  }
  return getFactionTone(npcAlignment.factionId, factionId);
}

export function getNPCMerchantPriceModifier(npcAlignment: NPCFactionAlignment | undefined, factionId: string): number {
  const tone = getNPCToneTowardFaction(npcAlignment, factionId);
  const factionPower = getFactionPower(factionId);
  const powerFactor = (factionPower - FACTION_POWER_NEUTRAL) / 50;
  return clamp(0.85 + (tone / 200) + powerFactor * 0.05, 0.75, 1.25);
}

export function getNPCQuestAvailabilityBonus(npcAlignment: NPCFactionAlignment | undefined, factionId: string): number {
  const tone = getNPCToneTowardFaction(npcAlignment, factionId);
  const factionPower = getFactionPower(factionId);
  const powerFactor = (factionPower - FACTION_POWER_NEUTRAL) / 100;
  return clamp((tone / 100) + powerFactor, -0.3, 0.3);
}

function clampFactionPower(value: number): number {
  return Math.round(Math.max(FACTION_POWER_MIN, Math.min(FACTION_POWER_MAX, value)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
