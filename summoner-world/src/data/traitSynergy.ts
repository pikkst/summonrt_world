export interface TraitSynergy {
  key: string;
  name: string;
  description: string;
  effect: {
    statBonuses?: Record<string, number>;
    skillBonuses?: Record<string, number>;
    special?: string;
    elementAffinity?: Record<string, number>;
    modifier?: string;
  };
}

export const TRAIT_SYNERGIES: TraitSynergy[] = [
  { key: 'poison_regeneration', name: 'Acidic Recovery', description: 'Regeneration + Poison immunity creates corrosive self-healing', effect: { statBonuses: { attack: 5 }, special: 'Acidic touch on melee attacks' } },
  { key: 'nature_regeneration', name: 'Rapid Regeneration', description: 'Regeneration + Nature amplifies healing rate', effect: { statBonuses: { healthRegen: 10 } } },
  { key: 'sturdy_tough', name: 'Impenetrable Defense', description: 'Tough Skin + Sturdy grants exceptional armor', effect: { statBonuses: { defense: 8 } } },
  { key: 'agile_swift', name: 'Blinding Speed', description: 'Swiftness + Agile makes this creature incredibly fast', effect: { statBonuses: { speed: 8, dodge: 15 } } },
  { key: 'strong_might', name: 'Colossal Power', description: 'Strength + Might doubles physical damage', effect: { statBonuses: { attack: 10 } } },
  { key: 'magic_affinity_arcane', name: 'Mana Overflow', description: 'Mana Well + Arcane Mastery creates infinite mana potential', effect: { statBonuses: { manaRegen: 15, maxMana: 20 } } },
  { key: 'vampire_lifesteal', name: 'Bloodthirst', description: 'Vampire + Lifesteal drains excessive life from foes', effect: { statBonuses: { attack: 5 }, special: 'Heals 25% of damage dealt' } },
  { key: 'fire_blast_flame_body', name: 'Inferno Aura', description: 'Fire Blast + Flame Body creates persistent burn effects', effect: { statBonuses: { attack: 3 }, special: 'Burns nearby enemies each turn' } },
  { key: 'ice_shard_frozen', name: 'Permafrost Core', description: 'Ice Shard + Frozen grants slowing aura', effect: { statBonuses: { defense: 5 }, special: 'Slows enemy speed by 20%' } },
  { key: 'lightning_static_shock', name: 'Electrostatic Field', description: 'Spark + Static generates random electric shocks', effect: { statBonuses: { speed: 5 }, special: '30% chance to shock attacker' } },
  { key: 'battle_frenzy_rage', name: 'Berserker Fury', description: 'Battle Frenzy + Rage increases damage as HP drops', effect: { statBonuses: { attack: 15 }, special: 'Attack increases by 1% per 2% missing HP' } },
  { key: 'defender_protect', name: 'Shield Wall', description: 'Defender + Protect halves damage for allies', effect: { statBonuses: { defense: 5 }, special: 'Reduces party damage taken by 25%' } },
  { key: 'healer_restoration', name: 'Divine Blessing', description: 'Healer + Restoration doubles healing effectiveness', effect: { statBonuses: { mana: 10 }, special: 'Healing spells restore 2x HP' } },
  { key: 'berserker_fatal_precision', name: 'Executioner', description: 'Berserker + Fatal Precision executes low-HP foes', effect: { statBonuses: { attack: 12 }, special: 'Attacks deal 2x damage to targets below 30% HP' } },
  { key: 'stealth_shadow_step', name: 'Phase Strike', description: 'Stealth + Shadow Step grants guaranteed first strike', effect: { statBonuses: { speed: 10 }, special: 'First attack cannot be countered' } },
  { key: 'poison_toxic', name: 'Deadly Poison', description: 'Poison + Toxic reduces enemy healing by 50%', effect: { statBonuses: { attack: 4 }, special: 'Poison stacks reduce healing received' } },
  { key: 'sturdy_rock_skin', name: 'Living Fortress', description: 'Sturdy + Rock Skin grants physical immunity', effect: { statBonuses: { defense: 12 }, special: 'Reduces physical damage by 75%' } },
  { key: 'agile_acrobat', name: 'Evasive Mastery', description: 'Agile + Acrobat grants 50% dodge chance', effect: { statBonuses: { speed: 6 }, special: '75% chance to dodge physical attacks' } },
  { key: 'might_power_attack', name: 'Devastating Blow', description: 'Might + Power Attack deals massive damage', effect: { statBonuses: { attack: 15 }, special: 'Critical hits deal 3x damage' } },
  { key: 'arcane_manafont', name: 'Spell Mastery', description: 'Arcane + Manafont reduces spell costs by 30%', effect: { statBonuses: { maxMana: 15 }, special: 'Reduces skill cost by 30%' } },
  { key: 'lifesteal_vampiric', name: 'Soul Drain', description: 'Lifesteal + Vampiric drains both HP and mana', effect: { statBonuses: { attack: 6 }, special: 'Drains 15% enemy mana on attack' } },
  { key: 'flame_body_fire_boost', name: 'Blazing Strength', description: 'Flame Body + Fire Boost increases fire damage by 50%', effect: { statBonuses: { attack: 5, fireDamage: 20 }, special: 'Fire spells deal 1.5x damage' } },
  { key: 'frozen_ice_barrier', name: 'Glacial Defense', description: 'Frozen + Ice Barrier reflects ice attacks', effect: { statBonuses: { defense: 8, iceDamage: -10 }, special: 'Reflects 25% ice damage back to attacker' } },
  { key: 'static_shock_lightning_boost', name: 'Storm Call', description: 'Static + Lightning Boost increases critical chance', effect: { statBonuses: { speed: 5, critChance: 15 }, special: '20% chance to crit with lightning skills' } },
  { key: 'battle_frenzy_unstop', name: 'Unstoppable Rage', description: 'Battle Frenzy + Unstoppable prevents status effects', effect: { statBonuses: { attack: 10 }, special: 'Immune to sleep, paralysis, and confusion' } },
  { key: 'protect_shield_wall', name: 'Aegis Protection', description: 'Protect + Shield Wall grants damage reduction', effect: { statBonuses: { defense: 10 }, special: 'Allies take 30% reduced damage' } },
  { key: 'restoration_healing_hands', name: 'Miracle Healing', description: 'Restoration + Healing Hands revives fallen allies', effect: { statBonuses: { maxMana: 20 }, special: 'Healing spells can revive KO\'d allies once' } },
  { key: 'rage_berserk', name: 'Reckless Abandon', description: 'Rage + Berserk trades defense for attack', effect: { statBonuses: { attack: 18, defense: -5 }, special: 'Cannot block, but attacks deal 2.5x damage' } },
  { key: 'fatal_precision_dead_eye', name: 'Dead Eye', description: 'Fatal Precision + Dead Eye guarantees crit on low HP', effect: { statBonuses: { attack: 8 }, special: 'Always crits on enemies below 40% HP' } },
  { key: 'shadow_step_void_walk', name: 'Phase Out', description: 'Shadow Step + Void Walk grants evasion', effect: { statBonuses: { speed: 8 }, special: '50% chance to dodge all attacks' } },
  { key: 'toxic_poison_mist', name: 'Poison Cloud', description: 'Toxic + Poison Mist poisons entire enemy team', effect: { statBonuses: { attack: 4 }, special: 'All enemies start poisoned' } },
  { key: 'rock_skin_stone_skin', name: 'Diamond Hide', description: 'Rock Skin + Stone Skin grants maximum defense', effect: { statBonuses: { defense: 15 }, special: 'Reduces all damage by 60%' } },
  { key: 'acrobat_nimble_escape', name: 'Master Evasion', description: 'Acrobat + Nimble Escape grants full evasion', effect: { statBonuses: { speed: 10 }, special: 'Dodges all non-magical attacks' } },
  { key: 'power_attack_lethal', name: 'One Hit Wonder', description: 'Power Attack + Lethal has 30% instant kill chance', effect: { statBonuses: { attack: 20 }, special: '30% chance to instantly KO enemies below 20% HP' } },
  { key: 'manafont_spell_flow', name: 'Infinite Cast', description: 'Manafont + Spell Flow restores mana each turn', effect: { statBonuses: { manaRegen: 20, maxMana: 25 }, special: 'Restores 5 mana every turn' } },
  { key: 'vampiric_blood_ritual', name: 'Blood Pact', description: 'Vampiric + Blood Ritual sacrifices HP for power', effect: { statBonuses: { attack: 8, maxHealth: -15 }, special: 'Skills cost HP instead of mana when mana is low' } },
  { key: 'fire_boost_infernal', name: 'Hellfire Mastery', description: 'Fire Boost + Infernal increases burn damage', effect: { statBonuses: { fireDamage: 30, attack: 6 }, special: 'Burn damage stacks with each attack' } },
  { key: 'ice_barrier_frost_lord', name: 'Winter\'s Reign', description: 'Ice Barrier + Frost Lord freezes attackers', effect: { statBonuses: { defense: 10 }, special: 'Freezes attackers for 1 turn (30% chance)' } },
  { key: 'lightning_boost_thunder_god', name: 'Lightning God', description: 'Lightning Boost + Thunder God chains electricity', effect: { statBonuses: { speed: 8, lightningDamage: 25 }, special: 'Lightning attacks hit 2 additional targets' } },
  { key: 'berserk_fury_unleashed', name: 'Critical Catastrophe', description: 'Berserk + Fury Unleashed creates chain crits', effect: { statBonuses: { attack: 15, critDamage: 100 }, special: 'Critical hits generate another attack' } },
  { key: 'shield_wall_bulwark', name: 'Ultimate Defense', description: 'Shield Wall + Bulwark reduces all incoming damage', effect: { statBonuses: { defense: 20 }, special: 'Reduces all damage by 70%' } },
  { key: 'healing_hands_divine_smite', name: 'Purifying Light', description: 'Healing Hands + Divine Smite damages undead', effect: { statBonuses: { maxMana: 15 }, special: 'Heal spells damage undead instead of healing' } },
  { key: 'berserker_uncontrollable', name: 'Rampage', description: 'Berserker + Uncontrollable attacks random targets', effect: { statBonuses: { attack: 20 }, special: 'Attacks random enemy each turn' } },
  { key: 'dead_eye_snipe', name: 'Headshot', description: 'Dead Eye + Snipe deals massive opening damage', effect: { statBonuses: { attack: 25 }, special: 'First turn attack deals 3x damage' } },
  { key: 'void_walk_phase_shift', name: 'Dimensional Fold', description: 'Void Walk + Phase Shift grants immunity', effect: { statBonuses: { speed: 7 }, special: 'Immune to first attack each battle' } },
  { key: 'poison_mist_virulent', name: 'Plague Spreader', description: 'Poison Mist + Virulent spreads poison to allies', effect: { statBonuses: { attack: 5 }, special: 'Poisoned allies spread poison on attack' } },
  { key: 'regeneration_self_repair', name: 'Auto-Repair', description: 'Regeneration + Self Repair doubles healing', effect: { statBonuses: { healthRegen: 15 } } },
  { key: 'tough_armored', name: 'Adamantine', description: 'Tough + Armored grants damage immunity', effect: { statBonuses: { defense: 20 }, special: 'Reduces all damage by 50%' } },
  { key: 'swift_haste', name: 'Lightning Reflexes', description: 'Swift + Haste grants extra turns', effect: { statBonuses: { speed: 12 }, special: 'Occasionally gains bonus turn' } },
  { key: 'strong_brute', name: 'Brute Force', description: 'Strong + Brute ignores defense', effect: { statBonuses: { attack: 10 }, special: 'Ignores 30% enemy defense' } },
  { key: 'magic_affinity_elemental', name: 'Elemental Mastery', description: 'Magic Affinity + Elemental boosts spell damage', effect: { statBonuses: { maxMana: 15, attack: 5 } } },
  { key: 'vampire_blood_woe', name: 'Blood Woe', description: 'Vampire + Blood Woe drains vitality', effect: { statBonuses: { attack: 8 }, special: 'Drains enemy attack on hit' } },
  { key: 'fire_blast_inferno', name: 'Hellfire', description: 'Fire Blast + Inferno spreads flames', effect: { statBonuses: { attack: 8 }, special: 'Burn chance increased to 50%' } },
  { key: 'ice_shard_frost', name: 'Frozen Heart', description: 'Ice Shard + Frost freezes on hit', effect: { statBonuses: { defense: 6 }, special: '30% chance to freeze enemy' } },
  { key: 'lightning_static_storm', name: 'Thunderstorm', description: 'Lightning + Static Storm chains more', effect: { statBonuses: { speed: 8 }, special: 'Chain lightning hits 3 targets' } },
];

export function getSynergyForTraits(traitA: string, traitB: string): TraitSynergy | undefined {
  const key = [traitA.toLowerCase(), traitB.toLowerCase()].sort().join('_');
  return TRAIT_SYNERGIES.find(s => s.key === key);
}

export function getAllSynergies(): TraitSynergy[] {
  return [...TRAIT_SYNERGIES];
}

export function getTraitSynergyCount(): number {
  return TRAIT_SYNERGIES.length;
}

export function calculateSynergyEffects(
  traitKeys: string[]
): { statBonuses: Record<string, number>; specialEffects: string[] } {
  const statBonuses: Record<string, number> = {};
  const specialEffects: string[] = [];
  
  for (let i = 0; i < traitKeys.length; i++) {
    for (let j = i + 1; j < traitKeys.length; j++) {
      const traitA = traitKeys[i];
      const traitB = traitKeys[j];
      if (!traitA || !traitB) continue;
      const synergy = getSynergyForTraits(traitA, traitB);
      if (synergy) {
        if (synergy.effect.statBonuses) {
          Object.entries(synergy.effect.statBonuses).forEach(([stat, value]) => {
            statBonuses[stat] = (statBonuses[stat] || 0) + value;
          });
        }
        if (synergy.effect.special) {
          specialEffects.push(synergy.name + ': ' + synergy.effect.special);
        }
      }
    }
  }
  
  return { statBonuses, specialEffects };
}

export function getSynergyNames(traitKeys: string[]): string[] {
  const names: string[] = [];
  
  for (let i = 0; i < traitKeys.length; i++) {
    for (let j = i + 1; j < traitKeys.length; j++) {
      const traitA = traitKeys[i];
      const traitB = traitKeys[j];
      if (!traitA || !traitB) continue;
      const synergy = getSynergyForTraits(traitA, traitB);
      if (synergy) {
        names.push(synergy.name);
      }
    }
  }
  
  return names;
}