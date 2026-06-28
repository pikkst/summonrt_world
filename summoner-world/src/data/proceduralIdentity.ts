import type { Element, CreatureType } from '../types/game';

export { ELEMENTS } from './constants';

export interface ProceduralIdentity {
  headVariant: number;
  bodyVariant: number;
  limbVariant: number;
  elementalFx: ElementalFX;
  colorPalette: ColorPalette;
}

export interface ElementalFX {
  trail: string;
  aura: string;
  impact: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export const HEAD_VARIANTS: Record<CreatureType, string[]> = {
  beast: ['feline', 'canine', 'reptilian', 'avian', 'amphibian', 'ursine', 'insectoid', 'serpentine'],
  dragon: ['longsnout', 'horned', 'frilled', 'crest', 'beaked', 'armored', 'scaled', 'wyvern'],
  undead: ['skull', 'rotting', 'spectral', 'bone', 'decaying', 'ethereal', 'gaseous', 'shadow'],
  construct: ['metallic', 'stone', 'wooden', 'crystal', 'gears', 'circuit', 'runic', 'ancient'],
  spirit: ['wisp', 'humanoid', 'ethereal', 'serpentine', 'flame', 'ice', 'storm', 'light'],
  demon: ['horned', 'winged', 'clawed', 'tailed', 'spined', 'flaming', 'shadow', 'chaotic'],
  celestial: ['angelic', 'serpentine', 'luminous', 'winged', 'crowned', 'fiery', 'icy', 'thorned'],
  insect: ['beetle', 'moth', 'ant', 'bee', 'spider', 'scorpion', 'dragonfly', 'cicada'],
  plant: ['bloom', 'thorn', 'vine', 'leaf', 'flower', 'root', 'cactus', 'fungal'],
};

export const BODY_VARIANTS: Record<CreatureType, string[]> = {
  beast: ['slender', 'muscular', 'stout', 'graceful', 'ferocious', 'camouflaged', 'striped', 'spotted'],
  dragon: ['serpentine', 'wingless', 'armored', 'slender', 'massive', 'levitating', 'quadruped', 'bipedal'],
  undead: ['decayed', 'preserved', 'ethereal', 'skeletal', 'bandaged', 'gaseous', 'putrid', 'charred'],
  construct: ['blocky', 'sleek', 'ornate', 'minimal', 'geared', 'crystalline', 'ancient', 'modern'],
  spirit: ['wispy', 'solid', 'fluid', 'crystalline', 'flame', 'mist', 'spark', 'prism'],
  demon: ['hunched', 'towering', 'lean', 'bulky', 'floating', 'serpentine', 'armored', 'wreathed'],
  celestial: ['angelic', 'sturdy', 'graceful', 'radiant', 'storm', 'luminous', 'icy', 'thorny'],
  insect: ['segmented', 'smooth', 'armored', 'hairy', 'glossy', 'matte', 'spiny', 'bulbous'],
  plant: ['stem', 'bushy', 'vine-like', 'tree-like', 'flower-covered', 'thorn-covered', 'succulent', 'fungal'],
};

export const LIMB_VARIANTS: Record<CreatureType, string[]> = {
  beast: ['paws', 'claws', 'hooves', 'talons', 'webbed', 'spined', 'maned', 'tailed'],
  dragon: ['wings', 'claws', 'tail', 'horns', 'frills', 'spikes', 'fins', 'tendrils'],
  undead: ['rotten', 'desiccated', 'ethereal', 'bone', 'shadow', 'flame', 'chains', 'mist'],
  construct: ['mechanical', 'stone', 'wooden', 'crystal', 'gears', 'spikes', 'blades', 'tools'],
  spirit: ['wisps', 'tendrils', 'beams', 'ribbons', 'auras', 'orbs', 'shields', 'chains'],
  demon: ['claws', 'wings', 'tail', 'horns', 'tentacles', 'spines', 'flames', 'shadows'],
  celestial: ['wings', 'halo', 'auras', 'beams', 'spears', 'shields', 'chains', 'thorns'],
  insect: ['mandibles', 'antennae', 'wings', 'stingers', 'chitin', 'fur', 'spines', 'pouches'],
  plant: ['vines', 'thorns', 'leaves', 'roots', 'blossoms', 'seeds', 'spores', 'berries'],
};

export const ELEMENTAL_FX: Record<Element, ElementalFX> = {
  fire: { trail: 'ember_smoke', aura: 'flame_aura', impact: 'fire_explosion' },
  water: { trail: 'water_drip', aura: 'water_shell', impact: 'water_splash' },
  earth: { trail: 'dust_cloud', aura: 'stone_shield', impact: 'earthquake' },
  air: { trail: 'wind_whisper', aura: 'air_current', impact: 'gust_blast' },
  lightning: { trail: 'electric_arc', aura: 'lightning_halo', impact: 'shock_burst' },
  iron: { trail: 'metal_spark', aura: 'iron_dust', impact: 'metal_shock' },
  nature: { trail: 'leaf_sparkle', aura: 'nature_glow', impact: 'thorn_explosion' },
  ice: { trail: 'frost_mist', aura: 'ice_crystal', impact: 'frost_shatter' },
  light: { trail: 'golden_streak', aura: 'divine_light', impact: 'holy_blast' },
  darkness: { trail: 'shadow_wisp', aura: 'dark_veil', impact: 'void_pulse' },
  void: { trail: 'entropic_swirl', aura: 'void_orbit', impact: 'void_implosion' },
  starlight: { trail: 'stardust_trail', aura: 'starlight_beam', impact: 'nova_flash' },
  chaos: { trail: 'chaos_energy', aura: 'prismatic_field', impact: 'chaos_blast' },
  omni: { trail: 'rainbow_stream', aura: 'omni_orb', impact: 'omni_eruption' },
};

export const BASE_COLORS: Record<Element, string> = {
  fire: '#FF4500',
  water: '#1E90FF',
  earth: '#8B4513',
  air: '#87CEEB',
  lightning: '#FFD700',
  iron: '#C0C0C0',
  nature: '#228B22',
  ice: '#00CED1',
  light: '#FFFFE0',
  darkness: '#4B0082',
  void: '#8A2BE2',
  starlight: '#DDA0DD',
  chaos: '#FF00FF',
  omni: '#FFFFFF',
};

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function generateColorPalette(elements: Element[], rng: () => number): ColorPalette {
  const sortedElements = [...elements].sort();
  const primaryElement = sortedElements[0] || 'fire';
  const secondaryElement = sortedElements[1] || sortedElements[0] || 'fire';

  const basePrimary = BASE_COLORS[primaryElement as Element] || '#FF4500';
  const baseSecondary = BASE_COLORS[secondaryElement as Element] || '#1E90FF';

  const primary = basePrimary;
  const secondary = baseSecondary;

  const accentFactor = rng();
  const accent = interpolateColor(primary, secondary, accentFactor);

  return { primary, secondary, accent };
}

export function generateProceduralIdentity(
  creatureType: CreatureType,
  elements: Element[],
  rng: () => number
): ProceduralIdentity {
  const typeHeadVariants = HEAD_VARIANTS[creatureType] || HEAD_VARIANTS.beast;
  const typeBodyVariants = BODY_VARIANTS[creatureType] || BODY_VARIANTS.beast;
  const typeLimbVariants = LIMB_VARIANTS[creatureType] || LIMB_VARIANTS.beast;

  const headVariant = Math.floor(rng() * typeHeadVariants.length);
  const bodyVariant = Math.floor(rng() * typeBodyVariants.length);
  const limbVariant = Math.floor(rng() * typeLimbVariants.length);

  const elementalFx = elements.length > 0
    ? ELEMENTAL_FX[elements[0] as Element] || ELEMENTAL_FX.fire
    : ELEMENTAL_FX.fire;

  const colorPalette = generateColorPalette(elements, rng);

  return {
    headVariant,
    bodyVariant,
    limbVariant,
    elementalFx,
    colorPalette,
  };
}

export function getAllHeadVariants(type: CreatureType): string[] {
  return HEAD_VARIANTS[type] || [];
}

export function getAllBodyVariants(type: CreatureType): string[] {
  return BODY_VARIANTS[type] || [];
}

export function getAllLimbVariants(type: CreatureType): string[] {
  return LIMB_VARIANTS[type] || [];
}

export function getElementalFX(element: Element): ElementalFX {
  return ELEMENTAL_FX[element] || ELEMENTAL_FX.fire;
}

export function getCombinedElementalFX(elements: Element[]): ElementalFX {
  if (elements.length === 0) return ELEMENTAL_FX.fire;
  if (elements.length === 1) return ELEMENTAL_FX[elements[0] as Element] || ELEMENTAL_FX.fire;

  const primary = ELEMENTAL_FX[elements[0] as Element] || ELEMENTAL_FX.fire;
  const secondary = ELEMENTAL_FX[elements[1] as Element] || ELEMENTAL_FX.fire;

  return {
    trail: `${primary.trail}_${secondary.trail}`,
    aura: `${primary.aura}_${secondary.aura}`,
    impact: `${primary.impact}_${secondary.impact}`,
  };
}