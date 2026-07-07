import type { TownHallPolicy, TownHallPolicyType, TownHallPolicyEffect } from '../../types/structure';
import type { PlayerCoreState } from '../../types/playerCore';
import { getActiveTownHallPolicies, getTownHallPolicyEffect } from '../../types/structure';
import { calculateTownHallIncomeBonus, calculateActivePolicyMultipliers } from './housingEconomy';

export function getTradeTariffDiscount(bonuses: { trade_cost_pct?: number }): number {
  return bonuses.trade_cost_pct ?? 0;
}

export function getCreatureProtectionBonus(bonuses: { creature_capture_pct?: number }): number {
  return bonuses.creature_capture_pct ?? 0;
}

export function getTownHallEffectSummary(playerCore: PlayerCoreState): Array<{
  policy: TownHallPolicyType;
  active: boolean;
  bonusPct: number;
  category: string;
}> {
  const policies = playerCore.housing.townHallPolicies;
  if (!policies || policies.length === 0) return [];

  return policies.map((p) => {
    const effect = getTownHallPolicyEffect(p.type);
    return {
      policy: p.type,
      active: p.active,
      bonusPct: effect.bonusPct,
      category: effect.category,
    };
  });
}
