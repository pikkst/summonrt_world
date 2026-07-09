import type { NPC, NPCTravelPlan, InventoryStack, WorldData, TileData } from '../../types/game';
import { SeededRandom } from '../../utils/SeededRandom';
import { worldEventBus } from '../worldEventBus';
import { getTileKey } from '../../data/constants';

export const NPC_TRAVEL_BASE_SPEED = 0.5;
export const NPC_TRAVEL_ROBBERY_CHANCE = 0.03;
export const NPC_TRAVEL_MONSTER_CHANCE = 0.015;
export const NPC_TRAVEL_GOODS_LOST_PCT = 0.5;
export const NPC_TRAVEL_ARRIVAL_THRESHOLD = 100;

export interface NPCTravelStartParams {
  seed: number;
  npcId: string;
  originSettlementId: string;
  destinationSettlementId: string;
  originX: number;
  originY: number;
  destinationX: number;
  destinationY: number;
  goods?: InventoryStack[];
}

export function createNPCTravelPlan(params: NPCTravelStartParams): NPCTravelPlan {
  return {
    npcId: params.npcId,
    originSettlementId: params.originSettlementId,
    destinationSettlementId: params.destinationSettlementId,
    originX: params.originX,
    originY: params.originY,
    destinationX: params.destinationX,
    destinationY: params.destinationY,
    progress: 0,
    goods: params.goods ?? [],
    status: 'traveling',
  };
}

export function generateTravelGoods(
  role: NPC['role'],
  rng: SeededRandom
): InventoryStack[] {
  const goodsByRole: Record<NPC['role'], { key: string; min: number; max: number }[]> = {
    quest_giver: [],
    merchant: [
      { key: 'wood', min: 1, max: 5 },
      { key: 'stone', min: 1, max: 3 },
      { key: 'basic_food', min: 2, max: 8 },
    ],
    healer: [
      { key: 'healing_salve', min: 1, max: 3 },
      { key: 'basic_food', min: 1, max: 2 },
    ],
    elder: [],
    trainer: [],
  };

  const pool = goodsByRole[role] ?? [];
  if (pool.length === 0) return [];

  const count = rng.int(1, Math.min(pool.length, 3));
  const shuffled = rng.shuffle([...pool]);
  const selected = shuffled.slice(0, count);

  return selected.map((good) => ({
    templateKey: good.key,
    quantity: rng.int(good.min, good.max),
  }));
}

export function ensureNPCTravelPlan(
  npc: NPC,
  worldId: number,
  settlements: { id: string; x: number; y: number }[],
  turnCount: number
): NPC {
  if (npc.travel || npc.currentActivity !== 'travel') {
    return npc;
  }

  const origin = settlements.find((s) => s.id === npc.homeSettlementId) ?? settlements[0];
  if (!origin) return npc;

  const destinations = settlements.filter((s) => s.id !== origin.id);
  if (destinations.length === 0) return npc;

  const rng = new SeededRandom(`${npc.id}-${worldId}-${turnCount}-plan`);
  const destination = rng.pick(destinations)!;
  const goods = generateTravelGoods(npc.role, rng);

  const plan = createNPCTravelPlan({
    seed: rng.next() * 10000,
    npcId: npc.id,
    originSettlementId: origin.id,
    destinationSettlementId: destination.id,
    originX: origin.x,
    originY: origin.y,
    destinationX: destination.x,
    destinationY: destination.y,
    goods,
  });

  const updatedNPC: NPC = { ...npc, travel: plan };

  worldEventBus.publish({
    type: 'NPCTravelStarted',
    npcId: npc.id,
    worldId,
    originSettlementId: plan.originSettlementId,
    destinationSettlementId: plan.destinationSettlementId,
    goods: plan.goods,
    gameTimeMinutes: 0,
    turnCount,
  });

  return updatedNPC;
}

export function advanceNPCTravel(
  npc: NPC,
  worldId: number,
  turnCount: number
): NPC | null {
  if (!npc.travel || npc.travel.status !== 'traveling') {
    return null;
  }

  const travel = npc.travel;
  const distance = Math.hypot(
    travel.destinationX - travel.originX,
    travel.destinationY - travel.originY
  );

  if (distance <= 0) {
    return completeTravel(npc, worldId, turnCount);
  }

  const progressPerTick = (NPC_TRAVEL_BASE_SPEED / distance) * 100;
  const nextProgress = travel.progress + progressPerTick;

  if (nextProgress >= NPC_TRAVEL_ARRIVAL_THRESHOLD) {
    return completeTravel(npc, worldId, turnCount);
  }

  const interruptRng = new SeededRandom(
    `${npc.id}-${worldId}-${turnCount}-interrupt`
  );

  if (interruptRng.next() < NPC_TRAVEL_ROBBERY_CHANCE) {
    const remainingGoods = applyRobbery(travel.goods, interruptRng);
    const updatedNPC: NPC = {
      ...npc,
      travel: {
        ...travel,
        progress: nextProgress,
        goods: remainingGoods,
        interruptType: 'robbery',
      },
    };

    worldEventBus.publish({
      type: 'NPCTravelInterrupted',
      npcId: npc.id,
      worldId,
      interruptType: 'robbery',
      originSettlementId: travel.originSettlementId,
      destinationSettlementId: travel.destinationSettlementId,
      goodsLost: travel.goods.filter((g) =>
        !remainingGoods.find((r) => r.templateKey === g.templateKey && r.quantity === g.quantity)
      ),
      gameTimeMinutes: 0,
      turnCount,
    });

    return updatedNPC;
  }

  if (interruptRng.next() < NPC_TRAVEL_MONSTER_CHANCE) {
    const updatedNPC: NPC = {
      ...npc,
      travel: {
        ...travel,
        progress: nextProgress,
        status: 'interrupted',
        goods: [],
        interruptType: 'monster',
      },
    };

    worldEventBus.publish({
      type: 'NPCTravelInterrupted',
      npcId: npc.id,
      worldId,
      interruptType: 'monster',
      originSettlementId: travel.originSettlementId,
      destinationSettlementId: travel.destinationSettlementId,
      goodsLost: travel.goods,
      gameTimeMinutes: 0,
      turnCount,
    });

    return updatedNPC;
  }

  return {
    ...npc,
    travel: {
      ...travel,
      progress: nextProgress,
    },
  };
}

export function resolveInterruptedTravel(
  npc: NPC,
  worldId: number,
  turnCount: number
): NPC {
  if (!npc.travel || npc.travel.status !== 'interrupted') {
    return npc;
  }

  const travel = npc.travel;
  const returnedNPC: NPC = {
    ...npc,
    currentActivity: 'work',
    travel: undefined,
  };

  worldEventBus.publish({
    type: 'NPCTravelArrived',
    npcId: npc.id,
    worldId,
    originSettlementId: travel.destinationSettlementId,
    destinationSettlementId: travel.originSettlementId,
    goodsDelivered: [],
    gameTimeMinutes: 0,
    turnCount,
  });

  return returnedNPC;
}

function completeTravel(npc: NPC, worldId: number, turnCount: number): NPC {
  if (!npc.travel) return npc;

  const travel = npc.travel;
  const arrivedNPC: NPC = {
    ...npc,
    currentActivity: 'work',
    travel: undefined,
  };

  worldEventBus.publish({
    type: 'NPCTravelArrived',
    npcId: npc.id,
    worldId,
    originSettlementId: travel.originSettlementId,
    destinationSettlementId: travel.destinationSettlementId,
    goodsDelivered: travel.goods,
    gameTimeMinutes: 0,
    turnCount,
  });

  return arrivedNPC;
}

function applyRobbery(
  goods: InventoryStack[],
  rng: SeededRandom
): InventoryStack[] {
  if (goods.length === 0) return goods;

  const remaining: InventoryStack[] = [];
  for (const good of goods) {
    if (rng.chance(NPC_TRAVEL_GOODS_LOST_PCT)) {
      const remainingQty = Math.max(0, Math.floor(good.quantity * (1 - NPC_TRAVEL_GOODS_LOST_PCT)));
      if (remainingQty > 0) {
        remaining.push({ templateKey: good.templateKey, quantity: remainingQty });
      }
    } else {
      remaining.push({ ...good });
    }
  }
  return remaining;
}

export function tickNPCTravel(
  worlds: Map<number, WorldData>,
  turnCount: number,
  gameTimeMinutes: number
): Map<number, WorldData> {
  const newWorlds = new Map(worlds);
  let anyWorldChanged = false;

  newWorlds.forEach((world, worldId) => {
    const newTiles = new Map(world.tiles);
    let worldChanged = false;
    const tilesToRemove: string[] = [];
    const tilesToAdd = new Map<string, TileData>();

    newTiles.forEach((tile, tileKey) => {
      if (!tile.npc) return;

      const npc = tile.npc;
      const needsPlan = npc.currentActivity === 'travel' && !npc.travel;
      const updatedNPC = needsPlan
        ? ensureNPCTravelPlan(npc, worldId, world.settlements, turnCount)
        : npc;

      if (updatedNPC !== npc) {
        newTiles.set(tileKey, { ...tile, npc: updatedNPC });
        worldChanged = true;
        if (!updatedNPC.travel) {
          tilesToRemove.push(tileKey);
        }
        return;
      }

      if (!updatedNPC.travel) return;

      const travel = updatedNPC.travel;

      if (travel.status === 'traveling') {
        if (travel.progress >= NPC_TRAVEL_ARRIVAL_THRESHOLD) {
          const arrivedNPC: NPC = {
            ...updatedNPC,
            currentActivity: 'work',
            travel: undefined,
          };

          tilesToRemove.push(tileKey);

          const destTileKey = getTileKey(travel.destinationX, travel.destinationY);
          const destTile = newTiles.get(destTileKey);
          if (destTile) {
            tilesToAdd.set(destTileKey, { ...destTile, npc: arrivedNPC });
          } else {
            tilesToAdd.set(destTileKey, {
              x: travel.destinationX,
              y: travel.destinationY,
              biome: world.tiles.values().next().value?.biome ?? 'plains',
              discovered: false,
              explored: false,
              npc: arrivedNPC,
            } as TileData);
          }

          worldChanged = true;
          return;
        }

        const advanced = advanceNPCTravel(updatedNPC, worldId, turnCount);
        if (advanced) {
          newTiles.set(tileKey, { ...tile, npc: advanced });
          worldChanged = true;

          if (advanced.travel?.status === 'interrupted') {
            const originTileKey = getTileKey(
              advanced.travel.originX,
              advanced.travel.originY
            );
            const originTile = newTiles.get(originTileKey);
            if (originTile && originTile.npc?.id !== advanced.id) {
              tilesToAdd.set(originTileKey, { ...originTile, npc: advanced });
            }
          }
        }
      } else if (travel.status === 'interrupted') {
        const resolved = resolveInterruptedTravel(updatedNPC, worldId, turnCount);
        tilesToRemove.push(tileKey);

        const originTileKey = getTileKey(travel.originX, travel.originY);
        const originTile = newTiles.get(originTileKey);
        if (originTile) {
          tilesToAdd.set(originTileKey, { ...originTile, npc: resolved });
        } else {
          tilesToAdd.set(tileKey, { ...tile, npc: resolved });
        }

        worldChanged = true;
      }
    });

    if (worldChanged) {
      tilesToRemove.forEach((key) => {
        const existing = newTiles.get(key);
        if (existing) {
          newTiles.set(key, { ...existing, npc: undefined });
        }
      });
      tilesToAdd.forEach((tile, key) => {
        newTiles.set(key, tile);
      });

      newWorlds.set(worldId, {
        ...world,
        tiles: newTiles,
      });
      anyWorldChanged = true;
    }
  });

  return newWorlds;
}
