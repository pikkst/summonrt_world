import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../stores/gameStore';
import { WORLD_SIZE } from '../data/constants';

function createMinimalPlayer(overrides: { tileX?: number; tileY?: number; energyCurrent?: number } = {}): any {
  const now = new Date().toISOString();
  return {
    id: 'test-player',
    name: 'Test Summoner',
    gender: 'other',
    appearance: {},
    affinity: { primary: 'fire' },
    level: 1,
    experience: 0n,
    money: 0,
    skillPoints: 0,
    skillsUnlocked: {},
    unspent_passive_points: 0,
    unlocked_node_ids: [],
    energy: { current: overrides.energyCurrent ?? 100, max: 100, lastUpdate: now },
    nerve: { current: 100, max: 100, lastUpdate: now },
    happy: { current: 100, max: 100, lastUpdate: now },
    life: { current: 100, max: 100, lastUpdate: now },
    strength: 10,
    vitality: 10,
    intelligence: 10,
    dexterity: 10,
    wisdom: 10,
    luck: 10,
    defense: 10,
    speed: 10,
    currentWorldId: 1,
    tileX: overrides.tileX ?? 10,
    tileY: overrides.tileY ?? 10,
    dayCount: 1,
    gameTimeMinutes: 420,
    creatures: [],
    inventory: [],
    activeQuests: [],
    completedQuests: [],
    discoveredTiles: new Set<string>(),
    settings: { musicVolume: 1, sfxVolume: 1, showLogTimestamps: true },
    territorialHostilities: {},
  };
}

describe('World Boundary Handling (T7.9)', () => {
  beforeEach(() => {
    useGameStore.setState({
      player: createMinimalPlayer(),
      worlds: new Map(),
      currentWorldId: 1,
      exploring: null,
      log: [],
      turnCount: 0,
    });
  });

  it('blocks movement west when at x = 0', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player!, tileX: 0, tileY: 10 },
    }));

    useGameStore.getState().movePlayer(-1, 0);

    const player = useGameStore.getState().player!;
    expect(player.tileX).toBe(0);
    expect(player.tileY).toBe(10);
  });

  it('blocks movement north when at y = 0', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player!, tileX: 10, tileY: 0 },
    }));

    useGameStore.getState().movePlayer(0, -1);

    const player = useGameStore.getState().player!;
    expect(player.tileX).toBe(10);
    expect(player.tileY).toBe(0);
  });

  it('blocks movement east when at x = WORLD_SIZE - 1', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player!, tileX: WORLD_SIZE - 1, tileY: 10 },
    }));

    useGameStore.getState().movePlayer(1, 0);

    const player = useGameStore.getState().player!;
    expect(player.tileX).toBe(WORLD_SIZE - 1);
    expect(player.tileY).toBe(10);
  });

  it('blocks movement south when at y = WORLD_SIZE - 1', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player!, tileX: 10, tileY: WORLD_SIZE - 1 },
    }));

    useGameStore.getState().movePlayer(0, 1);

    const player = useGameStore.getState().player!;
    expect(player.tileX).toBe(10);
    expect(player.tileY).toBe(WORLD_SIZE - 1);
  });

  it('emits a thematic warning when the player tries to leave the world', () => {
    useGameStore.setState((state) => ({
      player: { ...state.player!, tileX: 0, tileY: 0 },
    }));

    useGameStore.getState().movePlayer(-1, -1);

    const logs = useGameStore.getState().log;
    const boundaryLog = logs.find((entry) => entry.text.includes('edge of the world'));
    expect(boundaryLog).toBeDefined();
    expect(boundaryLog!.type).toBe('warning');
  });
});
