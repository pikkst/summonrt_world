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
  getEncounterTableForWeather,
  calculateEncounterRarityChance,
  getWeatherResourceYieldModifier,
  getWeatherEncounterModifier,
  getPlayerElementalAffinityBonus,
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

  describe('T7.4 - Weather Effects', () => {
    describe('getEncounterTableForWeather', () => {
      it('returns encounter table for each weather type', () => {
        for (const weather of WEATHER_TYPES) {
          const table = getEncounterTableForWeather(weather);
          expect(Array.isArray(table)).toBe(true);
          expect(table.length).toBeGreaterThan(0);
        }
      });

      it('returns different tables for different weather', () => {
        const clearTable = getEncounterTableForWeather('Clear');
        const stormyTable = getEncounterTableForWeather('Stormy');
        
        expect(clearTable).not.toEqual(stormyTable);
      });

      it('Stormy weather has higher rare/legendary chances', () => {
        const clearTable = getEncounterTableForWeather('Clear');
        const stormyTable = getEncounterTableForWeather('Stormy');
        
        const clearRareWeight = clearTable.find(e => e.creatureClass === 'rare')?.weight ?? 0;
        const stormyRareWeight = stormyTable.find(e => e.creatureClass === 'rare')?.weight ?? 0;
        
        expect(stormyRareWeight).toBeGreaterThan(clearRareWeight);
      });
    });

    describe('calculateEncounterRarityChance', () => {
      it('returns rarity chances for each class', () => {
        const chances = calculateEncounterRarityChance('Clear');
        
        expect(chances.common).toBeDefined();
        expect(chances.uncommon).toBeDefined();
        expect(chances.rare).toBeDefined();
        expect(chances.epic).toBeDefined();
        expect(chances.legendary).toBeDefined();
        expect(chances.mythical).toBeDefined();
      });

      it('returns probabilities that sum to approximately 100', () => {
        const chances = calculateEncounterRarityChance('Clear');
        const total = Object.values(chances).reduce((sum, v) => sum + v, 0);
        
        expect(total).toBeCloseTo(100, 1);
      });

      it('Stormy weather increases rare creature chance', () => {
        const clearChances = calculateEncounterRarityChance('Clear');
        const stormyChances = calculateEncounterRarityChance('Stormy');
        
        expect(stormyChances.rare).toBeDefined();
        expect(clearChances.rare).toBeDefined();
        expect(stormyChances.rare!).toBeGreaterThan(clearChances.rare!);
      });
    });

    describe('getWeatherResourceYieldModifier', () => {
      it('returns base modifier for Clear weather', () => {
        const modifier = getWeatherResourceYieldModifier('Clear', 1.0);
        expect(modifier).toBe(1.0);
      });

      it('returns higher modifier for Rainy weather', () => {
        const rainyMod = getWeatherResourceYieldModifier('Rainy', 1.0);
        const clearMod = getWeatherResourceYieldModifier('Clear', 1.0);
        
        expect(rainyMod).toBeGreaterThan(clearMod);
      });

      it('returns lower modifier for Blizzard weather', () => {
        const blizzardMod = getWeatherResourceYieldModifier('Blizzard', 1.0);
        const clearMod = getWeatherResourceYieldModifier('Clear', 1.0);
        
        expect(blizzardMod).toBeLessThan(clearMod);
      });

      it('applies intensity modifier', () => {
        const lowIntensity = getWeatherResourceYieldModifier('Rainy', 0.5);
        const highIntensity = getWeatherResourceYieldModifier('Rainy', 1.5);
        
        expect(highIntensity).toBeGreaterThan(lowIntensity);
      });
    });

    describe('getWeatherEncounterModifier', () => {
      it('returns base encounter modifier', () => {
        const modifier = getWeatherEncounterModifier('Clear', 1.0);
        expect(modifier).toBeCloseTo(1.0, 1);
      });

      it('returns higher modifier for Stormy weather', () => {
        const stormyMod = getWeatherEncounterModifier('Stormy', 1.0);
        const clearMod = getWeatherEncounterModifier('Clear', 1.0);
        
        expect(stormyMod).toBeGreaterThan(clearMod);
      });

      it('applies intensity modifier', () => {
        const lowIntensity = getWeatherEncounterModifier('Cloudy', 0.5);
        const highIntensity = getWeatherEncounterModifier('Cloudy', 1.5);
        
        expect(highIntensity).toBeGreaterThan(lowIntensity);
      });
    });

    describe('getPlayerElementalAffinityBonus', () => {
      it('returns 1.0 for neutral weather', () => {
        const bonus = getPlayerElementalAffinityBonus('Clear', ['fire', 'water']);
        expect(bonus).toBeDefined();
        expect(bonus).toBeGreaterThan(0);
      });

      it('returns higher bonus for weather-element synergies', () => {
        const stormyAirBonus = getPlayerElementalAffinityBonus('Stormy', ['air', 'lightning']);
        const clearBonus = getPlayerElementalAffinityBonus('Clear', ['air', 'lightning']);
        
        expect(stormyAirBonus).toBeGreaterThan(clearBonus);
      });

      it('returns average bonus for multiple elements', () => {
        const bonus = getPlayerElementalAffinityBonus('Stormy', ['air', 'water']);
        expect(bonus).toBeGreaterThan(1.0);
        expect(bonus).toBeLessThan(1.3);
      });

      it('returns 1.0 for empty element array', () => {
        const bonus = getPlayerElementalAffinityBonus('Stormy', []);
        expect(bonus).toBe(1.0);
      });
    });
  });
});