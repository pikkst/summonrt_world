import type { TownHallPolicy, TownHallPolicyType } from '../../types/structure';
import type { PlayerCoreState } from '../../types/playerCore';
import { getTownHallPassiveIncomeBonus, getActiveTownHallPolicies, getTownHallPolicyEffect } from '../../types/structure';

export function getTradeTariffDiscount(bonuses: { trade_cost_pct?: number }): number {
  return bonuses.trade_cost_pct ?? 0;
}

export function getCreatureProtectionBonus(bonuses: { creature_capture_pct?: number }): number {
  return bonuses.creature_capture_pct ?? 0;
}

export function getPassiveIncomeBonusPct(policies: TownHallPolicy[] | undefined): number {
  if (!policies) return 0;
  const activeFestival = policies.some((p) => p.type === 'festival_bonus' && p.active);
  if (!activeFestival) return 0;
  return 15;
}

export function calculateTownHallIncomeBonus(playerCore: PlayerCoreState): number {
  const townHallLevel = playerCore.housing.structures
    .filter((s) => s.type === 'town')
    .reduce((max, s) => Math.max(max, s.level), 0);
  return getTownHallPassiveIncomeBonus(townHallLevel);
}

export function calculateActivePolicyMultipliers(policies: TownHallPolicy[] | undefined): number {
  const activePolicies = getActiveTownHallPolicies(policies);
  let incomeMultiplier = 1;

  for (const policy of activePolicies) {
    if (policy.type === 'festival_bonus') {
      incomeMultiplier += 15 / 100;
    }
  }

  return incomeMultiplier;
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
