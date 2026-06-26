import type { CreatureTemplate, CreatureInstance, InventoryStack, Element, CreatureClass } from '../../types/game.ts';
import { SeededRandom } from '../../utils/SeededRandom.ts';

export interface CombatResult {
  victory: boolean;
  damageDealt: number;
  damageTaken: number;
  loot: InventoryStack[];
  xpGained: number;
  log: string[];
}

export function runCombat(attacker: CreatureInstance, defender: CreatureInstance, aTemplate: CreatureTemplate, dTemplate: CreatureTemplate): CombatResult {
  const rng = new SeededRandom(Date.now());
  const log: string[] = [];

  let aHP = attacker.currentHealth;
  let dHP = defender.currentHealth;
  let totalDMG = 0;

  while (aHP > 0 && dHP > 0) {
    const aPower = aTemplate.baseAttack + attacker.level * 2 + (rng.next() * 4 | 0);
    const dDefense = dTemplate.baseDefense + defender.level * 1.5;
    const damage = Math.max(1, Math.floor(aPower - dDefense * 0.5));
    dHP -= damage;
    totalDMG += Math.max(0, damage);
    log.push(`${attacker.nickname || 'Creature'} attacked and dealt ${damage} damage.`);

    if (dHP <= 0) break;

    const dPower = dTemplate.baseAttack + defender.level * 2 + (rng.next() * 4 | 0);
    const aDefense = aTemplate.baseDefense + attacker.level * 1.5;
    const dDamage = Math.max(1, Math.floor(dPower - aDefense * 0.5));
    aHP -= dDamage;
    log.push(`${defender.nickname || 'Enemy'} attacked and dealt ${dDamage} damage.`);
  }

  const victory = dHP <= 0;
  const xpGained = dTemplate.baseExpValue;

  return {
    victory,
    damageDealt: totalDMG,
    damageTaken: Math.max(0, attacker.currentHealth - Math.max(0, aHP)),
    loot: [],
    xpGained,
    log,
  };
}

export function simulateWildEncounter(worldTier: number, _affinity: { primary?: Element } | undefined): { template: CreatureTemplate; name: string; difficulty: number } {
  const rng = new SeededRandom(worldTier * 999 + Math.floor(Math.random() * 10000));
  const template = generateEncounterTemplate(worldTier, rng);
  const name = `${template.name} (T${worldTier})`;
  const difficulty = template.baseAttack + template.baseHealth * 0.5;
  return { template, name, difficulty };
}

function generateEncounterTemplate(worldTier: number, rng: SeededRandom): CreatureTemplate {
  const classWeights = [55, 28, 12, 4, 0.9, 0.1];
  const total = classWeights.reduce((s, w) => s + w, 0);
  let roll = rng.next() * total;
  let classIdx = 0;
  for (let i = 0; i < classWeights.length; i++) {
    const w = classWeights[i];
    if (w === undefined) continue;
    roll -= w;
    if (roll <= 0) { classIdx = i; break; }
  }

  const creatureClass = ['common','uncommon','rare','epic','legendary','mythical'][classIdx];
  const baseMult = 1 + classIdx * 0.5 + worldTier * 0.1;

  return {
    key: `encounter_${Date.now()}_${rng.int(0, 999)}`,
    name: `Wild ${['Brave','Wolf','Lion','Bear','Serpent','Wing'][rng.int(0, 5)]}`,
    class: creatureClass as CreatureClass,
    type: 'beast',
    elements: ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'].slice(rng.int(0, 9), rng.int(0, 9) + 1) as Element[],
    baseHealth: Math.floor(20 * baseMult),
    baseAttack: Math.floor(8 * baseMult),
    baseDefense: Math.floor(4 * baseMult),
    baseSpeed: Math.floor(5 * baseMult),
    baseMana: Math.floor(10 * baseMult),
    baseExpValue: Math.floor(10 * baseMult),
    skills: [],
    description: `A wild creature from world ${worldTier}.`,
  };
}
