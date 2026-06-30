import { describe, it, expect } from 'vitest';
import {
  generateDungeonTower,
  exportDungeonRun,
} from '../core/dungeon/DungeonTowerGenerator';
import {
  findShortestPath,
  calculateRoomDistanceMap,
} from '../core/dungeon/Pathfinding';
import { resolveAutomatedCombat } from '../core/missionQueue';
import { SeededRandom } from '../utils/SeededRandom';
import type { CreatureInstance } from '../types/game';

function createCreature(
  overrides: Partial<CreatureInstance> & { id: string }
): CreatureInstance {
  return {
    templateKey: overrides.templateKey ?? 'test_creature',
    nickname: overrides.nickname ?? `Creature ${overrides.id}`,
    elements: overrides.elements ?? ['fire'],
    level: overrides.level ?? 10,
    experience: overrides.experience ?? 0n,
    currentHealth: overrides.currentHealth ?? 100,
    maxHealth: overrides.maxHealth ?? 100,
    currentMana: overrides.currentMana ?? 50,
    maxMana: overrides.maxMana ?? 50,
    attack: overrides.attack ?? 25,
    defense: overrides.defense ?? 12,
    speed: overrides.speed ?? 10,
    skills: overrides.skills ?? [],
    traits: overrides.traits ?? [],
    mutations: overrides.mutations ?? [],
    affection: overrides.affection ?? 0,
    instanceId: overrides.instanceId ?? overrides.id,
    ...overrides,
  };
}

describe('T6.12: World 10 full clear dungeon integration test', () => {
  const WORLD_INDEX = 10;
  const GLOBAL_SEED = 12345;
  const PARTY: CreatureInstance[] = [
    createCreature({ id: 'p1', elements: ['fire'], level: 15, attack: 40, defense: 20, currentHealth: 180, maxHealth: 180 }),
    createCreature({ id: 'p2', elements: ['water'], level: 15, attack: 38, defense: 19, currentHealth: 170, maxHealth: 170 }),
    createCreature({ id: 'p3', elements: ['nature'], level: 15, attack: 36, defense: 18, currentHealth: 160, maxHealth: 160 }),
  ];

  it('generates a complete World 10 dungeon tower', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    expect(tower.worldIndex).toBe(WORLD_INDEX);
    expect(tower.totalFloors).toBeGreaterThan(0);
    expect(tower.floors).toHaveLength(tower.totalFloors);
    expect(tower.floors.length).toBe(3 + WORLD_INDEX);

    for (const floor of tower.floors) {
      expect(floor.rooms.length).toBeGreaterThan(0);
      expect(floor.entranceRoomId).toBeDefined();
      expect(floor.bossRoomId).toBeDefined();
    }
  });

  it('is deterministic for the same seed', () => {
    const tower1 = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);
    const tower2 = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    expect(tower1).toEqual(tower2);
  });

  it('ensures every floor has a valid entrance-to-boss path', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    for (const floor of tower.floors) {
      const path = findShortestPath(floor, floor.entranceRoomId, floor.bossRoomId);
      expect(path, `Floor ${floor.floorIndex}: no path from entrance to boss`).not.toBeNull();
      if (path) {
        expect(path[0]).toBe(floor.entranceRoomId);
        expect(path[path.length - 1]).toBe(floor.bossRoomId);
        expect(path.length).toBeGreaterThan(0);
      }
    }
  });

  it('verifies no disconnected rooms on any floor', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    for (const floor of tower.floors) {
      const distances = calculateRoomDistanceMap(floor, floor.entranceRoomId);
      for (const room of floor.rooms) {
        expect(distances.has(room.id), `Floor ${floor.floorIndex}: room ${room.id} disconnected`).toBe(true);
      }
    }
  });

  it('links every floor vertically to the next floor entrance', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    expect(tower.verticalLinks.length).toBe(tower.totalFloors - 1);

    for (const link of tower.verticalLinks) {
      const fromFloor = tower.floors.find(f => f.floorIndex === link.fromFloorIndex);
      const toFloor = tower.floors.find(f => f.floorIndex === link.toFloorIndex);

      expect(fromFloor).toBeDefined();
      expect(toFloor).toBeDefined();
      expect(toFloor?.floorIndex).toBe((fromFloor?.floorIndex ?? 0) + 1);
      expect(link.fromRoomId).toBe(fromFloor?.bossRoomId);
      expect(link.toRoomId).toBe(toFloor?.entranceRoomId);
    }
  });

  it('clears every floor with a viable party', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);
    const rng = new SeededRandom(GLOBAL_SEED);
    const party: CreatureInstance[] = PARTY.map(c => ({ ...c }));

    let partyState = party.map(c => ({ ...c, currentHealth: c.currentHealth }));
    let currentFloorIndex = 1;
    let floorsCleared = 0;

    while (currentFloorIndex <= tower.totalFloors) {
      const floor = tower.floors.find(f => f.floorIndex === currentFloorIndex);
      expect(floor).toBeDefined();

      const path = findShortestPath(floor!, floor!.entranceRoomId, floor!.bossRoomId);
      expect(path, `Floor ${currentFloorIndex}: path broken`).not.toBeNull();

      const distances = calculateRoomDistanceMap(floor!, floor!.entranceRoomId);
      const maxDist = Math.max(...Array.from(distances.values()));

      let floorParty = partyState.map(c => ({ ...c }));
      let floorCleared = true;

      for (let d = 0; d <= maxDist; d++) {
        const roomsAtDist = floor!.rooms.filter(r => (distances.get(r.id) ?? 0) === d);

        for (const room of roomsAtDist) {
          if (room.id === floor!.entranceRoomId || room.id === floor!.bossRoomId) continue;

          const enemyLevel = Math.max(1, 10 + Math.floor(WORLD_INDEX / 2) + d);
          const enemy = createCreature({
            id: `${room.id}_enemy`,
            level: enemyLevel,
            attack: 15 + enemyLevel * 2,
            defense: 8 + enemyLevel,
            currentHealth: 40 + enemyLevel * 8,
            maxHealth: 40 + enemyLevel * 8,
            elements: [floor!.worldElement ?? 'fire'],
          });

          if (room.type === 'combat' || room.type === 'elite') {
            const result = resolveAutomatedCombat(floorParty, [enemy], {
              rngSeed: rng.next() * 10000,
            });

            if (!result.victory) {
              floorCleared = false;
              break;
            }

            floorParty = floorParty.map(c => ({
              ...c,
              currentHealth: Math.min(c.maxHealth, c.currentHealth + Math.floor(c.maxHealth * 0.15)),
            }));
          } else if (room.type === 'trap') {
            const trapDmg = 10 + enemyLevel * 2;
            const target = floorParty[Math.floor(rng.next() * floorParty.length)];
            if (target) {
              target.currentHealth = Math.max(0, target.currentHealth - trapDmg);
            }
          }
        }

        if (!floorCleared) break;
      }

      const bossAlive = floorParty.some(c => c.currentHealth > 0);
      expect(bossAlive, `Floor ${currentFloorIndex}: party wiped before boss`).toBe(true);

      const bossEnemy = createCreature({
        id: `${floor!.bossRoomId}_boss`,
        level: 10 + Math.floor(WORLD_INDEX / 2) + maxDist,
        attack: 20 + WORLD_INDEX * 3,
        defense: 12 + WORLD_INDEX * 2,
        currentHealth: 120 + WORLD_INDEX * 15,
        maxHealth: 120 + WORLD_INDEX * 15,
        elements: [floor!.worldElement ?? 'fire'],
      });

      const bossResult = resolveAutomatedCombat(floorParty, [bossEnemy], {
        rngSeed: rng.next() * 10000,
      });

      expect(bossResult.victory, `Floor ${currentFloorIndex}: failed to defeat boss`).toBe(true);
      floorsCleared++;
      currentFloorIndex++;

      partyState = floorParty;
    }

    expect(floorsCleared).toBe(tower.totalFloors);
  });

  it('produces a valid DungeonRun export for online sync', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);
    const run = exportDungeonRun(tower);

    expect(run.worldIndex).toBe(WORLD_INDEX);
    expect(run.totalFloors).toBe(tower.totalFloors);
    expect(run.tower.floors.length).toBe(tower.totalFloors);
    expect(run.tower.verticalLinks.length).toBe(tower.totalFloors - 1);

    const serialized = JSON.stringify(run);
    const parsed = JSON.parse(serialized);

    expect(parsed.worldIndex).toBe(WORLD_INDEX);
    expect(parsed.tower.floors.length).toBe(tower.totalFloors);
  });

  it('validates safe floors every 10th floor for World 10', () => {
    const tower = generateDungeonTower(WORLD_INDEX, GLOBAL_SEED);

    const safeIndices = tower.safeFloors.map(f => f.floorIndex);
    expect(safeIndices).toEqual([10]);

    for (const safeFloor of tower.safeFloors) {
      const floor = tower.floors.find(f => f.floorIndex === safeFloor.floorIndex);
      expect(floor).toBeDefined();
      expect(floor?.isBossFloor).not.toBe(true);

      const restRoom = floor?.rooms.find(r => r.id === safeFloor.restRoomId);
      expect(restRoom?.type).toBe('rest');

      const vendorRoom = floor?.rooms.find(r => r.id === safeFloor.vendorRoomId);
      expect(vendorRoom?.type).toBe('vendor');
    }
  });
});
