import type { CreatureTemplate, Element, CreatureClass, CreatureType } from '../../types/game.ts';
import { CREATURE_CLASSES, ELEMENTS, CLASS_WEIGHTS, SPECIES_LINES } from '../../data/constants.ts';
import { SeededRandom } from '../../utils/SeededRandom.ts';

export const SKILL_TEMPLATES = [
  { key: 'scratch', name: 'Scratch', element: undefined as Element | undefined, power: 10, cost: 0, description: 'A simple strike with claws', tier: 1 },
  { key: 'fire_blast', name: 'Fire Blast', element: 'fire' as Element, power: 18, cost: 5, description: 'A blazing eruption of fire', tier: 3 },
  { key: 'water_spray', name: 'Water Spray', element: 'water' as Element, power: 16, cost: 4, description: 'A high-pressure stream of water', tier: 2 },
  { key: 'stone_throw', name: 'Stone Throw', element: 'earth' as Element, power: 14, cost: 3, description: 'Hurls heavy rocks at the foe', tier: 1 },
  { key: 'wind_slash', name: 'Wind Slash', element: 'air' as Element, power: 15, cost: 3, description: 'A sharp blade of compressed air', tier: 2 },
  { key: 'spark', name: 'Spark', element: 'lightning' as Element, power: 20, cost: 6, description: 'An electrical discharge', tier: 3 },
  { key: 'iron_fist', name: 'Iron Fist', element: 'iron' as Element, power: 17, cost: 4, description: 'A heavy metallic punch', tier: 2 },
  { key: 'vine_whip', name: 'Vine Whip', element: 'nature' as Element, power: 13, cost: 2, description: 'A lash with thorny vines', tier: 1 },
  { key: 'ice_shard', name: 'Ice Shard', element: 'ice' as Element, power: 17, cost: 5, description: 'A jagged shard of ice', tier: 2 },
  { key: 'holy_light', name: 'Holy Light', element: 'light' as Element, power: 22, cost: 7, description: 'A cleansing beam of light', tier: 4 },
  { key: 'shadow_bolt', name: 'Shadow Bolt', element: 'darkness' as Element, power: 22, cost: 7, description: 'Supernatural dark energy', tier: 4 },
];

export const TRAITS = [
  { key: 'regeneration', name: 'Regeneration', desc: 'Restores 3 HP every turn' },
  { key: 'strong', name: 'Strength', desc: '+5 Attack power' },
  { key: 'tough', name: 'Tough Skin', desc: '+3 Defense' },
  { key: 'swift', name: 'Swiftness', desc: '+3 Speed' },
  { key: 'magic_affinity', name: 'Mana Well', desc: '+2 Mana regeneration every turn' },
  { key: 'poison', name: 'Poison', desc: 'Has a poisonous touch' },
  { key: 'sturdy', name: 'Sturdy', desc: '+5 Defense' },
  { key: 'agile', name: 'Agile', desc: '+5 Speed' },
  { key: 'might', name: 'Might', desc: '+10 Attack power' },
  { key: 'arcane', name: 'Arcane', desc: '+10 Mana' },
  { key: 'vampire', name: 'Vampire', desc: 'Drains HP on hit' },
  { key: 'lifesteal', name: 'Lifesteal', desc: 'Converts damage to healing' },
];

export const CREATURE_TYPES = ['beast', 'dragon', 'undead', 'construct', 'spirit', 'demon', 'celestial', 'insect', 'plant'] as const;

const templateRegistry = new Map<string, CreatureTemplate>();

export function registerTemplate(template: CreatureTemplate): void {
  templateRegistry.set(template.key, template);
}

export function getTemplateByKey(key: string): CreatureTemplate | undefined {
  return templateRegistry.get(key);
}

export function getAvailableTemplatesForElement(element: Element): CreatureTemplate[] {
  return Array.from(templateRegistry.values()).filter(t => t.elements.includes(element));
}

export function clearTemplateRegistry(): void {
  templateRegistry.clear();
}

export function registerSpeciesLine(speciesKey: string, worldTier: number): void {
  const line = SPECIES_LINES[speciesKey];
  if (!line) return;
  for (let stage = 0; stage < line.stages.length; stage++) {
    const stageDef = line.stages[stage];
    if (!stageDef) continue;
    const classIndex = CREATURE_CLASSES.indexOf(stageDef.class as CreatureClass);
    if (classIndex === -1) continue;
    const rng = new SeededRandom(hashString(`${speciesKey}_${stage}`));
    const template = generateSpeciesTemplate(speciesKey, stage, line, stageDef, classIndex, worldTier, rng);
    registerTemplate(template);
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateSpeciesTemplate(
  speciesKey: string,
  stage: number,
  line: { speciesKey: string; creatureType: string; elements: string[]; prefixes: string[]; suffixes: string[]; stages: Array<{ class: string; minEvolutionLevel: number }> },
  stageDef: { class: string; minEvolutionLevel: number },
  classIndex: number,
  worldTier: number,
  rng: SeededRandom
): CreatureTemplate {
  const creatureClass = CREATURE_CLASSES[classIndex] as CreatureClass;
  const creatureType = line.creatureType as CreatureType;
  const numElements = 1 + (classIndex >= 4 ? 1 : 0) + (classIndex === 5 ? 1 : 0);

  const elements: Element[] = [];
  const available = [...line.elements];
  for (let i = 0; i < Math.min(numElements, available.length); i++) {
    const idx = rng.int(0, available.length - 1);
    elements.push(available[idx] as Element);
    available.splice(idx, 1);
  }

  const prefix = line.prefixes[stage] ?? line.prefixes[line.prefixes.length - 1];
  const suffix = line.suffixes[stage] ?? line.suffixes[line.suffixes.length - 1];
  const name = `${prefix} ${suffix}`;
  const key = `${speciesKey}_stage${stage}_${name.toLowerCase().replace(/\s+/g, '_')}`;

  const baseMult = (1 + (classIndex * 0.5) + (worldTier * 0.2));
  const numSkills = Math.min(1 + classIndex, SKILL_TEMPLATES.length);
  const skillPool = [...SKILL_TEMPLATES].sort(() => rng.next() - 0.5).slice(0, numSkills);

  const nextStage = line.stages[stage + 1];
  const evolvesIntoKey = nextStage
    ? `${speciesKey}_stage${stage + 1}_${(line.prefixes[stage + 1] ?? 'next').toLowerCase().replace(/\s+/g, '_')}_${(line.suffixes[stage + 1] ?? 'form').toLowerCase().replace(/\s+/g, '_')}`
    : undefined;

  const template: CreatureTemplate = {
    key,
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
    description: `A ${creatureClass} ${creatureType} from the ${speciesKey.replace('_line', '')} evolution line.`,
    evolutionLevel: stageDef.minEvolutionLevel,
    evolvesIntoKey,
  };

  return template;
}

export function generateCreatureTemplate(
  worldTier: number,
  rng: SeededRandom,
  isBoss: boolean = false,
  speciesKey?: string,
  speciesStage?: number
): CreatureTemplate {
  if (speciesKey && typeof speciesStage === 'number') {
    const line = SPECIES_LINES[speciesKey];
    if (line && speciesStage >= 0 && speciesStage < line.stages.length) {
      const stageDef = line.stages[speciesStage];
      if (!stageDef) {
        const classIndex = isBoss ? 4 : 0;
        return createRandomTemplate(worldTier, rng, isBoss, classIndex);
      }
      const classIndex = CREATURE_CLASSES.indexOf(stageDef.class as CreatureClass);
      const safeClassIndex = classIndex === -1 ? (isBoss ? 4 : 0) : classIndex;
      const template = generateSpeciesTemplate(speciesKey, speciesStage, line, stageDef, safeClassIndex, worldTier, rng);
      registerTemplate(template);
      return template;
    }
  }

  const classIndex = isBoss ? 4 : weightedRandomClass(rng);
  return createRandomTemplate(worldTier, rng, isBoss, classIndex);
}

function createRandomTemplate(worldTier: number, rng: SeededRandom, isBoss: boolean, classIndex: number): CreatureTemplate {
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

  const key = `${creatureClass}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${rng.int(0,999)}`;

  const template: CreatureTemplate = {
    key,
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

  registerTemplate(template);
  return template;
}

function weightedRandomClass(rng: SeededRandom): number {
  const total = CLASS_WEIGHTS.reduce((s, w) => s + w, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < CLASS_WEIGHTS.length; i++) {
    const w = CLASS_WEIGHTS[i];
    if (w === undefined) continue;
    roll -= w;
    if (roll <= 0) return i;
  }
  return 0;
}

export function pickRandomSpeciesKey(rng: SeededRandom): string | undefined {
  const keys = Object.keys(SPECIES_LINES);
  if (keys.length === 0) return undefined;
  return keys[rng.int(0, keys.length - 1)];
}

export function getRandomSpeciesStage(speciesKey: string, rng: SeededRandom): number {
  const line = SPECIES_LINES[speciesKey];
  if (!line) return 0;
  const weights = line.stages.map((_, i) => i === 0 ? 60 : i === 1 ? 25 : i === 2 ? 10 : 4);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i] ?? 0;
    roll -= w;
    if (roll <= 0) return i;
  }
  return 0;
}
