import { describe, it, expect } from 'vitest';
import { SUMMONER_CLASSES, getAllClasses, getClassById, getClassModifiers, type ClassModifiers, type SummonerClassId } from '../data/summonerClasses';

describe('summonerClasses data module', () => {
  it('defines all 8 required summoner classes', () => {
    const ids = Object.keys(SUMMONER_CLASSES);
    expect(ids).toHaveLength(8);
    expect(ids).toContain('beast_binder');
    expect(ids).toContain('elementalist');
    expect(ids).toContain('warden');
    expect(ids).toContain('ritualist');
    expect(ids).toContain('tactician');
    expect(ids).toContain('alchemist');
    expect(ids).toContain('pathfinder');
    expect(ids).toContain('duelist');
  });

  it('each class has required fields', () => {
    for (const cls of Object.values(SUMMONER_CLASSES)) {
      expect(cls.id).toBeTruthy();
      expect(cls.name).toBeTruthy();
      expect(cls.description).toBeTruthy();
      expect(cls.icon).toBeTruthy();
      expect(typeof cls.statBias).toBe('object');
      expect(cls.startingBonus).toBeDefined();
    }
  });

  it('getAllClasses returns all class definitions', () => {
    const all = getAllClasses();
    expect(all).toHaveLength(8);
    expect(all.map(c => c.id).sort()).toEqual(Object.keys(SUMMONER_CLASSES).sort());
  });

  it('getClassById returns the correct class', () => {
    const warden = getClassById('warden');
    expect(warden).toBeDefined();
    expect(warden?.name).toBe('Warden');
    expect(warden?.statBias.vitality).toBe(2);
    expect(warden?.startingBonus.items).toHaveLength(1);
  });

  it('getClassById returns undefined for unknown class', () => {
    expect(getClassById('unknown_class' as SummonerClassId)).toBeUndefined();
  });

  it('getClassModifiers returns stat bias and starting bonus', () => {
    const modifiers: ClassModifiers | undefined = getClassModifiers('alchemist');
    expect(modifiers).toBeDefined();
    expect(modifiers?.statBias.intelligence).toBe(2);
    expect(modifiers?.startingBonus.money).toBe(500);
  });

  it('getClassModifiers returns undefined for unknown class', () => {
    expect(getClassModifiers('invalid' as SummonerClassId)).toBeUndefined();
  });

  it('no class has empty starting bonus', () => {
    for (const cls of Object.values(SUMMONER_CLASSES)) {
      const hasBonus = cls.startingBonus.money !== undefined || cls.startingBonus.items !== undefined;
      expect(hasBonus).toBe(true);
    }
  });

  it('all class icons are non-empty strings', () => {
    for (const cls of Object.values(SUMMONER_CLASSES)) {
      expect(cls.icon.length).toBeGreaterThanOrEqual(1);
    }
  });
});
