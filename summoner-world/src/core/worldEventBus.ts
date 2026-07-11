import type { NPCActivity, NPCRelationship, InventoryStack } from '../types/game';
export type WorldTravelEvent =
  | {
      type: 'PlayerEnteredWorld';
      playerId: string;
      worldId: number;
      fromWorldId?: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'PlayerEnteredBiome';
      playerId: string;
      worldId: number;
      x: number;
      y: number;
      biome: string;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'BiomeEntered';
      worldId: number;
      x: number;
      y: number;
      biome: string;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'WeatherChanged';
      worldId: number;
      previousWeather: string;
      currentWeather: string;
      intensity: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'ResourceSpawned';
      worldId: number;
      x: number;
      y: number;
      resourceType: string;
      quantity: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCActivityChanged';
      npcId: string;
      activity: NPCActivity;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCRelationshipChanged';
      npcId: string;
      playerId: string;
      relationship: NPCRelationship;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCMoved';
      npcId: string;
      worldId: number;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCTravelStarted';
      npcId: string;
      worldId: number;
      originSettlementId: string;
      destinationSettlementId: string;
      goods: InventoryStack[];
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCTravelArrived';
      npcId: string;
      worldId: number;
      originSettlementId: string;
      destinationSettlementId: string;
      goodsDelivered: InventoryStack[];
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCTravelInterrupted';
      npcId: string;
      worldId: number;
      interruptType: 'robbery' | 'monster';
      originSettlementId: string;
      destinationSettlementId: string;
      goodsLost: InventoryStack[];
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCMarried';
      npcId: string;
      partnerId: string;
      marriageId: string;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCChildBorn';
      childNpcId: string;
      parentAId: string;
      parentBId: string;
      familyName: string;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'NPCInheritedProperty';
      deceasedId: string;
      heirId: string;
      inheritedWealth: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'DungeonDiscovered';
      playerId: string;
      worldId: number;
      x: number;
      y: number;
      gameTimeMinutes: number;
      turnCount: number;
    }
  | {
      type: 'FactionStandingChanged';
      factionId: string;
      previousPower: number;
      newPower: number;
      source: string;
      gameTimeMinutes: number;
      turnCount: number;
    };

export type WorldTravelEventHandler = (event: WorldTravelEvent) => void;

export class WorldEventBus {
  private handlers: Map<WorldTravelEvent['type'], Set<WorldTravelEventHandler>> = new Map();

  subscribe(type: WorldTravelEvent['type'], handler: WorldTravelEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  publish(event: WorldTravelEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const worldEventBus = new WorldEventBus();
