import type { CreatureTemplate, Element, CreatureClass, CreatureType } from '../../types/game.ts';
import { CREATURE_CLASSES } from '../../data/constants.ts';
import { SeededRandom } from '../../utils/SeededRandom.ts';

export const SKILL_TEMPLATES = [
  { key: 'scratch', name: 'Scratch', element: undefined as Element | undefined, power: 10, cost: 0, description: 'A simple strike with claws' },
  { key: 'fire_blast', name: 'Fire Blast', element: 'fire' as Element, power: 18, cost: 5, description: 'A blazing eruption of fire' },
  { key: 'water_spray', name: 'Water Spray', element: 'water' as Element, power: 16, cost: 4, description: 'A high-pressure stream of water' },
  { key: 'stone_throw', name: 'Stone Throw', element: 'earth' as Element, power: 14, cost: 3, description: 'Hurls heavy rocks at the foe' },
  { key: 'wind_slash', name: 'Wind Slash', element: 'air' as Element, power: 15, cost: 3, description: 'A sharp blade of compressed air' },
  { key: 'spark', name: 'Spark', element: 'lightning' as Element, power: 20, cost: 6, description: 'An electrical discharge' },
  { key: 'iron_fist', name: 'Iron Fist', element: 'iron' as Element, power: 17, cost: 4, description: 'A heavy metallic punch' },
  { key: 'vine_whip', name: 'Vine Whip', element: 'nature' as Element, power: 13, cost: 2, description: 'A lash with thorny vines' },
  { key: 'ice_shard', name: 'Ice Shard', element: 'ice' as Element, power: 17, cost: 5, description: 'A jagged shard of ice' },
  { key: 'holy_light', name: 'Holy Light', element: 'light' as Element, power: 22, cost: 7, description: 'A cleansing beam of light' },
  { key: 'shadow_bolt', name: 'Shadow Bolt', element: 'darkness' as Element, power: 22, cost: 7, description: 'Supernatural dark energy' },
];

export const TRAITS = [
  { key: 'regeneration', name: 'Regeneration', desc: 'Restores 3 HP every turn' },
  { key: 'strong', name: 'Strength', desc: '+5 Attack power' },
  { key: 'tough', name: 'Tough Skin', desc: '+3 Defense' },
  { key: 'swift', name: 'Swiftness', desc: '+3 Speed' },
  { key: 'magic_affinity', name: 'Mana Well', desc: '+2 Mana regeneration every turn' },
];

export const ELEMENTS = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'] as const;
export const CREATURE_TYPES = ['beast', 'dragon', 'undead', 'construct', 'spirit', 'demon', 'celestial', 'insect', 'plant'] as const;

export function generateCreatureTemplate(worldTier: number, rng: SeededRandom, isBoss: boolean = false): CreatureTemplate {
  const classIndex = isBoss ? 4 : weightedRandomClass(rng); // Bosses are Epic or higher
  const creatureClass = CREATURE_CLASSES[classIndex] as CreatureClass;
  const creatureType = rng.pick([...CREATURE_TYPES]) as CreatureType;
  const numElements = 1 + (classIndex >= 4 ? 1 : 0) + (classIndex === 5 ? 1 : 0);

  const elements: Element[] = [];
  const available = [...ELEMENTS];
  for (let i = 0; i < numElements; i++) {
    const idx = rng.int(0, available.length - 1);
    elements.push(available[idx] as Element);
    available.splice(idx, 1);
  }

  const names = isBoss ? ['Grand', 'High', 'Ancient', 'Doom', 'Void', 'Eternal'] : ['Brave', 'Wild', 'Mighty', 'Ancient', 'Young', 'Grim', 'Holy', 'Corrupt', 'Ethereal', 'Primal'];
  const suffixes = isBoss ? ['Overlord', 'Guardian', 'Monarch', 'Wraith', 'Behemoth', 'Titan'] : ['Fang', 'Lion', 'Bear', 'Soul', 'Wing', 'Hunter', 'Leaper', 'Eagle', 'Serpent', 'Angel'];
  const name = `${rng.pick(names)} ${rng.pick(suffixes)}`;

  const baseMult = (1 + (classIndex * 0.5) + (worldTier * 0.2)) * (isBoss ? 2.5 : 1);
  const numSkills = Math.min(1 + classIndex + (isBoss ? 2 : 0), SKILL_TEMPLATES.length);
  const skillPool = [...SKILL_TEMPLATES].sort(() => rng.next() - 0.5).slice(0, numSkills);

  return {
    key: `${creatureClass}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${rng.int(0,999)}`,
    name,
    class: creatureClass,
    type: creatureType,
    elements,
    baseHealth: Math.floor(25 * baseMult),
    baseAttack: Math.floor(10 * baseMult),
    baseDefense: Math.floor(6 * baseMult),
    baseSpeed: Math.floor(5 * baseMult),
    baseMana: Math.floor(15 * baseMult),
    baseExpValue: Math.floor(20 * baseMult),
    skills: skillPool,
    description: isBoss ? `The Floor ${worldTier} Guardian. A formidable soul.` : `A Tier ${worldTier} manifestation.`,
  };
}

function weightedRandomClass(rng: SeededRandom): number {
  const weights = [55, 28, 12, 4, 0.9, 0.1];
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w === undefined) continue;
    roll -= w;
    if (roll <= 0) return i;
  }
  return 0;
}

export function getTemplateByKey(_key: string): CreatureTemplate | undefined {
  return undefined;
}

export function getAvailableTemplatesForElement(_element: Element): CreatureTemplate[] {
  return [];
}
