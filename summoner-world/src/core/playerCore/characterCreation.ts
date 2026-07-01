import type { Element, ElementalAffinity, CreatureInstance, CreatureTemplate, InventoryStack } from '../../types/game.ts';
import type { PlayerCoreState, SummonerClass } from '../../types/playerCore.ts';
import { createDefaultPlayerCoreState } from './factory.ts';
import { generateCreatureTemplate, registerSpeciesLine } from '../../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../../utils/SeededRandom.ts';

export type ContractPath = 'companion' | 'drake' | 'shade' | 'golem' | 'wisp';

export interface ContractPathDefinition {
  key: ContractPath;
  label: string;
  description: string;
  speciesKey: string;
  stage: number;
  defaultAffinity: { primary: Element };
}

export const CONTRACT_PATHS: Record<ContractPath, ContractPathDefinition> = {
  companion: {
    key: 'companion',
    label: 'Fang Companion',
    description: 'Loyal beast companion for close combat',
    speciesKey: 'fang_line',
    stage: 0,
    defaultAffinity: { primary: 'fire' },
  },
  drake: {
    key: 'drake',
    label: 'Storm Drake',
    description: 'Majestic dragon of lightning and wind',
    speciesKey: 'wyrm_line',
    stage: 0,
    defaultAffinity: { primary: 'lightning' },
  },
  shade: {
    key: 'shade',
    label: 'Shade Walker',
    description: 'Ethereal undead spirit of shadow and ice',
    speciesKey: 'wraith_line',
    stage: 0,
    defaultAffinity: { primary: 'darkness' },
  },
  golem: {
    key: 'golem',
    label: 'Crystal Guardian',
    description: 'Stalwart construct of earth and iron',
    speciesKey: 'golem_line',
    stage: 0,
    defaultAffinity: { primary: 'earth' },
  },
  wisp: {
    key: 'wisp',
    label: 'Wisp Spirit',
    description: 'Radiant spirit of light and nature',
    speciesKey: 'spirit_line',
    stage: 0,
    defaultAffinity: { primary: 'light' },
  },
};

export type SummonerClassId = 'beast_binder' | 'elementalist' | 'warden' | 'ritualist' | 'tactician' | 'alchemist' | 'pathfinder' | 'duelist';

export interface ClassDefinition {
  id: SummonerClassId;
  name: string;
  description: string;
  icon: string;
  statBias: Record<string, number>;
  startingBonus: {
    money?: number;
    items?: InventoryStack[];
  };
}

export const SUMMONER_CLASSES: Record<SummonerClassId, ClassDefinition> = {
  beast_binder: {
    id: 'beast_binder',
    name: 'Beast Binder',
    description: 'Stronger creature bonds and contract stability',
    icon: '🐾',
    statBias: { strength: 2, dexterity: 1, luck: 1 },
    startingBonus: { items: [{ templateKey: 'soul_crystal_common', quantity: 3 }] },
  },
  elementalist: {
    id: 'elementalist',
    name: 'Elementalist',
    description: 'Stronger elemental scaling and spell access',
    icon: '🔥',
    statBias: { intelligence: 2, wisdom: 1, dexterity: 1 },
    startingBonus: { items: [{ templateKey: 'mana_crystal', quantity: 5 }] },
  },
  warden: {
    id: 'warden',
    name: 'Warden',
    description: 'Defensive play, survival, healing, protection',
    icon: '🛡️',
    statBias: { vitality: 2, strength: 1, defense: 1 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 5 }] },
  },
  ritualist: {
    id: 'ritualist',
    name: 'Ritualist',
    description: 'Advanced summoning, rare contracts, sacrifice mechanics',
    icon: '🔮',
    statBias: { intelligence: 2, wisdom: 2 },
    startingBonus: { money: 500, items: [{ templateKey: 'soul_crystal_common', quantity: 2 }] },
  },
  tactician: {
    id: 'tactician',
    name: 'Tactician',
    description: 'Command speed, formation bonuses, combat control',
    icon: '⚔️',
    statBias: { dexterity: 2, intelligence: 1, speed: 1 },
    startingBonus: { items: [{ templateKey: 'basic_food', quantity: 5 }] },
  },
  alchemist: {
    id: 'alchemist',
    name: 'Alchemist',
    description: 'Crafting, mutation, consumables, material conversion',
    icon: '⚗️',
    statBias: { intelligence: 2, dexterity: 1, wisdom: 1 },
    startingBonus: { money: 500, items: [{ templateKey: 'essence', quantity: 3 }] },
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Travel, exploration, scouting, world traversal',
    icon: '🗺️',
    statBias: { speed: 2, dexterity: 2 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 3 }] },
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    description: 'PvP, direct combat, elite single-creature synergy',
    icon: '🗡️',
    statBias: { strength: 2, speed: 2 },
    startingBonus: { items: [{ templateKey: 'healing_herb', quantity: 3 }] },
  },
};

export interface CharacterCreationOptions {
  name: string;
  appearance?: Record<string, any>;
  className?: SummonerClassId;
  startingElement?: Element;
  startingWorldId?: number;
  contractPathKey?: ContractPath;
}

export interface CharacterCreationResult {
  playerCore: PlayerCoreState;
  startingCreature: CreatureInstance;
  startingTemplate: CreatureTemplate;
  affinity: ElementalAffinity;
  className: SummonerClass;
  classDef: ClassDefinition;
  contractPath: ContractPathDefinition;
}

export function createCharacter(options: CharacterCreationOptions): CharacterCreationResult {
  const className = options.className ?? 'elementalist';
  const startingWorldId = options.startingWorldId ?? 1;
  const contractPathKey = options.contractPathKey ?? 'companion';
  const classDef = SUMMONER_CLASSES[className];
  const contractPath = CONTRACT_PATHS[contractPathKey];

  if (!classDef) throw new Error(`Unknown class: ${className}`);
  if (!contractPath) throw new Error(`Unknown contract path: ${contractPathKey}`);

  registerSpeciesLine(contractPath.speciesKey, 1);
  const stableSeed = `${className}-${options.startingElement ?? contractPath.defaultAffinity.primary}-${contractPathKey}`;
  const rng = new SeededRandom(stableSeed);
  const startingTemplate = generateCreatureTemplate(1, rng, false, contractPath.speciesKey, contractPath.stage);

  const affinity: ElementalAffinity = { primary: options.startingElement ?? contractPath.defaultAffinity.primary };

  const playerCore = createDefaultPlayerCoreState(options.name, {
    startingWorldId,
    affinity,
    archetype: className,
  });

  playerCore.summonerProfile.class = className as SummonerClass;
  playerCore.summonerProfile.firstContractPath = contractPathKey;
  playerCore.class = className as SummonerClass;
  playerCore.identity.appearance = options.appearance ?? {};

  const startingCreature: CreatureInstance = {
    id: crypto.randomUUID?.() ?? `creature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    templateKey: startingTemplate.key,
    nickname: startingTemplate.name,
    level: 1,
    experience: 0n,
    currentHealth: startingTemplate.baseHealth,
    currentMana: startingTemplate.baseMana,
    maxHealth: startingTemplate.baseHealth,
    maxMana: startingTemplate.baseMana,
    attack: startingTemplate.baseAttack,
    defense: startingTemplate.baseDefense,
    speed: startingTemplate.baseSpeed,
    class: startingTemplate.class,
    skills: startingTemplate.skills.map((s) => typeof s === 'string' ? s : s.key),
    traits: [],
    mutations: [],
    affection: 0,
    type: startingTemplate.type,
    elements: startingTemplate.elements,
    baseExpValue: startingTemplate.baseExpValue,
    evolutionStage: 0,
    evolvedFromKey: undefined,
  };

  playerCore.creatureContracts = [{
    id: startingCreature.id,
    templateKey: startingTemplate.key,
    nickname: startingTemplate.name,
    bondLevel: 1,
    trust: 50,
    loyalty: 50,
    contractStability: 100,
    elementCompatibility: 100,
    commandPermissions: ['follow', 'attack', 'defend', 'retreat'],
    tradeStatus: 'bound',
    breedingRights: false,
    pvpEligibility: false,
    contractedAt: Date.now(),
    instance: startingCreature,
  }];

  playerCore.statistics.creaturesContracted = 1;

  return {
    playerCore,
    startingCreature,
    startingTemplate,
    affinity,
    className: className as SummonerClass,
    classDef,
    contractPath,
  };
}
