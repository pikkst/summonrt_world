import { describe, it, expect, vi } from 'vitest';
import { worldEventBus, type WorldTravelEvent } from '../core/worldEventBus';

describe('T7.14 - World Travel Events', () => {
  it('subscribes and receives PlayerEnteredWorld', () => {
    const handler = vi.fn();
    const unsub = worldEventBus.subscribe('PlayerEnteredWorld', handler);

    worldEventBus.publish({
      type: 'PlayerEnteredWorld',
      playerId: 'player_1',
      worldId: 2,
      fromWorldId: 1,
      gameTimeMinutes: 120,
      turnCount: 20,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'PlayerEnteredWorld',
      playerId: 'player_1',
      worldId: 2,
      fromWorldId: 1,
      gameTimeMinutes: 120,
      turnCount: 20,
    });

    unsub();
    worldEventBus.publish({
      type: 'PlayerEnteredWorld',
      playerId: 'player_1',
      worldId: 3,
      fromWorldId: 2,
      gameTimeMinutes: 180,
      turnCount: 30,
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('subscribes and receives PlayerEnteredBiome and BiomeEntered', () => {
    const playerHandler = vi.fn();
    const worldHandler = vi.fn();
    worldEventBus.subscribe('PlayerEnteredBiome', playerHandler);
    worldEventBus.subscribe('BiomeEntered', worldHandler);

    worldEventBus.publish({
      type: 'PlayerEnteredBiome',
      playerId: 'player_1',
      worldId: 1,
      x: 100,
      y: 200,
      biome: 'forest',
      gameTimeMinutes: 120,
      turnCount: 20,
    });
    worldEventBus.publish({
      type: 'BiomeEntered',
      worldId: 1,
      x: 100,
      y: 200,
      biome: 'forest',
      gameTimeMinutes: 120,
      turnCount: 20,
    });

    expect(playerHandler).toHaveBeenCalledTimes(1);
    expect(worldHandler).toHaveBeenCalledTimes(1);
  });

  it('subscribes and receives WeatherChanged', () => {
    const handler = vi.fn();
    worldEventBus.subscribe('WeatherChanged', handler);

    worldEventBus.publish({
      type: 'WeatherChanged',
      worldId: 1,
      previousWeather: 'Clear',
      currentWeather: 'Rainy',
      intensity: 1.2,
      gameTimeMinutes: 300,
      turnCount: 40,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'WeatherChanged',
      worldId: 1,
      previousWeather: 'Clear',
      currentWeather: 'Rainy',
      intensity: 1.2,
      gameTimeMinutes: 300,
      turnCount: 40,
    });
  });

  it('subscribes and receives ResourceSpawned', () => {
    const handler = vi.fn();
    worldEventBus.subscribe('ResourceSpawned', handler);

    worldEventBus.publish({
      type: 'ResourceSpawned',
      worldId: 5,
      x: 50,
      y: 75,
      resourceType: 'wood',
      quantity: 3,
      gameTimeMinutes: 600,
      turnCount: 100,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'ResourceSpawned',
      worldId: 5,
      x: 50,
      y: 75,
      resourceType: 'wood',
      quantity: 3,
      gameTimeMinutes: 600,
      turnCount: 100,
    });
  });

  it('subscribes and receives DungeonDiscovered', () => {
    const handler = vi.fn();
    worldEventBus.subscribe('DungeonDiscovered', handler);

    worldEventBus.publish({
      type: 'DungeonDiscovered',
      playerId: 'player_1',
      worldId: 1,
      x: 1000,
      y: 1000,
      gameTimeMinutes: 120,
      turnCount: 20,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'DungeonDiscovered',
      playerId: 'player_1',
      worldId: 1,
      x: 1000,
      y: 1000,
      gameTimeMinutes: 120,
      turnCount: 20,
    });
  });

  it('clears all handlers', () => {
    const handler = vi.fn();
    worldEventBus.subscribe('PlayerEnteredWorld', handler);

    worldEventBus.clear();
    worldEventBus.publish({
      type: 'PlayerEnteredWorld',
      playerId: 'player_1',
      worldId: 1,
      gameTimeMinutes: 10,
      turnCount: 1,
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
