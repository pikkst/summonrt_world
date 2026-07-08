import type { BiomeType } from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';

export interface NameCulture {
  firstNames: string[];
  lastNames: string[];
  epithets: string[];
}

const CULTURE_DICTIONARY: Record<BiomeType, NameCulture> = {
  forest: {
    firstNames: ['Leaf','Willow','Birch','Rowan','Elowen','Caelum','Sylvan','Thorne','Fen','Briar'],
    lastNames: ['Greenwood','Mossweaver','Oakenshield','Thornwood','Underbough','Verdant','Timber','Groveheart','Fernshaw','Hawthorn'],
    epithets: ['the Young','the Brave','the Swift','the Old','the Green'],
  },
  plains: {
    firstNames: ['Dawn','Sunny','Meadow','Golden','Horizon','Briar','Clover','Prairie','Sky','Dew'],
    lastNames: ['Meadowbrook','Highplains','Goldentrail','Windrider','Sunfall','Longroad','Grasswalker','Hearth','Fairfield','Openfield'],
    epithets: ['the Wanderer','the Bright','the Steady','the True','the Wild'],
  },
  mountains: {
    firstNames: ['Korg','Dwal','Borin','Thrain','Gim','Magni','Modi','Stein','Rock','Holt'],
    lastNames: ['Stonevein','Ironpeak','Forgeheart','Stonebrow','Orehand','Flint','Ravencrag','Hewn','Deep','Cragwalker'],
    epithets: ['the Strong','the Unbent','the Stone','the Iron','the Deep'],
  },
  swamp: {
    firstNames: ['Mire','Bog','Marsh','Fen','Willow','Mos','Gloom','Dark','Silt','Reed'],
    lastNames: ['Mirewalker','Bogshade','Mossbound','Fenwater','Silt','Duskwillow','Deadroot','Stagnant','Moor','Hagmire'],
    epithets: ['the Gnarled','the Patient','the Hidden','the Still','the Murky'],
  },
  desert: {
    firstNames: ['Zahra','Kael','Rashid','Amir','Nadir','Sami','Jas','Farah','Omar','Lina'],
    lastNames: ['Sandweaver','Dune','Oasis','Scorpion','Sunfall','Sirocco','Windrider','Mirage','Caravan','Stone'],
    epithets: ['the Enduring','the Sun-Touched','the Cunning','the Resilient','the Wandering'],
  },
  tundra: {
    firstNames: ['Frost','Ice','Snow','Bjorn','Fen','Hakon','Sven','Astra','Nova','Winter'],
    lastNames: ['Frostbind','Icevein','Snowfall','Glacier','Hearth','Frostfall','Winter','Storm','Icefall','Boreal'],
    epithets: ['the Frozen','the Unbroken','the Stark','the Northern','the Pale'],
  },
  coast: {
    firstNames: ['Marina','Coral','Shore','Bay','Tide','Wave','Sailor','Port','Wynn','Cove'],
    lastNames: ['Seabreeze','Wavecrest','Harbor','Anchor','Salt','Tidewater','Cove','Deepwater','Shoreham','Portmaster'],
    epithets: ['the Tidal','the Salt-Touched','the fearless','the Drifter','the Keeper of Tides'],
  },
  volcanic: {
    firstNames: ['Cinder','Ash','Flame','Ember','Pyra','Forge','Mag','Vulcan','Blaze','Smoke'],
    lastNames: ['Ashwalker','Flame','Forge','Cindermaw','Scoria','Obsidian','Lavawalker','Pyre','Brazier','Volcan'],
    epithets: ['the Unburnt','the Molten','the Forged','the Fierce','the Ashborn'],
  },
  crystal_caves: {
    firstNames: ['Gem','Shimmer','Echo','Prism','Luma','Crystal','Glow','Nova','Vex','Rill'],
    lastNames: ['Crystal','Glimmer','Gemcutter','Echo','Deepstone','Prism','Shimmer','Lumin','Facet','Vein'],
    epithets: ['the Shimmering','the Resonant','the Bright','the Unbreakable','the Deep Gazer'],
  },
  sky_islands: {
    firstNames: ['Zephyr','Aero','Cloud','Skye','Nimb','Ciel','Breeze','Altus','Aura','Gale'],
    lastNames: ['Cloudweaver','Skyward','Windrider','Highwind','Zephyr','Storm','Breeze','Aether','Strat','Aerial'],
    epithets: ['the Skybound','the Windrider','the Soaring','the Light','the Free'],
  },
};

export function getCultureForBiome(biome: BiomeType): NameCulture {
  return CULTURE_DICTIONARY[biome] || CULTURE_DICTIONARY['plains'];
}

export function generateName(biome: BiomeType, seed: string | number): string {
  const rng = new SeededRandom(seed);
  const culture = getCultureForBiome(biome);
  const first = rng.pick(culture.firstNames) ?? 'Unknown';
  const last = rng.pick(culture.lastNames) ?? 'Unknown';
  const fullName = `${first} ${last}`;
  if (rng.chance(0.25)) {
    const epithet = rng.pick(culture.epithets) ?? '';
    return `${fullName} ${epithet}`.trim();
  }
  return fullName;
}

export function generateFirstName(biome: BiomeType, seed: string | number): string {
  const rng = new SeededRandom(seed);
  const culture = getCultureForBiome(biome);
  return rng.pick(culture.firstNames) ?? 'Unknown';
}

export function generateLastName(biome: BiomeType, seed: string | number): string {
  const rng = new SeededRandom(seed);
  const culture = getCultureForBiome(biome);
  return rng.pick(culture.lastNames) ?? 'Unknown';
}

export function getAvailableBiomes(): BiomeType[] {
  return Object.keys(CULTURE_DICTIONARY) as BiomeType[];
}
