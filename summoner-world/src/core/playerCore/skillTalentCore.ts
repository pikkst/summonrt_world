import type {
  PlayerSkillCategory,
  PlayerSkillCategoryId,
  SkillEntry,
  TalentNode,
  TalentTreeCategory,
  TalentTreeCategoryId,
} from '../../types/playerCore.ts';

export const PLAYER_SKILL_CATEGORIES: readonly PlayerSkillCategory[] = [
  {
    id: 'direct_combat',
    name: 'Direct Combat',
    description: 'Personal combat actions, weapon techniques, defenses, and encounter tactics.',
    supportsDirectUse: true,
    supportsCreatureSynergy: false,
  },
  {
    id: 'summoner_commands',
    name: 'Summoner Commands',
    description: 'Orders, formations, contract control, and creature coordination.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
  {
    id: 'elemental',
    name: 'Elemental Skills',
    description: 'Element-aligned spells, affinities, resistances, and mastery techniques.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
  {
    id: 'crafting',
    name: 'Crafting',
    description: 'Forging, alchemy, material handling, and item improvement skills.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Exploration, pathfinding, scouting, and world movement utility.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Reputation, negotiation, faction standing, and relationship actions.',
    supportsDirectUse: true,
    supportsCreatureSynergy: false,
  },
  {
    id: 'economy',
    name: 'Economy',
    description: 'Trading, markets, shop operations, taxes, and caravan influence.',
    supportsDirectUse: true,
    supportsCreatureSynergy: false,
  },
  {
    id: 'housing',
    name: 'Housing',
    description: 'Home upgrades, structure utility, permissions, and settlement support.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
  {
    id: 'pvp',
    name: 'PvP',
    description: 'Arena preparation, dueling identity, defenses, and opponent pressure.',
    supportsDirectUse: true,
    supportsCreatureSynergy: true,
  },
] as const;

export const TALENT_TREE_CATEGORIES: readonly TalentTreeCategory[] = [
  {
    id: 'summoning',
    name: 'Summoning',
    description: 'Long-term growth for summoning access, cost, cooldown, and contract reach.',
    unlockFocus: 'New summoning options and stronger contract control.',
  },
  {
    id: 'elemental_mastery',
    name: 'Elemental Mastery',
    description: 'Elemental identity, damage, resistance, and world affinity growth.',
    unlockFocus: 'Elemental techniques and cross-element synergies.',
  },
  {
    id: 'creature_bonding',
    name: 'Creature Bonding',
    description: 'Trust, loyalty, affection, contract stability, and creature teamwork.',
    unlockFocus: 'Creature cooperation, advanced orders, and bond benefits.',
  },
  {
    id: 'combat',
    name: 'Combat',
    description: 'Player battle stance, damage, mitigation, and encounter control.',
    unlockFocus: 'New combat actions and tactical options.',
  },
  {
    id: 'survival',
    name: 'Survival',
    description: 'Recovery, danger mitigation, resource endurance, and hostile-region safety.',
    unlockFocus: 'Exploration safety and longer expeditions.',
  },
  {
    id: 'crafting',
    name: 'Crafting',
    description: 'Craft speed, material retention, recipe access, and item quality.',
    unlockFocus: 'New recipes, masterwork chances, and production choices.',
  },
  {
    id: 'trading',
    name: 'Trading',
    description: 'Market access, caravans, tariffs, shop traffic, and trade leverage.',
    unlockFocus: 'Economic routes, better deals, and merchant options.',
  },
  {
    id: 'housing',
    name: 'Housing',
    description: 'Home utility, structure slots, upgrades, and settlement support.',
    unlockFocus: 'New housing permissions and world-shaping utility.',
  },
  {
    id: 'exploration',
    name: 'Exploration',
    description: 'Scouting speed, travel reach, map discovery, and dungeon preparation.',
    unlockFocus: 'New routes, travel tools, and discovery choices.',
  },
  {
    id: 'pvp',
    name: 'PvP',
    description: 'Arena identity, duel preparation, defensive tools, and rival pressure.',
    unlockFocus: 'PvP options, counterplay, and ranked preparation.',
  },
  {
    id: 'guild_leadership',
    name: 'Guild Leadership',
    description: 'Guild contribution, official authority, taxes, group coordination, and permissions.',
    unlockFocus: 'Guild actions, leadership permissions, and shared progression.',
  },
] as const;

const PLAYER_SKILL_CATEGORY_IDS = new Set<PlayerSkillCategoryId>(
  PLAYER_SKILL_CATEGORIES.map((category) => category.id)
);

const TALENT_TREE_CATEGORY_IDS = new Set<TalentTreeCategoryId>(
  TALENT_TREE_CATEGORIES.map((category) => category.id)
);

const ELEMENT_TERMS = [
  'fire',
  'water',
  'air',
  'earth',
  'lightning',
  'ice',
  'nature',
  'light',
  'darkness',
  'void',
  'starlight',
  'chaos',
  'element',
  'aether',
];

export function getAllPlayerSkillCategories(): readonly PlayerSkillCategory[] {
  return PLAYER_SKILL_CATEGORIES;
}

export function getAllTalentTreeCategories(): readonly TalentTreeCategory[] {
  return TALENT_TREE_CATEGORIES;
}

export function isPlayerSkillCategory(value: unknown): value is PlayerSkillCategoryId {
  return typeof value === 'string' && PLAYER_SKILL_CATEGORY_IDS.has(value as PlayerSkillCategoryId);
}

export function isTalentTreeCategory(value: unknown): value is TalentTreeCategoryId {
  return typeof value === 'string' && TALENT_TREE_CATEGORY_IDS.has(value as TalentTreeCategoryId);
}

export function inferSkillCategory(skillKey: string): PlayerSkillCategoryId {
  const normalized = skillKey.toLowerCase();

  if (ELEMENT_TERMS.some((term) => normalized.includes(term))) return 'elemental';
  if (hasAnyTerm(normalized, ['summon', 'contract', 'command', 'bond', 'beast', 'creature', 'whisper'])) return 'summoner_commands';
  if (hasAnyTerm(normalized, ['craft', 'forge', 'smith', 'smelt', 'alchemy', 'recipe', 'material'])) return 'crafting';
  if (hasAnyTerm(normalized, ['travel', 'scout', 'explore', 'path', 'track', 'map', 'trail'])) return 'travel';
  if (hasAnyTerm(normalized, ['social', 'reputation', 'faction', 'settlement', 'negotiate', 'diplomacy'])) return 'social';
  if (hasAnyTerm(normalized, ['trade', 'market', 'shop', 'broker', 'gold', 'caravan', 'tariff', 'economy'])) return 'economy';
  if (hasAnyTerm(normalized, ['house', 'housing', 'home', 'structure', 'building'])) return 'housing';
  if (hasAnyTerm(normalized, ['pvp', 'duel', 'arena', 'rival'])) return 'pvp';
  return 'direct_combat';
}

export function inferTalentCategory(nodeId: string, legacyCareerCategory?: string): TalentTreeCategoryId {
  const careerCategory = legacyCareerCategory?.toLowerCase();
  if (careerCategory) {
    if (careerCategory === 'summoner') return 'summoning';
    if (careerCategory === 'blacksmith') return 'crafting';
    if (careerCategory === 'explorer') return 'exploration';
    if (careerCategory === 'broker' || careerCategory === 'shopkeeper') return 'trading';
    if (careerCategory === 'official') return 'guild_leadership';
    if (careerCategory === 'general') return 'survival';
  }

  const normalized = nodeId.toLowerCase();
  if (hasAnyTerm(normalized, ['summon', 'contract'])) return 'summoning';
  if (ELEMENT_TERMS.some((term) => normalized.includes(term))) return 'elemental_mastery';
  if (hasAnyTerm(normalized, ['bond', 'creature', 'loyalty', 'affection'])) return 'creature_bonding';
  if (hasAnyTerm(normalized, ['combat', 'damage', 'warrior', 'guardian', 'duel'])) return 'combat';
  if (hasAnyTerm(normalized, ['survival', 'rest', 'life', 'stamina', 'recovery', 'root_hub'])) return 'survival';
  if (hasAnyTerm(normalized, ['craft', 'forge', 'smith', 'smelt', 'recipe'])) return 'crafting';
  if (hasAnyTerm(normalized, ['trade', 'market', 'shop', 'broker', 'caravan', 'tariff'])) return 'trading';
  if (hasAnyTerm(normalized, ['house', 'housing', 'home', 'structure'])) return 'housing';
  if (hasAnyTerm(normalized, ['explore', 'travel', 'scout', 'path'])) return 'exploration';
  if (hasAnyTerm(normalized, ['pvp', 'arena', 'rival'])) return 'pvp';
  if (hasAnyTerm(normalized, ['guild', 'official', 'leadership', 'faction'])) return 'guild_leadership';
  return 'survival';
}

export function normalizeSkillEntry(entry: SkillEntry | (Partial<SkillEntry> & { key: string })): SkillEntry {
  return {
    key: entry.key,
    name: entry.name ?? toDisplayName(entry.key),
    category: isPlayerSkillCategory(entry.category) ? entry.category : inferSkillCategory(entry.key),
    description: entry.description,
    element: entry.element,
    unlocked: entry.unlocked ?? false,
  };
}

export function normalizeTalentNode(node: TalentNode | (Partial<TalentNode> & { nodeId: string })): TalentNode {
  return {
    nodeId: node.nodeId,
    category: isTalentTreeCategory(node.category) ? node.category : inferTalentCategory(node.nodeId),
    unlocked: node.unlocked ?? false,
  };
}

export function createSkillEntry(params: {
  key: string;
  name?: string;
  category?: PlayerSkillCategoryId;
  description?: string;
  unlocked?: boolean;
}): SkillEntry {
  return normalizeSkillEntry({
    key: params.key,
    name: params.name,
    category: params.category,
    description: params.description,
    unlocked: params.unlocked ?? false,
  });
}

export function createTalentNode(params: {
  nodeId: string;
  category?: TalentTreeCategoryId;
  unlocked?: boolean;
}): TalentNode {
  return normalizeTalentNode({
    nodeId: params.nodeId,
    category: params.category,
    unlocked: params.unlocked ?? false,
  });
}

function hasAnyTerm(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function toDisplayName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
