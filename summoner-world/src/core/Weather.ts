import type { WeatherType, BiomeType, WeatherState as WeatherStateType } from '../types/game';
import { WEATHER_TYPES as WEATHER_TYPES_ARRAY, WEATHER_EFFECTS, WEATHER_TRANSITION_WEIGHTS } from '../data/constants';
import { SeededRandom } from '../utils/SeededRandom';

const WEATHER_TYPES: WeatherType[] = [...WEATHER_TYPES_ARRAY];

export interface WeatherEffect {
  encounterModifier: number;
  resourceYieldModifier: number;
  elementalBonus: number;
  description: string;
}

export interface WorldWeatherState {
  currentWeather: WeatherType;
  intensity: number;
  lastUpdateTurn: number;
}

const DEFAULT_WEATHER: WeatherType = 'Clear';
const MIN_WEATHER_TURNS = 120;
const MAX_WEATHER_TURNS = 360;
const BASE_WEATHER_INTENSITY = 1.0;

export function createInitialWeatherState(worldSeed: number, gameTimeMinutes: number): WeatherStateType {
  const rng = new SeededRandom(worldSeed + 1);
  const initialWeather = rng.pick(WEATHER_TYPES) ?? DEFAULT_WEATHER;
  const duration = MIN_WEATHER_TURNS + rng.int(0, MAX_WEATHER_TURNS - MIN_WEATHER_TURNS);
  
  return {
    currentWeather: initialWeather,
    weatherIntensity: BASE_WEATHER_INTENSITY,
    nextChangeTurn: duration,
    baseDuration: duration,
  };
}

export function generateWeatherForBiome(biome: BiomeType, worldSeed: number, turn: number): WeatherType {
  const biomeWeatherWeights: Record<BiomeType, Record<WeatherType, number>> = {
    forest: {
      Clear: 25,
      Cloudy: 30,
      Rainy: 20,
      Stormy: 5,
      Foggy: 15,
      Hail: 3,
      Blizzard: 2,
    },
    plains: {
      Clear: 35,
      Cloudy: 25,
      Rainy: 15,
      Stormy: 5,
      Foggy: 10,
      Hail: 5,
      Blizzard: 5,
    },
    mountains: {
      Clear: 20,
      Cloudy: 25,
      Rainy: 15,
      Stormy: 10,
      Foggy: 15,
      Hail: 10,
      Blizzard: 5,
    },
    swamp: {
      Clear: 15,
      Cloudy: 25,
      Rainy: 30,
      Stormy: 10,
      Foggy: 15,
      Hail: 3,
      Blizzard: 2,
    },
    desert: {
      Clear: 50,
      Cloudy: 20,
      Rainy: 5,
      Stormy: 3,
      Foggy: 10,
      Hail: 5,
      Blizzard: 7,
    },
    tundra: {
      Clear: 20,
      Cloudy: 20,
      Rainy: 10,
      Stormy: 5,
      Foggy: 15,
      Hail: 15,
      Blizzard: 15,
    },
    coast: {
      Clear: 30,
      Cloudy: 25,
      Rainy: 20,
      Stormy: 10,
      Foggy: 10,
      Hail: 3,
      Blizzard: 2,
    },
    volcanic: {
      Clear: 40,
      Cloudy: 20,
      Rainy: 5,
      Stormy: 15,
      Foggy: 10,
      Hail: 5,
      Blizzard: 5,
    },
    crystal_caves: {
      Clear: 35,
      Cloudy: 25,
      Rainy: 10,
      Stormy: 10,
      Foggy: 15,
      Hail: 3,
      Blizzard: 2,
    },
    sky_islands: {
      Clear: 45,
      Cloudy: 20,
      Rainy: 5,
      Stormy: 5,
      Foggy: 15,
      Hail: 5,
      Blizzard: 5,
    },
  };

  const weights = biomeWeatherWeights[biome] ?? biomeWeatherWeights.plains;
  const rng = new SeededRandom(worldSeed + turn * 1000);
  
  let totalWeight = 0;
  const entries: { weather: WeatherType; weight: number }[] = [];
  
  for (const weather of WEATHER_TYPES) {
    const weight = weights[weather] ?? 0;
    if (weight > 0) {
      entries.push({ weather, weight });
      totalWeight += weight;
    }
  }

  const roll = rng.int(1, totalWeight);
  let cumulative = 0;
  
  for (const entry of entries) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.weather;
    }
  }
  
  return DEFAULT_WEATHER;
}

export function getNextWeather(
  currentWeather: WeatherType,
  worldSeed: number,
  turn: number,
  biome?: BiomeType
): WeatherType {
  const rng = new SeededRandom(worldSeed + turn * 100 + currentWeather.length);
  const weights = WEATHER_TRANSITION_WEIGHTS[currentWeather] ?? {};
  
  let totalWeight = 0;
  const entries: { weather: WeatherType; weight: number }[] = [];
  
  for (const weather of WEATHER_TYPES) {
    const weight = weights[weather] ?? (weather === currentWeather ? 50 : 0);
    if (weight > 0) {
      entries.push({ weather, weight });
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return currentWeather;
  }

  const roll = rng.int(1, totalWeight);
  let cumulative = 0;
  
  for (const entry of entries) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.weather;
    }
  }
  
  return currentWeather;
}

export function updateWeather(
  weatherState: WeatherStateType,
  worldSeed: number,
  turn: number,
  biome?: BiomeType
): WeatherStateType {
  if (turn >= weatherState.nextChangeTurn) {
    const newWeather = getNextWeather(weatherState.currentWeather, worldSeed, turn, biome);
    const duration = MIN_WEATHER_TURNS + (worldSeed + turn) % (MAX_WEATHER_TURNS - MIN_WEATHER_TURNS);
    const intensityChange = (Math.random() * 0.2) - 0.1;
    const newIntensity = Math.max(0.5, Math.min(1.5, weatherState.weatherIntensity + intensityChange));
    
    return {
      currentWeather: newWeather,
      weatherIntensity: newIntensity,
      nextChangeTurn: turn + duration,
      baseDuration: duration,
    };
  }
  
  return weatherState;
}

export function getWeatherEffect(weather: WeatherType, biome?: BiomeType): WeatherEffect {
  const effects: Record<WeatherType, WeatherEffect> = {
    Clear: {
      encounterModifier: 1.0,
      resourceYieldModifier: 1.0,
      elementalBonus: 0,
      description: 'Clear skies provide optimal conditions for exploration.',
    },
    Cloudy: {
      encounterModifier: 1.1,
      resourceYieldModifier: 1.05,
      elementalBonus: 0,
      description: 'Cloud cover increases encounter rates slightly.',
    },
    Rainy: {
      encounterModifier: 1.2,
      resourceYieldModifier: 1.1,
      elementalBonus: 0,
      description: 'Rain nourishes the land, boosting resource yields.',
    },
    Stormy: {
      encounterModifier: 1.3,
      resourceYieldModifier: 1.15,
      elementalBonus: 0,
      description: 'Storms stir up activity in the area.',
    },
    Foggy: {
      encounterModifier: 1.15,
      resourceYieldModifier: 0.95,
      elementalBonus: 0,
      description: 'Fog reduces visibility but increases mystery.',
    },
    Hail: {
      encounterModifier: 1.05,
      resourceYieldModifier: 0.9,
      elementalBonus: 0,
      description: 'Hail damage to crops reduces resource yields.',
    },
    Blizzard: {
      encounterModifier: 1.1,
      resourceYieldModifier: 0.85,
      elementalBonus: 0,
      description: 'Blizzard severely impacts travel and resource gathering.',
    },
  };
  
  return effects[weather] ?? effects.Clear;
}

export function calculateWeatherModifier(
  weather: WeatherType,
  element: string,
  biome?: BiomeType
): number {
  const weatherElementBonuses: Record<WeatherType, Record<string, number>> = {
    Clear: {
      fire: 1.05,
      water: 1.0,
      earth: 1.0,
      air: 1.1,
      lightning: 1.05,
      ice: 1.0,
    },
    Cloudy: {
      water: 1.1,
      ice: 1.05,
      earth: 1.05,
    },
    Rainy: {
      water: 1.15,
      earth: 1.1,
      ice: 1.1,
    },
    Stormy: {
      lightning: 1.2,
      air: 1.15,
      water: 1.1,
    },
    Foggy: {
      dark: 1.1,
      nature: 1.05,
    },
    Hail: {
      ice: 1.2,
      earth: 1.1,
    },
    Blizzard: {
      ice: 1.25,
      water: 1.15,
    },
  };
  
  const bonuses = weatherElementBonuses[weather] ?? {};
  return bonuses[element] ?? 1.0;
}

export function weatherToDisplayString(weather: WeatherType): string {
  const displayNames: Record<WeatherType, string> = {
    Clear: 'Clear',
    Cloudy: 'Cloudy',
    Rainy: 'Rainy',
    Stormy: 'Stormy',
    Foggy: 'Foggy',
    Hail: 'Hail',
    Blizzard: 'Blizzard',
  };
  return displayNames[weather] ?? weather;
}

export interface EncounterTableEntry {
  creatureClass: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';
  weight: number;
}

export type EncounterTable = EncounterTableEntry[];

export const DEFAULT_ENCOUNTER_TABLE: EncounterTable = [
  { creatureClass: 'common', weight: 60 },
  { creatureClass: 'uncommon', weight: 25 },
  { creatureClass: 'rare', weight: 10 },
  { creatureClass: 'epic', weight: 4 },
  { creatureClass: 'legendary', weight: 0.9 },
  { creatureClass: 'mythical', weight: 0.1 },
];

const WEATHER_ENCOUNTER_TABLES: Record<WeatherType, EncounterTable> = {
  Clear: [
    { creatureClass: 'common', weight: 60 },
    { creatureClass: 'uncommon', weight: 25 },
    { creatureClass: 'rare', weight: 10 },
    { creatureClass: 'epic', weight: 4 },
    { creatureClass: 'legendary', weight: 0.9 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
  Cloudy: [
    { creatureClass: 'common', weight: 55 },
    { creatureClass: 'uncommon', weight: 28 },
    { creatureClass: 'rare', weight: 12 },
    { creatureClass: 'epic', weight: 4 },
    { creatureClass: 'legendary', weight: 1 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
  Rainy: [
    { creatureClass: 'common', weight: 50 },
    { creatureClass: 'uncommon', weight: 30 },
    { creatureClass: 'rare', weight: 15 },
    { creatureClass: 'epic', weight: 4 },
    { creatureClass: 'legendary', weight: 1 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
  Stormy: [
    { creatureClass: 'common', weight: 45 },
    { creatureClass: 'uncommon', weight: 30 },
    { creatureClass: 'rare', weight: 18 },
    { creatureClass: 'epic', weight: 6 },
    { creatureClass: 'legendary', weight: 1 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
  Foggy: [
    { creatureClass: 'common', weight: 55 },
    { creatureClass: 'uncommon', weight: 27 },
    { creatureClass: 'rare', weight: 12 },
    { creatureClass: 'epic', weight: 4 },
    { creatureClass: 'legendary', weight: 1.5 },
    { creatureClass: 'mythical', weight: 0.5 },
  ],
  Hail: [
    { creatureClass: 'common', weight: 58 },
    { creatureClass: 'uncommon', weight: 26 },
    { creatureClass: 'rare', weight: 11 },
    { creatureClass: 'epic', weight: 4 },
    { creatureClass: 'legendary', weight: 1 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
  Blizzard: [
    { creatureClass: 'common', weight: 52 },
    { creatureClass: 'uncommon', weight: 28 },
    { creatureClass: 'rare', weight: 14 },
    { creatureClass: 'epic', weight: 5 },
    { creatureClass: 'legendary', weight: 1 },
    { creatureClass: 'mythical', weight: 0.1 },
  ],
};

export function getEncounterTableForWeather(weather: WeatherType): EncounterTable {
  return WEATHER_ENCOUNTER_TABLES[weather] ?? DEFAULT_ENCOUNTER_TABLE;
}

export function calculateEncounterRarityChance(
  weather: WeatherType,
  baseTable: EncounterTable = DEFAULT_ENCOUNTER_TABLE
): Record<string, number> {
  const weatherTable = getEncounterTableForWeather(weather);
  const result: Record<string, number> = {};
  
  let totalBaseWeight = 0;
  let totalWeatherWeight = 0;
  
  for (let i = 0; i < baseTable.length; i++) {
    const entry = baseTable[i]!;
    totalBaseWeight += entry.weight;
    const weatherEntry = weatherTable[i];
    totalWeatherWeight += weatherEntry ? weatherEntry.weight : entry.weight;
  }
  
  for (let i = 0; i < baseTable.length; i++) {
    const entry = baseTable[i]!;
    const className = entry.creatureClass;
    const baseWeight = entry.weight;
    const weatherEntry = weatherTable[i];
    const weatherWeight = weatherEntry ? weatherEntry.weight : baseWeight;
    
    const normalizedBase = baseWeight / totalBaseWeight;
    const normalizedWeather = weatherWeight / totalWeatherWeight;
    
    result[className] = normalizedWeather * 100;
  }
  
  return result;
}

export function getWeatherResourceYieldModifier(
  weather: WeatherType,
  weatherIntensity: number = 1.0
): number {
  const baseEffect = getWeatherEffect(weather);
  const intensityModifier = Math.max(0.8, Math.min(1.2, weatherIntensity));
  return baseEffect.resourceYieldModifier * intensityModifier;
}

export function getWeatherEncounterModifier(
  weather: WeatherType,
  weatherIntensity: number = 1.0
): number {
  const baseEffect = getWeatherEffect(weather);
  const intensityModifier = Math.max(0.9, Math.min(1.3, weatherIntensity));
  return baseEffect.encounterModifier * intensityModifier;
}

export function getPlayerElementalAffinityBonus(
  weather: WeatherType,
  playerElements: string[]
): number {
  if (!playerElements || playerElements.length === 0) return 1.0;
  
  const bonuses: number[] = [];
  for (const element of playerElements) {
    const bonus = calculateWeatherModifier(weather, element);
    bonuses.push(bonus);
  }
  
  const avgBonus = bonuses.reduce((sum, b) => sum + b, 0) / bonuses.length;
  return avgBonus;
}