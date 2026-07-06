import { describe, it, expect } from 'vitest';
import { calculateWorldTicks, MINUTES_PER_TURN, TURNS_PER_DAY, getRespawnDays, processResourceRespawn, RESOURCE_MAX_QTY, PLANT_RESPAWN_DAYS, ORE_RESPAWN_DAYS } from '../core/worldTick';
import type { WorldData, TileData } from '../types/game';

describe('T3.11 - World Tick System', () => {
  describe('calculateWorldTicks', () => {
    it('should return unchanged values when elapsed time is less than one turn', () => {
      const now = Date.now();
      const result = calculateWorldTicks({
        currentRealTime: now + 1000,
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 360,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(0);
      expect(result.gameTimeMinutes).toBe(360);
      expect(result.dayCount).toBe(1);
    });

    it('should advance one turn after MINUTES_PER_TURN minutes elapsed', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + msPerTurn,
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 360,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(1);
      expect(result.gameTimeMinutes).toBe(360 + MINUTES_PER_TURN);
    });

    it('should advance multiple turns based on elapsed time', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * 10),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 0,
        dayCount: 1,
      });

      expect(result.turnCount).toBe(10);
    });

    it('should increment day count after 1440 minutes (10 turns * 144 turns)', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const turnsPerDay = 1440 / MINUTES_PER_TURN;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * turnsPerDay * 2),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 0,
        dayCount: 1,
      });

      expect(result.dayCount).toBe(3);
    });

    it('should wrap gameTimeMinutes to 0-1439 range', () => {
      const now = Date.now();
      const msPerTurn = MINUTES_PER_TURN * 60 * 1000;
      const result = calculateWorldTicks({
        currentRealTime: now + (msPerTurn * 10),
        lastWorldTickTime: now,
        turnCount: 0,
        gameTimeMinutes: 1435,
        dayCount: 1,
      });

      expect(result.gameTimeMinutes).toBe(1435 + 10 * MINUTES_PER_TURN - 1440);
    });
  });

  describe('Constants', () => {
    it('should define MINUTES_PER_TURN as 6 minutes', () => {
      expect(MINUTES_PER_TURN).toBe(6);
    });

    it('should define TURNS_PER_DAY as 240 turns', () => {
      expect(TURNS_PER_DAY).toBe(240);
    });
  });
});

describe('T7.8 - Resource Respawn Logic', () => {
  describe('getRespawnDays', () => {
    it('returns 30 days for plant resources', () => {
      expect(getRespawnDays('wood')).toBe(30);
      expect(getRespawnDays('herbs')).toBe(30);
    });

    it('returns 90 days for ore resources', () => {
      expect(getRespawnDays('stone')).toBe(90);
      expect(getRespawnDays('ore')).toBe(90);
      expect(getRespawnDays('crystal')).toBe(90);
      expect(getRespawnDays('essence')).toBe(90);
    });

    it('defaults to ore respawn time for unknown resources', () => {
      expect(getRespawnDays('unknown')).toBe(90);
    });
  });

  describe('processResourceRespawn', () => {
    const createWorld = (tiles: Array<{ key: string; resourceType?: string; resourceQty?: number; resourceRespawnTurn?: number }>): Map<number, WorldData> => {
      const tileMap = new Map<string, TileData>();
      for (const tile of tiles) {
        const [xStr, yStr] = tile.key.split(',');
        const x = Number(xStr) || 0;
        const y = Number(yStr) || 0;
        tileMap.set(tile.key, {
          x,
          y,
          biome: 'plains',
          discovered: true,
          explored: true,
          resourceType: tile.resourceType,
          resourceQty: tile.resourceQty,
          resourceRespawnTurn: tile.resourceRespawnTurn,
          encounterSeed: 1,
        });
      }
      const worlds = new Map<number, WorldData>();
      worlds.set(1, {
        id: 1,
        seed: 1,
        name: 'World 1',
        tier: 1,
        bossDefeated: false,
        dungeonFloors: 3,
        tiles: tileMap,
        startTile: { x: 10, y: 10 },
        weather: { currentWeather: 'Clear', weatherIntensity: 1, nextChangeTurn: 0, baseDuration: 0 },
        settlements: [],
      });
      return worlds;
    };

    it('does nothing when no world exists for currentWorldId', () => {
      const worlds = new Map<number, WorldData>();
      processResourceRespawn({ dayCount: 10, worlds, currentWorldId: 99 });
    });

    it('does nothing when tile has no resourceType', () => {
      const worlds = createWorld([{ key: '0,0', resourceQty: 3 }]);
      processResourceRespawn({ dayCount: 10, worlds, currentWorldId: 1 });
    });

    it('does nothing when tile resourceQty is undefined', () => {
      const worlds = createWorld([{ key: '0,0', resourceType: 'wood' }]);
      processResourceRespawn({ dayCount: 10, worlds, currentWorldId: 1 });
    });

    it('does nothing when tile has no scheduled respawn day', () => {
      const worlds = createWorld([{ key: '0,0', resourceType: 'wood', resourceQty: 0 }]);
      processResourceRespawn({ dayCount: 10, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('0,0')!.resourceQty).toBe(0);
      expect(worlds.get(1)!.tiles.get('0,0')!.resourceRespawnTurn).toBeUndefined();
    });

    it('does nothing when tile resourceQty is already at max', () => {
      const worlds = createWorld([{ key: '0,0', resourceType: 'wood', resourceQty: RESOURCE_MAX_QTY }]);
      processResourceRespawn({ dayCount: 10, worlds, currentWorldId: 1 });
    });

    it('respawns plants after 30 days', () => {
      const worlds = createWorld([
        { key: '5,5', resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 },
        { key: '10,10', resourceType: 'herbs', resourceQty: 0, resourceRespawnTurn: 35 },
      ]);
      processResourceRespawn({ dayCount: 35, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(1);
      expect(worlds.get(1)!.tiles.get('10,10')!.resourceQty).toBe(1);
    });

    it('respawns ore after 90 days', () => {
      const worlds = createWorld([
        { key: '5,5', resourceType: 'stone', resourceQty: 0, resourceRespawnTurn: 95 },
        { key: '10,10', resourceType: 'crystal', resourceQty: 0, resourceRespawnTurn: 95 },
      ]);
      processResourceRespawn({ dayCount: 95, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(1);
      expect(worlds.get(1)!.tiles.get('10,10')!.resourceQty).toBe(1);
    });

    it('respawns on the scheduled plant day and schedules the next plant respawn', () => {
      const worlds = createWorld([{ key: '5,5', resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 }]);
      processResourceRespawn({ dayCount: 35, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(1);
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceRespawnTurn).toBe(35 + PLANT_RESPAWN_DAYS);
    });

    it('respawns on the scheduled ore day and schedules the next ore respawn', () => {
      const worlds = createWorld([{ key: '5,5', resourceType: 'stone', resourceQty: 3, resourceRespawnTurn: 95 }]);
      processResourceRespawn({ dayCount: 95, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(4);
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceRespawnTurn).toBe(95 + ORE_RESPAWN_DAYS);
    });

    it('clears ore respawn timer when ore reaches max', () => {
      const worlds = createWorld([{ key: '5,5', resourceType: 'stone', resourceQty: 4, resourceRespawnTurn: 95 }]);
      processResourceRespawn({ dayCount: 95, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(5);
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceRespawnTurn).toBeUndefined();
    });

    it('does not respawn before scheduled day', () => {
      const worlds = createWorld([{ key: '5,5', resourceType: 'wood', resourceQty: 0, resourceRespawnTurn: 35 }]);
      processResourceRespawn({ dayCount: 34, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(0);
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceRespawnTurn).toBe(35);
    });

    it('clears respawn timer when resource reaches max', () => {
      const worlds = createWorld([{ key: '5,5', resourceType: 'wood', resourceQty: 4, resourceRespawnTurn: 35 }]);
      processResourceRespawn({ dayCount: 35, worlds, currentWorldId: 1 });
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceQty).toBe(5);
      expect(worlds.get(1)!.tiles.get('5,5')!.resourceRespawnTurn).toBeUndefined();
    });
  });
});
