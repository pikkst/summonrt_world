import type { QuestTemplate, WorldData, Faction } from '../../types/game';
import { FACTIONS, FACTION_IDS } from '../../data/factions';
import { ALL_CRAFTING_RECIPES } from '../../data/crafting/recipes';
import { getWorldElement } from '../dungeon/BossScaling';
import { registerQuestTemplate } from '../../data/quests';

export type QuestCategory = 'templated' | 'procedural';

export interface GeneratedQuestContext {
  worldId: number;
  playerLevel: number;
  turnCount: number;
  seed: string;
}

function deterministicIndex(seedA: string, seedB: string, seedC: number, max: number): number {
  const str = `${seedA}_${seedB}_${seedC}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h % Math.max(1, max));
}

function pickFromList(seed: string, category: string, turnCount: number, list: string[]): string {
  const index = deterministicIndex(seed, category, turnCount, list.length);
  return list[index] ?? list[0]!;
}

export function generateFactionQuest(
  factionId: string,
  context: GeneratedQuestContext
): QuestTemplate | null {
  const faction = FACTIONS[factionId];
  if (!faction) return null;

  const factionPower = faction.power ?? 50;
  const index = deterministicIndex(context.seed, `faction_${factionId}`, context.turnCount, 3);
  const worldElement = getWorldElement(context.worldId);

  const templates: QuestTemplate[] = [
    {
      key: `proc_faction_${factionId}_bolster_${context.turnCount}`,
      title: `${faction.name}: Strengthen Our Cause`,
      description: `The ${faction.name} needs support. Increase their standing in this world to prove your loyalty.`,
      type: 'faction',
      target: factionId,
      amount: 10 + context.playerLevel,
      rewards: {
        money: 200 + context.worldId * 50,
        exp: 150 + context.playerLevel * 10,
      },
      factionEffects: { [factionId]: 5 },
    },
    {
      key: `proc_faction_${factionId}_rival_${context.turnCount}`,
      title: `${faction.name}: Challenge the Opposition`,
      description: `The ${faction.name} has enemies. Undermine their rivals to shift the balance of power.`,
      type: 'faction',
      target: factionId,
      amount: 8 + context.playerLevel,
      rewards: {
        money: 250 + context.worldId * 60,
        exp: 200 + context.playerLevel * 12,
      },
      factionEffects: { [factionId]: 8 },
    },
    {
      key: `proc_faction_${factionId}_resource_${context.turnCount}`,
      title: `${faction.name}: Resource Drive`,
      description: `The ${faction.name} requires resources for their operations. Gather what they need.`,
      type: 'faction',
      target: factionId,
      amount: 5 + Math.floor(context.playerLevel / 2),
      rewards: {
        money: 180 + context.worldId * 40,
        exp: 120 + context.playerLevel * 8,
      },
      factionEffects: { [factionId]: 4 },
    },
  ];

  return { ...templates[index]!, key: `proc_faction_${factionId}_${context.turnCount}_${index}` };
}

export function generateExplorationQuest(context: GeneratedQuestContext): QuestTemplate {
  const worldElement = getWorldElement(context.worldId);
  const index = deterministicIndex(context.seed, 'exploration', context.turnCount, 4);

  const templates: QuestTemplate[] = [
    {
      key: `proc_explore_world_${context.worldId}_${context.turnCount}`,
      title: 'Cartographer\'s Ambition',
      description: `Explore new sectors of World ${context.worldId} to expand your map knowledge.`,
      type: 'explore',
      amount: 3 + context.playerLevel,
      rewards: {
        money: 300 + context.worldId * 30,
        exp: 200 + context.playerLevel * 10,
      },
    },
    {
      key: `proc_explore_biome_${context.worldId}_${context.turnCount}`,
      title: 'Biome Explorer',
      description: `Discover the varied biomes of this world. Each terrain holds unique resources and dangers.`,
      type: 'explore',
      amount: 2 + Math.floor(context.playerLevel / 3),
      rewards: {
        money: 350 + context.worldId * 35,
        exp: 250 + context.playerLevel * 12,
      },
    },
    {
      key: `proc_explore_edge_${context.worldId}_${context.turnCount}`,
      title: 'Into the Unknown',
      description: `Venture to the edges of the map where rare creatures and hidden secrets await.`,
      type: 'explore',
      amount: 4 + context.playerLevel,
      rewards: {
        money: 400 + context.worldId * 40,
        exp: 300 + context.playerLevel * 15,
      },
    },
    {
      key: `proc_explore_element_${context.worldId}_${context.turnCount}`,
      title: `Elemental Survey: ${worldElement.charAt(0).toUpperCase() + worldElement.slice(1)} Territories`,
      description: `Survey areas rich with ${worldElement} energy to strengthen your elemental affinity.`,
      type: 'explore',
      amount: 3 + Math.floor(context.playerLevel / 2),
      rewards: {
        money: 320 + context.worldId * 32,
        exp: 220 + context.playerLevel * 11,
      },
    },
  ];

  return { ...templates[index]!, key: `proc_explore_${context.worldId}_${context.turnCount}_${index}` };
}

export function generateCraftingQuest(context: GeneratedQuestContext): QuestTemplate | null {
  const eligibleRecipes = ALL_CRAFTING_RECIPES.filter((recipe) => {
    if (recipe.requirements?.level && context.playerLevel < recipe.requirements.level) return false;
    if (recipe.requirements?.worldId && context.worldId < recipe.requirements.worldId) return false;
    return true;
  });

  if (eligibleRecipes.length === 0) return null;

  const recipe = pickFromList(context.seed, 'crafting_recipe', context.turnCount, eligibleRecipes.map((r) => r.key));
  const selectedRecipe = eligibleRecipes.find((r) => r.key === recipe) ?? eligibleRecipes[0]!;
  const amount = 1 + Math.floor(context.playerLevel / 10);

  return {
    key: `proc_craft_${selectedRecipe.key}_${context.worldId}_${context.turnCount}`,
    title: `Crafting Request: ${selectedRecipe.name}`,
    description: `A local artisan needs ${selectedRecipe.name} crafted. Bring them ${amount} completed ${selectedRecipe.name}(s).`,
    type: 'crafting',
    target: selectedRecipe.key,
    amount,
    rewards: {
      money: 150 + selectedRecipe.baseDurationSeconds * 2,
      exp: 100 + context.playerLevel * 8,
    },
  };
}

export function generateStoryQuest(context: GeneratedQuestContext): QuestTemplate {
  const worldElement = getWorldElement(context.worldId);
  const index = deterministicIndex(context.seed, 'story', context.turnCount, 3);

  const templates: QuestTemplate[] = [
    {
      key: `story_world_${context.worldId}_awakening_${context.turnCount}`,
      title: 'The Awakening',
      description: `The energies of World ${context.worldId} are stirring. Prove your worth by facing its challenges.`,
      type: 'combat',
      target: 'dungeon_floor',
      amount: 1 + context.worldId,
      rewards: {
        money: 1000 + context.worldId * 100,
        exp: 500 + context.playerLevel * 20,
        element: worldElement as 'fire' | 'water' | 'earth' | 'air' | 'lightning' | 'iron' | 'nature' | 'ice' | 'light' | 'darkness',
      },
    },
    {
      key: `story_world_${context.worldId}_bond_${context.turnCount}`,
      title: 'Soul Bond Trial',
      description: `Deep within World ${context.worldId}, ancient bonds wait to be formed. Capture creatures to prove your connection.`,
      type: 'summon',
      amount: 2 + Math.floor(context.worldId / 5),
      rewards: {
        money: 800 + context.worldId * 80,
        exp: 400 + context.playerLevel * 15,
      },
    },
    {
      key: `story_world_${context.worldId}_convergence_${context.turnCount}`,
      title: 'Convergence Path',
      description: `The elements of World ${context.worldId} seek harmony. Master their essences to unlock greater power.`,
      type: 'gather',
      target: 'element_essences',
      amount: 3 + Math.floor(context.worldId / 3),
      rewards: {
        money: 1200 + context.worldId * 120,
        exp: 600 + context.playerLevel * 25,
      },
    },
  ];

  return { ...templates[index]!, key: `story_world_${context.worldId}_${context.turnCount}_${index}` };
}

export function generateLegendaryQuest(context: GeneratedQuestContext): QuestTemplate | null {
  if (context.playerLevel < 20) return null;

  const worldElement = getWorldElement(context.worldId);
  const index = deterministicIndex(context.seed, 'legendary', context.turnCount, 2);

  const templates: QuestTemplate[] = [
    {
      key: `legendary_world_${context.worldId}_boss_${context.turnCount}`,
      title: 'Legend: World Boss',
      description: `A legendary presence dominates World ${context.worldId}. Only the strongest summoners can hope to challenge it.`,
      type: 'combat',
      target: 'world_boss',
      amount: 1,
      rewards: {
        money: 5000 + context.worldId * 500,
        exp: 2000 + context.playerLevel * 50,
        items: [{ templateKey: 'boss_egg', quantity: 1 }],
        element: worldElement as 'fire' | 'water' | 'earth' | 'air' | 'lightning' | 'iron' | 'nature' | 'ice' | 'light' | 'darkness',
      },
    },
    {
      key: `legendary_world_${context.worldId}_fusion_${context.turnCount}`,
      title: 'Legend: Soul Convergence',
      description: `Ancient texts speak of a powerful fusion possible only in World ${context.worldId}. Merge creatures to unlock legendary potential.`,
      type: 'summon',
      target: 'fusion',
      amount: 1,
      rewards: {
        money: 3000 + context.worldId * 300,
        exp: 1500 + context.playerLevel * 40,
        items: [{ templateKey: 'soul_crystal_rare', quantity: 3 }],
      },
    },
  ];

  return { ...templates[index]!, key: `legendary_world_${context.worldId}_${context.turnCount}_${index}` };
}

export function generateNPCQuestBundle(
  npcId: string,
  factionAlignment: { factionId: string; loyalty: number } | undefined,
  worldId: number,
  playerLevel: number,
  turnCount: number
): QuestTemplate[] {
  const seed = npcId;
  const context: GeneratedQuestContext = { worldId, playerLevel, turnCount, seed };
  const quests: QuestTemplate[] = [];

  const factionId = factionAlignment?.factionId;
  const loyalty = factionAlignment?.loyalty ?? 0;

  if (factionId && FACTION_IDS.includes(factionId)) {
    const factionQuest = generateFactionQuest(factionId, context);
    if (factionQuest) {
      registerQuestTemplate(factionQuest);
      quests.push(factionQuest);
    }
  }

  const explorationQuest = generateExplorationQuest(context);
  registerQuestTemplate(explorationQuest);
  quests.push(explorationQuest);

  const craftingQuest = generateCraftingQuest(context);
  if (craftingQuest) {
    registerQuestTemplate(craftingQuest);
    quests.push(craftingQuest);
  }

  if (loyalty > 30) {
    const storyQuest = generateStoryQuest(context);
    registerQuestTemplate(storyQuest);
    quests.push(storyQuest);
  }

  if (loyalty > 50 && playerLevel >= 20) {
    const legendaryQuest = generateLegendaryQuest(context);
    if (legendaryQuest) {
      registerQuestTemplate(legendaryQuest);
      quests.push(legendaryQuest);
    }
  }

  return quests;
}
