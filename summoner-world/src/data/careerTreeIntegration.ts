import type { MissionModifiers } from '../core/missionQueue';

export interface CareerSystemBonuses {
  speed_multiplier?: number;
  tree_speed_pct?: number;
  caravan_speed_pct?: number;
  yield_bonus_pct?: number;
  creature_agility_mod?: number;
  crafting_speed_pct?: number;
  store_traffic_pct?: number;
  capture_rate_pct?: number;
  capture_bonus_pct?: number;
  fusion_success_chance?: number;
  fusion_timer_reduction_pct?: number;
  dual_element_chance?: number;
  damage_dealt_pct?: number;
  damage_taken_pct?: number;
  dungeon_speed_pct?: number;
  dungeon_reward_pct?: number;
  tax_revenue_pct?: number;
  public_order_pct?: number;
  settlement_upgrade_cost_pct?: number;
  selling_price_pct?: number;
  rare_item_sourcing_chance?: number;
  tariff_discount_pct?: number;
  arbitrage_opportunity_chance?: number;
  encounter_avoidance_chance?: number;
  map_reveal_radius?: number;
  secret_discovery_chance?: number;
  exploration_speed_pct?: number;
  smelting_speed_pct?: number;
  material_retention_chance?: number;
  creature_affection_gain_pct?: number;
  creature_xp_gain_pct?: number;
  xp_gain_pct?: number;
  unlocks_primal_fusion?: number;
  unlocks_global_market?: number;
  unlocks_trade_routes?: number;
  unlocks_policy_making?: number;
  energy_regen_pct?: number;
  nerve_regen_pct?: number;
  happy_regen_pct?: number;
  life_regen_pct?: number;
}

export function getCareerSystemBonuses(
  aggregatedStats: Record<string, number>
): CareerSystemBonuses {
  const bonuses: CareerSystemBonuses = {};

  if (aggregatedStats.exploration_speed_pct) {
    bonuses.exploration_speed_pct = aggregatedStats.exploration_speed_pct;
    bonuses.tree_speed_pct = aggregatedStats.exploration_speed_pct;
  }
  if (aggregatedStats.caravan_speed_pct) bonuses.caravan_speed_pct = aggregatedStats.caravan_speed_pct;
  if (aggregatedStats.yield_bonus_pct) bonuses.yield_bonus_pct = aggregatedStats.yield_bonus_pct;
  if (aggregatedStats.crafting_speed_pct) bonuses.crafting_speed_pct = aggregatedStats.crafting_speed_pct;
  if (aggregatedStats.store_traffic_pct) bonuses.store_traffic_pct = aggregatedStats.store_traffic_pct;
  if (aggregatedStats.capture_bonus_pct) bonuses.capture_bonus_pct = aggregatedStats.capture_bonus_pct;
  if (aggregatedStats.capture_rate_pct) bonuses.capture_rate_pct = aggregatedStats.capture_rate_pct;
  if (aggregatedStats.fusion_success_chance) bonuses.fusion_success_chance = aggregatedStats.fusion_success_chance;
  if (aggregatedStats.fusion_timer_reduction_pct) bonuses.fusion_timer_reduction_pct = aggregatedStats.fusion_timer_reduction_pct;
  if (aggregatedStats.dual_element_chance) bonuses.dual_element_chance = aggregatedStats.dual_element_chance;
  if (aggregatedStats.damage_dealt_pct) bonuses.damage_dealt_pct = aggregatedStats.damage_dealt_pct;
  if (aggregatedStats.damage_taken_pct) bonuses.damage_taken_pct = aggregatedStats.damage_taken_pct;
  if (aggregatedStats.dungeon_speed_pct) bonuses.dungeon_speed_pct = aggregatedStats.dungeon_speed_pct;
  if (aggregatedStats.dungeon_reward_pct) bonuses.dungeon_reward_pct = aggregatedStats.dungeon_reward_pct;
  if (aggregatedStats.tax_revenue_pct) bonuses.tax_revenue_pct = aggregatedStats.tax_revenue_pct;
  if (aggregatedStats.public_order_pct) bonuses.public_order_pct = aggregatedStats.public_order_pct;
  if (aggregatedStats.settlement_upgrade_cost_pct) bonuses.settlement_upgrade_cost_pct = aggregatedStats.settlement_upgrade_cost_pct;
  if (aggregatedStats.selling_price_pct) bonuses.selling_price_pct = aggregatedStats.selling_price_pct;
  if (aggregatedStats.rare_item_sourcing_chance) bonuses.rare_item_sourcing_chance = aggregatedStats.rare_item_sourcing_chance;
  if (aggregatedStats.tariff_discount_pct) bonuses.tariff_discount_pct = aggregatedStats.tariff_discount_pct;
  if (aggregatedStats.arbitrage_opportunity_chance) bonuses.arbitrage_opportunity_chance = aggregatedStats.arbitrage_opportunity_chance;
  if (aggregatedStats.encounter_avoidance_chance) bonuses.encounter_avoidance_chance = aggregatedStats.encounter_avoidance_chance;
  if (aggregatedStats.map_reveal_radius) bonuses.map_reveal_radius = aggregatedStats.map_reveal_radius;
  if (aggregatedStats.secret_discovery_chance) bonuses.secret_discovery_chance = aggregatedStats.secret_discovery_chance;
  if (aggregatedStats.smelting_speed_pct) bonuses.smelting_speed_pct = aggregatedStats.smelting_speed_pct;
  if (aggregatedStats.material_retention_chance) bonuses.material_retention_chance = aggregatedStats.material_retention_chance;
  if (aggregatedStats.creature_affection_gain_pct) bonuses.creature_affection_gain_pct = aggregatedStats.creature_affection_gain_pct;
  if (aggregatedStats.creature_xp_gain_pct) bonuses.creature_xp_gain_pct = aggregatedStats.creature_xp_gain_pct;
  if (aggregatedStats.xp_gain_pct) bonuses.xp_gain_pct = aggregatedStats.xp_gain_pct;
  if (aggregatedStats.unlocks_primal_fusion) bonuses.unlocks_primal_fusion = aggregatedStats.unlocks_primal_fusion;
  if (aggregatedStats.unlocks_global_market) bonuses.unlocks_global_market = aggregatedStats.unlocks_global_market;
  if (aggregatedStats.unlocks_trade_routes) bonuses.unlocks_trade_routes = aggregatedStats.unlocks_trade_routes;
  if (aggregatedStats.unlocks_policy_making) bonuses.unlocks_policy_making = aggregatedStats.unlocks_policy_making;
  if (aggregatedStats.energy_regen_pct) bonuses.energy_regen_pct = aggregatedStats.energy_regen_pct;
  if (aggregatedStats.nerve_regen_pct) bonuses.nerve_regen_pct = aggregatedStats.nerve_regen_pct;
  if (aggregatedStats.happy_regen_pct) bonuses.happy_regen_pct = aggregatedStats.happy_regen_pct;
  if (aggregatedStats.life_regen_pct) bonuses.life_regen_pct = aggregatedStats.life_regen_pct;

  return bonuses;
}

export function getCareerModifiers(
  aggregatedStats: Record<string, number>
): MissionModifiers & Partial<CareerSystemBonuses> {
  const bonuses = getCareerSystemBonuses(aggregatedStats);
  const modifiers: MissionModifiers & Partial<CareerSystemBonuses> = {};

  if (bonuses.tree_speed_pct) modifiers.tree_speed_pct = bonuses.tree_speed_pct;
  if (bonuses.caravan_speed_pct) modifiers.caravan_speed_pct = bonuses.caravan_speed_pct;
  if (bonuses.yield_bonus_pct) modifiers.yield_bonus_pct = bonuses.yield_bonus_pct;
  if (bonuses.crafting_speed_pct) modifiers.crafting_speed_pct = bonuses.crafting_speed_pct;
  if (bonuses.store_traffic_pct) modifiers.store_traffic_pct = bonuses.store_traffic_pct;
  if (bonuses.creature_agility_mod !== undefined) modifiers.creature_agility_mod = bonuses.creature_agility_mod;

  return modifiers;
}

export function applyCombatCareerBonuses(
  baseDamage: number,
  bonuses: CareerSystemBonuses
): number {
  const damageDealtMult = 1 + ((bonuses.damage_dealt_pct || 0) / 100);
  return Math.max(1, Math.floor(baseDamage * damageDealtMult));
}

export function applyDamageTakenReduction(
  incomingDamage: number,
  bonuses: CareerSystemBonuses
): number {
  const damageTakenMult = 1 - ((bonuses.damage_taken_pct || 0) / 100);
  return Math.max(1, Math.floor(incomingDamage * damageTakenMult));
}

export function applyCaptureRateBonus(
  baseCaptureChance: number,
  bonuses: CareerSystemBonuses
): number {
  const bonus = (bonuses.capture_rate_pct || 0) + (bonuses.capture_bonus_pct || 0);
  return Math.min(0.95, baseCaptureChance + bonus / 100);
}

export function applyXPBoost(
  baseXP: number,
  bonuses: CareerSystemBonuses
): number {
  const boost = 1 + ((bonuses.xp_gain_pct || bonuses.creature_xp_gain_pct || 0) / 100);
  return Math.floor(baseXP * boost);
}
