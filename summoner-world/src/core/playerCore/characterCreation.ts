import type { Element, ElementalAffinity, CreatureInstance, CreatureTemplate, InventoryStack } from '../../types/game.ts';
import type { PlayerCoreState, SummonerClass } from '../../types/playerCore.ts';
import type { ClassDefinition, SummonerClassId } from '../../data/summonerClasses';
import { createDefaultPlayerCoreState } from './factory.ts';
import { generateCreatureTemplate, registerSpeciesLine } from '../../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../../utils/SeededRandom.ts';
import { SUMMONER_CLASSES } from '../../data/summonerClasses';

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
