import { describe, it, expect } from 'vitest';
import { createCharacter, SUMMONER_CLASSES, CONTRACT_PATHS } from '../core/playerCore/characterCreation.ts';
import type { CharacterCreationResult } from '../core/playerCore/characterCreation.ts';

describe('characterCreation', () => {
  it('creates a valid character with defaults', () => {
    const result: CharacterCreationResult = createCharacter({ name: 'Test Summoner' });

    expect(result.playerCore.identity.name).toBe('Test Summoner');
    expect(result.playerCore.level).toBe(1);
    expect(result.playerCore.experience).toBe(0n);
    expect(result.playerCore.creatureContracts).toHaveLength(1);
    expect(result.playerCore.statistics.creaturesContracted).toBe(1);
    expect(result.startingCreature.level).toBe(1);
    expect(result.startingCreature.templateKey).toBe(result.startingTemplate.key);
  });

  it('assigns class-specific starting bonuses', () => {
    const alchemist = createCharacter({
      name: 'Alchemist Test',
      className: 'alchemist',
    });

    expect(alchemist.classDef.id).toBe('alchemist');
    expect(alchemist.playerCore.identity.name).toBe('Alchemist Test');
    expect(alchemist.classDef.startingBonus.money).toBe(500);
    expect(alchemist.classDef.startingBonus.items).toHaveLength(1);
  });

  it('applies starting element from selection', () => {
    const iceUser = createCharacter({
      name: 'Ice Shaman',
      startingElement: 'ice',
    });

    expect(iceUser.affinity.primary).toBe('ice');
    expect(iceUser.playerCore.elements.primary).toBe('ice');
  });

  it('stores first contract path in profile', () => {
    const drakeUser = createCharacter({
      name: 'Dragon Tamer',
      contractPathKey: 'drake',
    });

    expect(drakeUser.contractPath.key).toBe('drake');
    expect(drakeUser.playerCore.summonerProfile.firstContractPath).toBe('drake');
    expect(drakeUser.startingTemplate.type).toBe('dragon');
  });

  it('generates deterministic creature for contract path', () => {
    const pathA = createCharacter({ name: 'A', contractPathKey: 'companion' });
    const pathB = createCharacter({ name: 'B', contractPathKey: 'companion' });

    expect(pathA.startingTemplate.type).toBe('beast');
    expect(pathB.startingTemplate.key).toBe(pathA.startingTemplate.key);
  });

  it('supports custom starting world', () => {
    const world10Char = createCharacter({
      name: 'World 10 Traveler',
      startingWorldId: 10,
    });

    expect(world10Char.playerCore.worldUnlocks.unlockedWorlds).toEqual([10]);
    expect(world10Char.playerCore.worldUnlocks.activeWorldId).toBe(10);
    expect(world10Char.playerCore.summonerProfile.startingWorldId).toBe(10);
  });

  it('wraps starting creature in a contract with default metadata', () => {
    const result = createCharacter({ name: 'Contract Test' });
    const contract = result.playerCore.creatureContracts[0]!;

    expect(contract).toBeDefined();
    expect(contract.id).toBe(result.startingCreature.id);
    expect(contract.bondLevel).toBe(1);
    expect(contract.trust).toBe(50);
    expect(contract.loyalty).toBe(50);
    expect(contract.contractStability).toBe(100);
    expect(contract.tradeStatus).toBe('bound');
    expect(contract.commandPermissions).toContain('follow');
    expect(contract.commandPermissions).toContain('attack');
  });

  it('throws on invalid class', () => {
    expect(() => createCharacter({ name: 'Bad', className: 'invalid_class' } as any)).toThrow('Unknown class');
  });

  it('throws on invalid contract path', () => {
    expect(() => createCharacter({ name: 'Bad', contractPathKey: 'invalid_path' } as any)).toThrow('Unknown contract path');
  });

  it('allows appearance presets to be passed through', () => {
    const result = createCharacter({
      name: 'Appearance Test',
      appearance: { hair: 'blue', eyes: 'green', skin: 'pale' },
    });

    expect(result.playerCore.identity.appearance).toEqual({ hair: 'blue', eyes: 'green', skin: 'pale' });
  });

  it('produces all 8 valid summoner classes', () => {
    const classIds = Object.keys(SUMMONER_CLASSES);
    expect(classIds).toHaveLength(8);
    expect(classIds).toContain('beast_binder');
    expect(classIds).toContain('elementalist');
    expect(classIds).toContain('warden');
    expect(classIds).toContain('ritualist');
    expect(classIds).toContain('tactician');
    expect(classIds).toContain('alchemist');
    expect(classIds).toContain('pathfinder');
    expect(classIds).toContain('duelist');
  });

  it('produces all 5 valid contract paths', () => {
    const pathKeys = Object.keys(CONTRACT_PATHS);
    expect(pathKeys).toHaveLength(5);
    expect(pathKeys).toContain('companion');
    expect(pathKeys).toContain('drake');
    expect(pathKeys).toContain('shade');
    expect(pathKeys).toContain('golem');
    expect(pathKeys).toContain('wisp');
  });
});
