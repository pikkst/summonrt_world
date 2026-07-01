import type { SummonerClass } from '../../types/playerCore.ts';
import type { InventoryStack } from '../../types/game.ts';

export type SummonerClassId = SummonerClass;

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
