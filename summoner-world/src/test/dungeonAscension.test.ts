import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../stores/gameStore';
import { generateDungeonTower } from '../core/dungeon/DungeonTowerGenerator';
import type { WorldData, TileData } from '../types/game';

function createTestPlayer(overrides: { inventory?: { templateKey: string; quantity: number }[] } = {}) {
  return {
    id: 'test-player',
    name: 'Test Player',
    gender: 'unknown',
    appearance: {},
    affinity: { primary: 'fire' as const },
    level: 10,
    experience: 0n,
    money: 1000,
    skillPoints: 0,
    skillsUnlocked: {},
    unspent_passive_points: 0,
    unlocked_node_ids: ['root_hub'],
    energy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    nerve: { current: 15, max: 15, lastUpdate: new Date().toISOString() },
    happy: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    life: { current: 100, max: 100, lastUpdate: new Date().toISOString() },
    strength: 10,
    defense: 10,
    speed: 10,
    dexterity: 10,
    currentWorldId: 1,
    tileX: 10,
    tileY: 10,
    dayCount: 1,
    gameTimeMinutes: 420,
    creatures: [],
    inventory: overrides.inventory ?? [],
    activeQuests: [],
    completedQuests: [],
    discoveredTiles: new Set<string>(),
    territorialHostilities: {},
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.5,
      showLogTimestamps: true,
    },
  };
}

function setupDungeon(worldIndex = 1, clearedFloors: number[] = [], inventory: { templateKey: string; quantity: number }[] = []) {
  const tower = generateDungeonTower(worldIndex, 12345);
  const worlds = new Map<number, WorldData>();
  worlds.set(worldIndex, {
    id: worldIndex,
    seed: 12345,
    name: 'Test World',
    tier: 1,
    bossDefeated: false,
    dungeonFloors: tower.totalFloors,
    tiles: new Map<string, TileData>(),
    startTile: { x: 10, y: 10 },
  });
  const testPlayer = createTestPlayer({ inventory });
  useGameStore.setState({
    player: testPlayer,
    dungeon: {
      active: true,
      worldId: worldIndex,
      currentFloor: 0,
      totalFloors: tower.totalFloors,
      clearedFloors,
      bossDefeated: false,
      inEncounter: false,
      encounterType: undefined,
      tower,
    },
    combat: {
      active: false,
      phase: 'player_turn',
      log: [],
      enemyName: '',
      enemyHp: 0,
      enemyMaxHp: 0,
      enemyTemplate: null,
      playerCreatureId: '',
      turns: 0,
    },
    log: [],
    worlds,
    currentWorldId: worldIndex,
    turnCount: 0,
    initialized: true,
  });
}

describe('T6.9 - Dungeon Ascension Guardian Rule', () => {
  beforeEach(() => {
    useGameStore.setState({
      player: null,
      dungeon: { active: false, worldId: 1, currentFloor: 0, totalFloors: 4, clearedFloors: [], bossDefeated: false, inEncounter: false, encounterType: undefined },
      combat: { active: false, phase: 'player_turn', log: [], enemyName: '', enemyHp: 0, enemyMaxHp: 0, enemyTemplate: null, playerCreatureId: '', turns: 0 },
      log: [],
      worlds: new Map(),
      currentWorldId: 1,
      turnCount: 0,
      initialized: true,
    });
  });

  it('allows first descent from floor 0 without clearing requirement', () => {
    setupDungeon(1, []);
    const store = useGameStore.getState();
    expect(store.dungeon.currentFloor).toBe(0);

    store.descendDungeon();

    const after = useGameStore.getState();
    expect(after.dungeon.currentFloor).toBe(1);
  });

  it('blocks descent from uncleared floor when no teleport scroll is available', () => {
    setupDungeon(1, []);
    const store = useGameStore.getState();

    store.descendDungeon();

    const after1 = useGameStore.getState();
    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, currentFloor: 1, clearedFloors: [], inEncounter: false, encounterType: undefined },
    }));

    store.descendDungeon();

    const after2 = useGameStore.getState();
    expect(after2.log.length).toBeGreaterThan(0);
    const warningLog = after2.log.find(l => l.type === 'warning');
    expect(warningLog).toBeDefined();
    expect(warningLog?.text).toContain('floor guardian');
    expect(after2.dungeon.currentFloor).toBe(1);
  });

  it('allows descent when the current floor is cleared', () => {
    setupDungeon(1, []);
    const store = useGameStore.getState();

    store.descendDungeon();
    expect(useGameStore.getState().dungeon.currentFloor).toBe(1);

    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, clearedFloors: [...s.dungeon.clearedFloors, 1], inEncounter: false, encounterType: undefined },
    }));

    store.descendDungeon();

    const after = useGameStore.getState();
    expect(after.dungeon.currentFloor).toBe(2);
  });

  it('consumes a dungeon_ascend_scroll to bypass the guardian requirement', () => {
    setupDungeon(1, [], [{ templateKey: 'dungeon_ascend_scroll', quantity: 1 }]);
    const store = useGameStore.getState();

    store.descendDungeon();

    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, currentFloor: 1, clearedFloors: [], inEncounter: false, encounterType: undefined },
    }));

    store.descendDungeon();

    const after2 = useGameStore.getState();
    expect(after2.log.length).toBeGreaterThan(0);
    const successLog = after2.log.find(l => l.type === 'success' && l.text.includes('Teleport Scroll'));
    expect(successLog).toBeDefined();
    expect(after2.dungeon.currentFloor).toBe(2);
    expect(after2.player?.inventory.some(i => i.templateKey === 'dungeon_ascend_scroll')).toBe(false);
  });

  it('blocks boss floor access when previous floor is not cleared', () => {
    setupDungeon(1, []);
    const store = useGameStore.getState();

    store.descendDungeon();

    const after1 = useGameStore.getState();
    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, currentFloor: 2, totalFloors: 4, clearedFloors: [] },
    }));

    store.descendDungeon();

    const after2 = useGameStore.getState();
    expect(after2.dungeon.currentFloor).toBe(2);
    expect(after2.log.some(l => l.text.includes('floor guardian'))).toBe(true);
  });

  it('reports warning message with teleport scroll hint when blocked', () => {
    setupDungeon(1, []);
    const store = useGameStore.getState();

    store.descendDungeon();

    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, currentFloor: 1, clearedFloors: [], inEncounter: false, encounterType: undefined },
    }));

    store.descendDungeon();

    const after2 = useGameStore.getState();
    const warningLog = after2.log.find(l => l.type === 'warning' && l.text.includes('floor guardian'));
    expect(warningLog).toBeDefined();
    expect(warningLog?.text).toContain('Teleport Scroll');
  });
});
