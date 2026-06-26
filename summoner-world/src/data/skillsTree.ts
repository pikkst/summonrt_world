import { getAllNodes, getNodeById } from './careerTree/index';
import type { CareerNode } from './careerTree/types';

const careerTree = getAllNodes();

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  connections: string[];
  stats: Record<string, number>;
  skills?: string[];
  cost: number;
  requirements?: { level?: number; skillPoints?: number };
  archetypeBonuses?: Record<string, number>;
}

const categoryOrder: Record<string, number> = {
  Blacksmith: 0,
  Explorer: 1,
  Official: 2,
  Shopkeeper: 3,
  Broker: 4,
  Summoner: 5,
  General: 6,
};

const typeOrder: Record<string, number> = {
  minor: 0,
  notable: 1,
  keystone: 2,
};

function adaptNode(node: CareerNode, index: number): SkillNode {
  const catIdx = categoryOrder[node.career_category] ?? 0;
  const typeIdx = typeOrder[node.type] ?? 0;
  const categoryNodeCount = Object.values(careerTree).filter(
    (n) => n.career_category === node.career_category
  ).length;
  const nodeInCategory = Object.values(careerTree)
    .filter((n) => n.career_category === node.career_category)
    .findIndex((n) => n.id === node.id);

  return {
    id: node.id,
    name: node.name,
    description: node.name,
    x: 120 + catIdx * 150,
    y: 80 + typeIdx * 130 + nodeInCategory * 15,
    connections: node.connections,
    stats: node.stats,
    cost: node.type === 'minor' ? 1 : node.type === 'notable' ? 2 : 3,
    requirements: node.type === 'keystone' ? { level: 10 } : node.type === 'notable' ? { level: 3 } : undefined,
  };
}

export const MASTER_SKILL_TREE: Record<string, SkillNode> = Object.keys(careerTree).reduce<Record<string, SkillNode>>((acc, id, index) => {
  acc[id] = adaptNode(careerTree[id]!, index);
  return acc;
}, {});

export const SKILL_NODE_LIST = Object.values(MASTER_SKILL_TREE);
