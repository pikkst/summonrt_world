export { ELEMENTS, ALL_ELEMENTS, BIOME_TYPES, BIOME_NAMES, WEATHER_TYPES, RESOURCES, CREATURE_CLASSES, CLASS_WEIGHTS, DIRECTIONS, getWorldName } from './constants';
export { getBiomeForCoords } from '../core/dungeon/Biome';
export type { AllElement } from './constants';
export { getAllNodes, getNodeById, getNodesByCategory } from './careerTree';
export type { CareerNodeType, CareerCategory, CareerNode, CareerTree } from './careerTree/types';
export { getFusionResult, getAllPairKeys, isLightDarknessFusion, UNSTABLE_VOID_CREATURE, calculateFusionRarity, calculateFusionRarityWithSpecial, CREATURE_CLASS_TIERS } from './fusionMatrix';
export { inheritSkills } from './fusionUtils';
export { 
  TRAIT_SYNERGIES, 
  getAllSynergies, 
  getSynergyForTraits, 
  getTraitSynergyCount,
  calculateSynergyEffects,
  getSynergyNames
} from './traitSynergy';
