import type { Element } from '../../types/game';

export type StarterElement =
  | 'fire'
  | 'water'
  | 'earth'
  | 'air'
  | 'lightning'
  | 'iron'
  | 'nature'
  | 'ice'
  | 'light'
  | 'darkness';

export type QuestOnlyElement = 'void' | 'starlight' | 'chaos';

export type World100Element = 'omni';

export type PlayerElementIdentity = StarterElement | QuestOnlyElement | World100Element;

export interface ElementIdentityModifiers {
  skillDamagePct: number;
  creatureAffinityPct: number;
  contractStabilityPct: number;
  equipmentScalingPct: number;
  craftingSuccessPct: number;
  dungeonRewardPct: number;
  npcReactionPct: number;
  worldTravelSpeedPct: number;
  pvpIdentityModifier: number;
}

export interface ElementIdentity {
  element: Element;
  name: string;
  description: string;
  category: 'starter' | 'quest' | 'endgame';
  modifiers: ElementIdentityModifiers;
  unlockedVia: string;
}

export const ELEMENT_IDENTITY: Record<Element, ElementIdentity> = {
   fire: {
     element: 'fire',
     name: 'Pyre',
     description: 'Masters of flame and heat. Fire-aligned summoners excel at direct damage and aggressive play.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 10,
       creatureAffinityPct: 15,
       contractStabilityPct: 5,
       equipmentScalingPct: 8,
       craftingSuccessPct: 5,
       dungeonRewardPct: 10,
       npcReactionPct: 5,
       worldTravelSpeedPct: 0,
       pvpIdentityModifier: 1,
     },
   },
   water: {
     element: 'water',
     name: 'Tidal',
     description: 'Masters of flow and adaptation. Water-aligned summoners adapt to changing conditions.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 5,
       creatureAffinityPct: 20,
       contractStabilityPct: 10,
       equipmentScalingPct: 5,
       craftingSuccessPct: 10,
       dungeonRewardPct: 5,
       npcReactionPct: 10,
       worldTravelSpeedPct: 8,
       pvpIdentityModifier: 1,
     },
   },
   earth: {
     element: 'earth',
     name: 'Terran',
     description: 'Masters of stone and stability. Earth-aligned summoners endure and outlast.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 8,
       creatureAffinityPct: 10,
       contractStabilityPct: 15,
       equipmentScalingPct: 12,
       craftingSuccessPct: 15,
       dungeonRewardPct: 5,
       npcReactionPct: 0,
       worldTravelSpeedPct: -5,
       pvpIdentityModifier: 1,
     },
   },
   air: {
     element: 'air',
     name: 'Zephyr',
     description: 'Masters of wind and speed. Air-aligned summoners move quickly and strike swiftly.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 12,
       creatureAffinityPct: 10,
       contractStabilityPct: 5,
       equipmentScalingPct: 5,
       craftingSuccessPct: 5,
       dungeonRewardPct: 15,
       npcReactionPct: 5,
       worldTravelSpeedPct: 15,
       pvpIdentityModifier: 1,
     },
   },
   lightning: {
     element: 'lightning',
     name: 'Storm',
     description: 'Masters of electricity and precision. Lightning-aligned summoners strike with speed.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 15,
       creatureAffinityPct: 10,
       contractStabilityPct: 5,
       equipmentScalingPct: 10,
       craftingSuccessPct: 8,
       dungeonRewardPct: 12,
       npcReactionPct: 8,
       worldTravelSpeedPct: 12,
       pvpIdentityModifier: 1,
     },
   },
   iron: {
     element: 'iron',
     name: 'Forge',
     description: 'Masters of metal and industry. Iron-aligned summoners craft powerful equipment.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 10,
       creatureAffinityPct: 5,
       contractStabilityPct: 10,
       equipmentScalingPct: 20,
       craftingSuccessPct: 20,
       dungeonRewardPct: 8,
       npcReactionPct: 5,
       worldTravelSpeedPct: -3,
       pvpIdentityModifier: 1,
     },
   },
   nature: {
     element: 'nature',
     name: 'Verdant',
     description: 'Masters of growth and life. Nature-aligned summoners nurture strong bonds.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 5,
       creatureAffinityPct: 20,
       contractStabilityPct: 15,
       equipmentScalingPct: 5,
       craftingSuccessPct: 10,
       dungeonRewardPct: 8,
       npcReactionPct: 15,
       worldTravelSpeedPct: 5,
       pvpIdentityModifier: 1,
     },
   },
   ice: {
     element: 'ice',
     name: 'Glacial',
     description: 'Masters of cold and preservation. Ice-aligned summoners control the battlefield.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 12,
       creatureAffinityPct: 8,
       contractStabilityPct: 8,
       equipmentScalingPct: 10,
       craftingSuccessPct: 12,
       dungeonRewardPct: 10,
       npcReactionPct: 0,
       worldTravelSpeedPct: -2,
       pvpIdentityModifier: 1,
     },
   },
   light: {
     element: 'light',
     name: 'Radiant',
     description: 'Masters of illumination and purity. Light-aligned summoners bring clarity to darkness.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 15,
       creatureAffinityPct: 12,
       contractStabilityPct: 20,
       equipmentScalingPct: 15,
       craftingSuccessPct: 15,
       dungeonRewardPct: 10,
       npcReactionPct: 20,
       worldTravelSpeedPct: 8,
       pvpIdentityModifier: 1,
     },
   },
   darkness: {
     element: 'darkness',
     name: 'Umbral',
     description: 'Masters of shadow and mystery. Darkness-aligned summoners operate from the unseen.',
     category: 'starter',
     unlockedVia: 'character creation or quest',
     modifiers: {
       skillDamagePct: 20,
       creatureAffinityPct: 10,
       contractStabilityPct: 8,
       equipmentScalingPct: 12,
       craftingSuccessPct: 5,
       dungeonRewardPct: 15,
       npcReactionPct: -10,
       worldTravelSpeedPct: 10,
       pvpIdentityModifier: 1,
     },
   },
   void: {
     element: 'void',
     name: 'Void',
     description: 'The absence of all things. Unlocked through convergence quests.',
     category: 'quest',
     unlockedVia: 'Convergence quest chain',
     modifiers: {
       skillDamagePct: 25,
       creatureAffinityPct: 15,
       contractStabilityPct: 0,
       equipmentScalingPct: 10,
       craftingSuccessPct: -10,
       dungeonRewardPct: 20,
       npcReactionPct: -20,
       worldTravelSpeedPct: 20,
       pvpIdentityModifier: 1,
     },
   },
   starlight: {
     element: 'starlight',
     name: 'Stellar',
     description: 'Cosmic radiance from beyond. Unlocked through celestial quests.',
     category: 'quest',
     unlockedVia: 'Celestial quest chain',
     modifiers: {
       skillDamagePct: 18,
       creatureAffinityPct: 12,
       contractStabilityPct: 10,
       equipmentScalingPct: 15,
       craftingSuccessPct: 12,
       dungeonRewardPct: 15,
       npcReactionPct: 15,
       worldTravelSpeedPct: 15,
       pvpIdentityModifier: 1,
     },
   },
   chaos: {
     element: 'chaos',
     name: 'Chaotic',
     description: 'Unpredictable force that reshapes reality. Unlocked through chaos quests.',
     category: 'quest',
     unlockedVia: 'Chaos quest chain',
     modifiers: {
       skillDamagePct: 30,
       creatureAffinityPct: 5,
       contractStabilityPct: -5,
       equipmentScalingPct: 0,
       craftingSuccessPct: -5,
       dungeonRewardPct: 25,
       npcReactionPct: -15,
       worldTravelSpeedPct: 25,
       pvpIdentityModifier: 1,
     },
   },
   omni: {
     element: 'omni',
     name: 'Omni',
     description: 'All elements converged into one. The ultimate summoner identity.',
     category: 'endgame',
     unlockedVia: 'Floor 100 Convergence quest',
     modifiers: {
       skillDamagePct: 50,
       creatureAffinityPct: 30,
       contractStabilityPct: 30,
       equipmentScalingPct: 25,
       craftingSuccessPct: 30,
       dungeonRewardPct: 30,
       npcReactionPct: 30,
       worldTravelSpeedPct: 30,
       pvpIdentityModifier: 2,
     },
   },
 };

export const STARTER_ELEMENTS: StarterElement[] = [
  'fire', 'water', 'earth', 'air', 'lightning', 'iron', 'nature', 'ice', 'light', 'darkness',
];

export const QUEST_ONLY_ELEMENTS: QuestOnlyElement[] = ['void', 'starlight', 'chaos'];

export const WORLD_100_ELEMENT: World100Element = 'omni';