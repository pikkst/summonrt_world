import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES } from '../data/constants';
import {
  createInitialWeatherState,
  generateWeatherForBiome,
  getNextWeather,
  updateWeather,
  getWeatherEffect,
  calculateWeatherModifier,
  weatherToDisplayString,
} from '../core/Weather';

describe('T7.3 - Weather System', () => {
  describe('Weather Types', () => {
    it('defines all 7 weather types', () => {
      expect(WEATHER_TYPES).toHaveLength(7);
      expect(WEATHER_TYPES).toContain('Clear');
      expect(WEATHER_TYPES).toContain('Cloudy');
      expect(WEATHER_TYPES).toContain('Rainy');
      expect(WEATHER_TYPES).toContain('Stormy');
      expect(WEATHER_TYPES).toContain('Foggy');
      expect(WEATHER_TYPES).toContain('Hail');
      expect(WEATHER_TYPES).toContain('Blizzard');
    });
  });

  describe('createInitialWeatherState', () => {
    it('creates deterministic weather state for same seed', () => {
      const state1 = createInitialWeatherState(12345, 0);
      const state2 = createInitialWeatherState(12345, 0);
      
      expect(state2).toEqual(state1);
    });

    it('sets valid initial weather', () => {
      const state = createInitialWeatherState(12345, 0);
      
      expect(WEATHER_TYPES).toContain(state.currentWeather);
      expect(state.weatherIntensity).toBeGreaterThan(0);
      expect(state.nextChangeTurn).toBeGreaterThan(0);
    });
  });

  describe('generateWeatherForBiome', () => {
    it('returns deterministic weather for same biome and seed', () => {
      const weather1 = generateWeatherForBiome('forest', 12345, 100);
      const weather2 = generateWeatherForBiome('forest', 12345, 100);
      
      expect(weather2).toBe(weather1);
    });

    it('returns weather for each biome type', () => {
      const biomes = ['forest', 'plains', 'mountains', 'swamp', 'desert', 'tundra', 'coast', 'volcanic', 'crystal_caves', 'sky_islands'];
      
      for (const biome of biomes) {
        const weather = generateWeatherForBiome(biome as any, 12345, 100);
        expect(WEATHER_TYPES).toContain(weather);
      }
    });
  });

  describe('getNextWeather', () => {
    it('returns deterministic next weather', () => {
      const next1 = getNextWeather('Clear', 12345, 100);
      const next2 = getNextWeather('Clear', 12345, 100);
      
      expect(next2).toBe(next1);
    });

    it('returns valid weather type', () => {
      const next = getNextWeather('Cloudy', 12345, 100);
      expect(WEATHER_TYPES).toContain(next);
    });
  });

  describe('updateWeather', () => {
    it('updates weather when turn threshold reached', () => {
      const state = {
        currentWeather: 'Clear' as const,
        weatherIntensity: 1.0,
        nextChangeTurn: 10,
        baseDuration: 10,
      };
      
      const newState = updateWeather(state, 12345, 10);
      
      expect(newState.currentWeather).not.toBe('Clear');
      expect(newState.nextChangeTurn).toBeGreaterThan(10);
    });

    it('keeps weather unchanged before threshold', () => {
      const state = {
        currentWeather: 'Clear' as const,
        weatherIntensity: 1.0,
        nextChangeTurn: 100,
        baseDuration: 100,
      };
      
      const newState = updateWeather(state, 12345, 50);
      
      expect(newState.currentWeather).toBe('Clear');
      expect(newState.nextChangeTurn).toBe(100);
    });
  });

  describe('getWeatherEffect', () => {
    it('returns effects for each weather type', () => {
      for (const weather of WEATHER_TYPES) {
        const effect = getWeatherEffect(weather);
        expect(effect.encounterModifier).toBeGreaterThan(0);
        expect(effect.resourceYieldModifier).toBeGreaterThan(0);
        expect(effect.description).toBeDefined();
      }
    });

    it('returns Clear weather with baseline modifiers', () => {
      const effect = getWeatherEffect('Clear');
      expect(effect.encounterModifier).toBe(1.0);
      expect(effect.resourceYieldModifier).toBe(1.0);
    });

    it('returns Stormy weather with highest encounter modifier', () => {
      const clearEffect = getWeatherEffect('Clear');
      const stormyEffect = getWeatherEffect('Stormy');
      
      expect(stormyEffect.encounterModifier).toBeGreaterThan(clearEffect.encounterModifier);
    });
  });

  describe('calculateWeatherModifier', () => {
    it('returns 1.0 for neutral element-weather combinations', () => {
      const modifier = calculateWeatherModifier('Clear', 'nature');
      expect(modifier).toBe(1.0);
    });

    it('returns bonus for weather-element synergies', () => {
      const stormyAir = calculateWeatherModifier('Stormy', 'air');
      expect(stormyAir).toBeGreaterThan(1.0);
    });
  });

  describe('weatherToDisplayString', () => {
    it('returns display string for each weather type', () => {
      for (const weather of WEATHER_TYPES) {
        const display = weatherToDisplayString(weather);
        expect(display).toBeDefined();
        expect(typeof display).toBe('string');
      }
    });
  });
});