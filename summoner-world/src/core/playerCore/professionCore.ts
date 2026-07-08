import type { PlayerCoreState, ProfessionId, ProfessionProgression, ProfessionState } from '../../types/playerCore.ts';

export interface ProfessionPerkDefinition {
  id: string;
  levelRequired: number;
  bonuses: Record<string, number>;
}

export interface ProfessionDefinition {
  id: ProfessionId;
  name: string;
  description: string;
  xpSources: ProfessionXpSource[];
  perks: ProfessionPerkDefinition[];
}

export type ProfessionXpSource =
  | 'smelting_completed'
  | 'item_crafted'
  | 'tile_explored'
  | 'secret_discovered'
  | 'store_sale'
  | 'bulk_sale'
  | 'trade_route_completed'
  | 'arbitrage_completed'
  | 'tax_collected'
  | 'policy_enacted'
  | 'creature_contracted'
  | 'summoning_completed';

export const PROFESSION_LEVEL_CAP = 100;
export const PROFESSION_BASE_XP = 100;
export const PROFESSION_XP_GROWTH = 1.18;

export const PROFESSION_DEFINITIONS: Record<ProfessionId, ProfessionDefinition> = {
  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith',
    description: 'Progresses through smelting, forging, and material refinement.',
    xpSources: ['smelting_completed', 'item_crafted'],
    perks: [
      { id: 'blacksmith_apprentice_smelter', levelRequired: 2, bonuses: { smelting_speed_pct: 5 } },
      { id: 'blacksmith_forge_efficiency', levelRequired: 5, bonuses: { crafting_speed_pct: 5 } },
      { id: 'blacksmith_masterwork_chance', levelRequired: 10, bonuses: { material_retention_chance: 3 } },
    ],
  },
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Progresses through travel, mapping, scouting, and discoveries.',
    xpSources: ['tile_explored', 'secret_discovered'],
    perks: [
      { id: 'explorer_pathfinder', levelRequired: 2, bonuses: { exploration_speed_pct: 5 } },
      { id: 'explorer_surveyor', levelRequired: 5, bonuses: { map_reveal_radius: 1 } },
      { id: 'explorer_secret_sense', levelRequired: 10, bonuses: { secret_discovery_chance: 3 } },
    ],
  },
  shopkeeper: {
    id: 'shopkeeper',
    name: 'Shopkeeper',
    description: 'Progresses through storefront sales and customer flow.',
    xpSources: ['store_sale', 'bulk_sale'],
    perks: [
      { id: 'shopkeeper_quick_service', levelRequired: 2, bonuses: { store_traffic_pct: 5 } },
      { id: 'shopkeeper_better_margins', levelRequired: 5, bonuses: { selling_price_pct: 3 } },
      { id: 'shopkeeper_rare_sourcing', levelRequired: 10, bonuses: { rare_item_sourcing_chance: 2 } },
    ],
  },
  broker: {
    id: 'broker',
    name: 'Broker',
    description: 'Progresses through trade routes, tariffs, and arbitrage.',
    xpSources: ['trade_route_completed', 'arbitrage_completed'],
    perks: [
      { id: 'broker_route_planner', levelRequired: 2, bonuses: { caravan_speed_pct: 5 } },
      { id: 'broker_tariff_negotiator', levelRequired: 5, bonuses: { tariff_discount_pct: 3 } },
      { id: 'broker_arbitrage_reader', levelRequired: 10, bonuses: { arbitrage_opportunity_chance: 3 } },
    ],
  },
  official: {
    id: 'official',
    name: 'Official',
    description: 'Progresses through policy, taxation, and settlement administration.',
    xpSources: ['tax_collected', 'policy_enacted'],
    perks: [
      { id: 'official_tax_clerk', levelRequired: 2, bonuses: { tax_revenue_pct: 5 } },
      { id: 'official_civic_order', levelRequired: 5, bonuses: { public_order_pct: 3 } },
      { id: 'official_builder_permits', levelRequired: 10, bonuses: { settlement_upgrade_cost_pct: -3 } },
    ],
  },
  summoner: {
    id: 'summoner',
    name: 'Summoner',
    description: 'Progresses through creature contracts, summoning, and bond mastery.',
    xpSources: ['creature_contracted', 'summoning_completed'],
    perks: [
      { id: 'summoner_contract_affinity', levelRequired: 2, bonuses: { capture_bonus_pct: 5 } },
      { id: 'summoner_bond_training', levelRequired: 5, bonuses: { creature_affection_gain_pct: 5 } },
      { id: 'summoner_command_mastery', levelRequired: 10, bonuses: { creature_xp_gain_pct: 3 } },
    ],
  },
};

export const PROFESSION_IDS = Object.keys(PROFESSION_DEFINITIONS) as ProfessionId[];

export function createDefaultProfessionProgression(professionId: ProfessionId): ProfessionProgression {
  return {
    professionId,
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    unlockedPerkIds: [],
  };
}

export function createDefaultProfessionState(activeProfessionId: ProfessionId = 'summoner'): ProfessionState {
  return {
    activeProfessionId,
    entries: Object.fromEntries(
      PROFESSION_IDS.map((professionId) => [professionId, createDefaultProfessionProgression(professionId)])
    ) as Record<ProfessionId, ProfessionProgression>,
  };
}

export function getProfessionXpRequiredForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level));
  if (normalizedLevel >= PROFESSION_LEVEL_CAP) return Number.POSITIVE_INFINITY;
  return Math.floor(PROFESSION_BASE_XP * PROFESSION_XP_GROWTH ** (normalizedLevel - 1));
}

export function addProfessionXp(
  state: ProfessionState,
  professionId: ProfessionId,
  amount: number,
  advancedAt?: number
): ProfessionState {
  const current = normalizeProfessionProgression(state.entries[professionId], professionId);
  const xpGain = normalizeXpAmount(amount);
  if (xpGain === 0) return normalizeProfessionState(state);

  let level = current.level;
  let xp = current.xp + xpGain;
  while (level < PROFESSION_LEVEL_CAP) {
    const required = getProfessionXpRequiredForLevel(level);
    if (xp < required) break;
    xp -= required;
    level += 1;
  }

  if (level >= PROFESSION_LEVEL_CAP) {
    level = PROFESSION_LEVEL_CAP;
    xp = 0;
  }

  const nextProgression = refreshProfessionPerks({
    ...current,
    level,
    xp,
    totalXpEarned: current.totalXpEarned + xpGain,
    lastAdvancedAt: advancedAt ?? current.lastAdvancedAt,
  });

  return {
    ...normalizeProfessionState(state),
    entries: {
      ...normalizeProfessionState(state).entries,
      [professionId]: nextProgression,
    },
  };
}

export function addPlayerProfessionXp(
  player: PlayerCoreState,
  professionId: ProfessionId,
  amount: number,
  advancedAt?: number
): PlayerCoreState {
  return {
    ...player,
    professions: addProfessionXp(normalizeProfessionState(player.professions), professionId, amount, advancedAt),
  };
}

export function setActiveProfession(state: ProfessionState, professionId: ProfessionId): ProfessionState {
  return {
    ...normalizeProfessionState(state),
    activeProfessionId: professionId,
  };
}

export function getProfessionAggregateBonuses(state: ProfessionState): Record<string, number> {
  const normalized = normalizeProfessionState(state);
  return PROFESSION_IDS.reduce<Record<string, number>>((bonuses, professionId) => {
    const progression = normalized.entries[professionId];
    const definition = PROFESSION_DEFINITIONS[professionId];
    for (const perkId of progression.unlockedPerkIds) {
      const perk = definition.perks.find((candidate) => candidate.id === perkId);
      if (!perk) continue;
      for (const [key, value] of Object.entries(perk.bonuses)) {
        bonuses[key] = (bonuses[key] ?? 0) + value;
      }
    }
    return bonuses;
  }, {});
}

export function normalizeProfessionState(value: unknown): ProfessionState {
  const raw = isRecord(value) ? value : {};
  const entries = isRecord(raw.entries) ? raw.entries : {};
  const activeProfessionId = isProfessionId(raw.activeProfessionId) ? raw.activeProfessionId : 'summoner';
  return {
    activeProfessionId,
    entries: Object.fromEntries(
      PROFESSION_IDS.map((professionId) => [
        professionId,
        normalizeProfessionProgression(entries[professionId], professionId),
      ])
    ) as Record<ProfessionId, ProfessionProgression>,
  };
}

export function isProfessionId(value: unknown): value is ProfessionId {
  return typeof value === 'string' && value in PROFESSION_DEFINITIONS;
}

function normalizeProfessionProgression(
  value: unknown,
  professionId: ProfessionId
): ProfessionProgression {
  const raw = isRecord(value) ? value : {};
  const level = clampLevel(raw.level);
  const progression = {
    professionId,
    level,
    xp: normalizeXpAmount(raw.xp),
    totalXpEarned: normalizeXpAmount(raw.totalXpEarned),
    unlockedPerkIds: Array.isArray(raw.unlockedPerkIds) ? raw.unlockedPerkIds.filter(isKnownPerkId) : [],
    lastAdvancedAt: typeof raw.lastAdvancedAt === 'number' && Number.isFinite(raw.lastAdvancedAt)
      ? Math.max(0, Math.floor(raw.lastAdvancedAt))
      : undefined,
  };
  return refreshProfessionPerks(progression);
}

function refreshProfessionPerks(progression: ProfessionProgression): ProfessionProgression {
  const definition = PROFESSION_DEFINITIONS[progression.professionId];
  const unlockedPerkIds = definition.perks
    .filter((perk) => progression.level >= perk.levelRequired)
    .map((perk) => perk.id);

  return {
    ...progression,
    unlockedPerkIds,
  };
}

function isKnownPerkId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return PROFESSION_IDS.some((professionId) =>
    PROFESSION_DEFINITIONS[professionId].perks.some((perk) => perk.id === value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeXpAmount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function clampLevel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.min(PROFESSION_LEVEL_CAP, Math.max(1, Math.floor(value)));
}
