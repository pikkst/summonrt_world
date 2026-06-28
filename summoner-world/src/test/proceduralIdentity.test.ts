import { describe, it, expect, vi } from 'vitest';
import {
  generateProceduralIdentity,
  generateColorPalette,
  interpolateColor,
  getCombinedElementalFX,
  ELEMENTAL_FX,
  BASE_COLORS,
  HEAD_VARIANTS,
  BODY_VARIANTS,
  LIMB_VARIANTS,
  ELEMENTS,
} from '../data/proceduralIdentity';
import type { Element, CreatureType } from '../types/game';

describe('proceduralIdentity', () => {
  describe('interpolateColor', () => {
    it('returns color1 when factor is 0', () => {
      const result = interpolateColor('#FF0000', '#0000FF', 0);
      expect(result).toBe('#FF0000');
    });

    it('returns color2 when factor is 1', () => {
      const result = interpolateColor('#FF0000', '#0000FF', 1);
      expect(result.toUpperCase()).toBe('#0000FF'.toUpperCase());
    });

    it('returns interpolated color when factor is 0.5', () => {
      const result = interpolateColor('#FF0000', '#0000FF', 0.5);
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('handles color interpolation correctly', () => {
      const result = interpolateColor('#FF0000', '#00FF00', 0.5);
      expect(result.toLowerCase()).toBe('#808000');
    });
  });

  describe('generateColorPalette', () => {
    it('generates palette from single element', () => {
      const color1 = '#FF0000';
      const color2 = '#FF0000';
      const mockRng = () => 0.5;
      const palette = generateColorPalette(['fire' as Element], mockRng);
      
      expect(palette.primary).toBe(color1);
      expect(palette.secondary).toBe(color2);
    });

    it('generates palette from dual elements', () => {
      const mockRng = () => 0.5;
      const palette = generateColorPalette(['fire' as Element, 'water' as Element], mockRng);
      
      expect(palette.primary).toBe('#FF4500');
      expect(palette.secondary).toBe('#1E90FF');
      expect(palette.accent).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('handles void element', () => {
      const palette = generateColorPalette(['void' as Element], () => 0);
      expect(palette.primary).toBe('#8A2BE2');
    });
  });

  describe('generateProceduralIdentity', () => {
    it('generates identity for beast type with single element', () => {
      const mockRng = vi.fn(() => 0.5);
      const identity = generateProceduralIdentity('beast', ['fire' as Element], mockRng);
      
      expect(identity.headVariant).toBe(4);
      expect(identity.bodyVariant).toBe(4);
      expect(identity.limbVariant).toBe(4);
      expect(identity.elementalFx).toBeDefined();
      expect(identity.colorPalette).toBeDefined();
    });

    it('generates identity for dragon type with dual elements', () => {
      const mockRng = vi.fn(() => 0.5);
      const identity = generateProceduralIdentity('dragon', ['fire' as Element, 'air' as Element], mockRng);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.fire);
      expect(identity.colorPalette.primary).toBe('#FF4500');
      expect(identity.colorPalette.secondary).toBe('#87CEEB');
    });

    it('generates identity for undead type', () => {
      const identity = generateProceduralIdentity('undead', ['darkness' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.darkness);
      expect(identity.colorPalette.primary).toBe('#4B0082');
    });

    it('generates identity for construct type', () => {
      const identity = generateProceduralIdentity('construct', ['iron' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.iron);
    });

    it('generates identity for spirit type', () => {
      const identity = generateProceduralIdentity('spirit', ['light' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.light);
    });

    it('generates identity for demon type', () => {
      const identity = generateProceduralIdentity('demon', ['void' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.void);
    });

    it('generates identity for celestial type', () => {
      const identity = generateProceduralIdentity('celestial', ['light' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.light);
    });

    it('generates identity for insect type', () => {
      const identity = generateProceduralIdentity('insect', ['nature' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.nature);
    });

    it('generates identity for plant type', () => {
      const identity = generateProceduralIdentity('plant', ['nature' as Element], () => 0.3);
      
      expect(identity.elementalFx).toEqual(ELEMENTAL_FX.nature);
    });

    it('handles empty elements array', () => {
      const identity = generateProceduralIdentity('beast', [], () => 0);
      
      expect(identity.colorPalette).toBeDefined();
    });

    it('generates different variants with different RNG values', () => {
      const identities = [
        generateProceduralIdentity('beast', ['fire' as Element], () => 0),
        generateProceduralIdentity('beast', ['fire' as Element], () => 0.25),
        generateProceduralIdentity('beast', ['fire' as Element], () => 0.5),
        generateProceduralIdentity('beast', ['fire' as Element], () => 0.75),
      ];
      
      const uniqueHeads = new Set(identities.map(i => i.headVariant));
      const uniqueBodies = new Set(identities.map(i => i.bodyVariant));
      const uniqueLimbs = new Set(identities.map(i => i.limbVariant));
      
      expect(uniqueHeads.size).toBeGreaterThan(1);
      expect(uniqueBodies.size).toBeGreaterThan(1);
      expect(uniqueLimbs.size).toBeGreaterThan(1);
    });
  });

  describe('getCombinedElementalFX', () => {
    it('returns single element FX when one element provided', () => {
      const fx = getCombinedElementalFX(['fire' as Element]);
      expect(fx.trail).toBe('ember_smoke');
      expect(fx.aura).toBe('flame_aura');
      expect(fx.impact).toBe('fire_explosion');
    });

    it('returns combined FX when two elements provided', () => {
      const fx = getCombinedElementalFX(['fire' as Element, 'water' as Element]);
      expect(fx.trail).toBe('ember_smoke_water_drip');
      expect(fx.aura).toBe('flame_aura_water_shell');
      expect(fx.impact).toBe('fire_explosion_water_splash');
    });

    it('returns fire FX when empty array provided', () => {
      const fx = getCombinedElementalFX([]);
      expect(fx.trail).toBe('ember_smoke');
    });
  });

  describe('variant arrays', () => {
    it('has head variants for all creature types', () => {
      const types: CreatureType[] = ['beast', 'dragon', 'undead', 'construct', 'spirit', 'demon', 'celestial', 'insect', 'plant'];
      types.forEach(type => {
        expect(HEAD_VARIANTS[type]).toBeDefined();
        expect(HEAD_VARIANTS[type].length).toBeGreaterThan(0);
      });
    });

    it('has body variants for all creature types', () => {
      const types: CreatureType[] = ['beast', 'dragon', 'undead', 'construct', 'spirit', 'demon', 'celestial', 'insect', 'plant'];
      types.forEach(type => {
        expect(BODY_VARIANTS[type]).toBeDefined();
        expect(BODY_VARIANTS[type].length).toBeGreaterThan(0);
      });
    });

    it('has limb variants for all creature types', () => {
      const types: CreatureType[] = ['beast', 'dragon', 'undead', 'construct', 'spirit', 'demon', 'celestial', 'insect', 'plant'];
      types.forEach(type => {
        expect(LIMB_VARIANTS[type]).toBeDefined();
        expect(LIMB_VARIANTS[type].length).toBeGreaterThan(0);
      });
    });

    it('has elemental FX for all elements', () => {
      ELEMENTS.forEach(element => {
        expect(ELEMENTAL_FX[element]).toBeDefined();
        expect(ELEMENTAL_FX[element].trail).toBeDefined();
        expect(ELEMENTAL_FX[element].aura).toBeDefined();
        expect(ELEMENTAL_FX[element].impact).toBeDefined();
      });
    });

    it('has base colors for all elements', () => {
      ELEMENTS.forEach(element => {
        expect(BASE_COLORS[element]).toBeDefined();
        expect(BASE_COLORS[element]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});