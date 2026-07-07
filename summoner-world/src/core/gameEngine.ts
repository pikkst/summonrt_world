import type { ElementalAffinity, CreatureInstance, WorldData, LogEntry, ItemTemplate, TileData, CreatureTemplate, PlayerState } from '../types/game.ts';
import { generateCreatureTemplate, pickRandomSpeciesKey, getRandomSpeciesStage, registerSpeciesLine } from '../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../utils/SeededRandom.ts';
import { applyCreatureXP, grantPartyXP, getXPThreshold } from './xpCurve.ts';

export interface GameEngineState {
  player: PlayerState | null;
  worlds: Map<number, WorldData>;
  currentWorldId: number;
  log: LogEntry[];
  turnCount: number;
}

export class GameEngine {
  private rng: SeededRandom;

  constructor(private state: GameEngineState) {
    this.rng = new SeededRandom(state.turnCount + (state.player?.id.charCodeAt(0) || 0));
  }

  processTurn(): Partial<GameEngineState> {
    this.rng = new SeededRandom(this.state.turnCount + (this.state.player?.id.charCodeAt(0) || 0));
    const worldPatch = this.tickWorlds();
    const playerPatch = this.tickPlayer();
    const creaturePatch = this.tickCreatures();
    return { ...worldPatch, ...playerPatch, ...creaturePatch };
  }

  private tickWorlds(): Partial<GameEngineState> {
    const worlds = new Map(this.state.worlds);
    for (const world of worlds.values()) {
      for (const tile of world.tiles.values()) {
        if (tile.resourceQty !== undefined && tile.resourceQty < 5 && this.rng.chance(0.1)) {
          tile.resourceQty = (tile.resourceQty || 0) + 1;
        }
      }
    }
    return { worlds };
  }

  private tickPlayer(): Partial<GameEngineState> {
    const player = this.state.player;
    if (!player) return {};

    const updatedCreatures = player.creatures.map((c) => ({
      ...c,
      currentHealth: Math.min((c.currentHealth || 0) + 2, (c.maxHealth || 100)),
      currentMana: Math.min((c.currentMana || 0) + 1, (c.maxMana || 50)),
    }));

    return {
      player: {
        ...player,
        creatures: updatedCreatures,
      },
    };
  }

  private tickCreatures(): Partial<GameEngineState> {
    const player = this.state.player;
    if (!player) return {};

    let newExp: bigint = BigInt(player.experience) + 1n;
    let newLevel = player.level;
    let skillPointsGained = 0;

    while (newExp >= getXPThreshold(newLevel)) {
      newExp -= getXPThreshold(newLevel);
      newLevel += 1;
      skillPointsGained += 2;
    }

    const updatedPlayer: PlayerState = {
      ...player,
      level: newLevel,
      experience: newExp,
      skillPoints: (player.skillPoints ?? 0) + skillPointsGained,
    };

    if (newLevel > player.level) {
      updatedPlayer.life = {
        ...player.life,
        max: 100 + (newLevel * 10),
        current: 100 + (newLevel * 10),
      };
      updatedPlayer.energy = {
        ...player.energy,
        max: 100 + (newLevel * 5),
        current: 100 + (newLevel * 5),
      };
    }

    const updatedCreatures = player.creatures.map((c) => applyCreatureXP(c, 1n).creature);

    return {
      player: {
        ...updatedPlayer,
        creatures: updatedCreatures,
      },
    };
  }

  grantPartyXP(creatureIds: string[], baseXP: number): Partial<GameEngineState> {
    const player = this.state.player;
    if (!player || creatureIds.length === 0) return {};

    const { updatedCreatures } = grantPartyXP(player.creatures, creatureIds, baseXP);
    return {
      player: {
        ...player,
        creatures: updatedCreatures,
      },
    };
  }

  generateEncounter(worldId: number, tile: TileData, _affinity: ElementalAffinity): { template: CreatureTemplate; name: string } | null {
    const rng = new SeededRandom(this.rng.next() * 10000);

    const distToCenter = Math.hypot(tile.x - 1000, tile.y - 1000);
    const maxDist = 1414;
    const proximityFactor = Math.max(0, 1 - (distToCenter / maxDist));

    const effectiveWorldTier = Math.max(1, worldId + Math.floor(proximityFactor * 10) + Math.floor((this.state.player?.level || 1) / 5));

    let template: CreatureTemplate;
    const speciesKey = pickRandomSpeciesKey(rng);
    if (speciesKey && rng.next() < 0.35) {
      const stage = getRandomSpeciesStage(speciesKey, rng);
      registerSpeciesLine(speciesKey, effectiveWorldTier);
      template = generateCreatureTemplate(effectiveWorldTier, rng, false, speciesKey, stage);
    } else {
      template = generateCreatureTemplate(effectiveWorldTier, rng);
    }

    return { template, name: `${template.name} (Level ${effectiveWorldTier})` };
  }

  generateLoot(template: CreatureTemplate, worldId: number): ItemTemplate[] {
    const rng = new SeededRandom(this.rng.next() * 10000);
    const loot: ItemTemplate[] = [];

    const rarityMultiplier = template.class === 'common' ? 1 : template.class === 'uncommon' ? 1.2 : template.class === 'rare' ? 1.5 : template.class === 'epic' ? 2 : template.class === 'legendary' ? 3 : 4;
    const baseChance = 0.4 * rarityMultiplier;

    // Always a chance for basic resources or elemental shards
    if (rng.chance(baseChance)) {
      const resourceType = rng.pick(['wood', 'stone', 'ore', 'herbs', 'crystal', 'essence']);
      loot.push({
        key: `${resourceType}_shard`,
        name: `${resourceType} Shard`,
        type: 'material',
        rarity: 1,
        stackable: true,
        maxStack: 50,
        description: `A small ${resourceType} shard.`,
        craftingTier: 'basic',
      });
    }

    // Chance for healing items or mana items
    if (rng.chance(baseChance * 0.5)) {
      if (rng.next() > 0.5) {
        loot.push({
          key: 'healing_herb',
          name: 'Healing Herb',
          type: 'consumable',
          rarity: 2,
          stackable: true,
          maxStack: 99,
          description: 'Restores 20 HP.',
          stats: { heal: 20 },
          craftingTier: 'basic',
        });
      } else {
        loot.push({
          key: 'mana_crystal',
          name: 'Mana Crystal',
          type: 'consumable',
          rarity: 2,
          stackable: true,
          maxStack: 99,
          description: 'Restores 15 Mana.',
          stats: { mana: 15 },
          craftingTier: 'basic',
        });
      }
    }

// Small chance for rare items based on worldId and creature rarity
   if (rng.chance(0.05 * worldId * rarityMultiplier)) {
     loot.push({
       key: 'rare_essence',
       name: 'Rare Essence',
       type: 'special',
       rarity: 3,
       stackable: true,
       maxStack: 10,
       description: 'Rare essence that can be used to craft powerful items.',
       craftingTier: 'intermediate',
     });
   }

    return loot;
  }
}
