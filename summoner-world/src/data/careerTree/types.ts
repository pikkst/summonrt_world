export type CareerNodeType = 'minor' | 'notable' | 'keystone';

export type CareerCategory = 'Blacksmith' | 'Explorer' | 'Official' | 'Shopkeeper' | 'Broker' | 'Summoner' | 'General';

export interface CareerNode {
  id: string;
  name: string;
  type: CareerNodeType;
  career_category: CareerCategory;
  connections: string[];
  stats: Record<string, number>;
}

export interface CareerTree {
  [nodeId: string]: CareerNode;
}
