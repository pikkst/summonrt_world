import type { ElementalAffinity, CreatureInstance, WorldData, LogEntry, ItemTemplate, TileData, CreatureTemplate, PlayerState } from '../types/game.ts';
import { generateCreatureTemplate } from '../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../utils/SeededRandom.ts';

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

  processTurn(): void {
    this.rng = new SeededRandom(this.state.turnCount + (this.state.player?.id.charCodeAt(0) || 0));
    this.tickWorlds();
    this.tickPlayer();
    this.tickCreatures();
  }

  private tickWorlds(): void {
    for (const world of this.state.worlds.values()) {
      for (const tile of world.tiles.values()) {
        if (tile.resourceQty !== undefined && tile.resourceQty < 5 && this.rng.chance(0.1)) {
          tile.resourceQty = (tile.resourceQty || 0) + 1;
        }
      }
    }
  }

  private tickPlayer(): void {
    const player = this.state.player;
    if (!player) return;

    for (const creature of player.creatures) {
      const template = generateCreatureTemplate(player.currentWorldId, this.rng);
      creature.currentHealth = Math.min(creature.currentHealth + 2, template.baseHealth + creature.level * 5);
      creature.currentMana = Math.min(creature.currentMana + 1, template.baseMana + creature.level * 3);
    }
  }

  private tickCreatures(): void {
    const player = this.state.player;
    if (!player) return;
    player.experience += 1;
    if (player.experience >= this.getLevelThreshold(player.level)) {
      player.level += 1;
      player.life.max += 10;
      player.life.current = player.life.max;
      player.energy.max += 5;
      player.energy.current = player.energy.max;
    }
  }

  getLevelThreshold(level: number): number {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  }

  generateEncounter(worldId: number, tile: TileData, _affinity: ElementalAffinity): { template: CreatureTemplate; name: string } | null {
    const rng = new SeededRandom(this.rng.next() * 10000);
    
    // Proximity scaling
    const distToCenter = Math.hypot(tile.x - 1000, tile.y - 1000);
    const maxDist = 1414;
    const proximityFactor = Math.max(0, 1 - (distToCenter / maxDist));
    
    const effectiveWorldTier = Math.max(1, worldId + Math.floor(proximityFactor * 10) + Math.floor((this.state.player?.level || 1) / 5));
    const template = generateCreatureTemplate(effectiveWorldTier, rng);
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
     });
   }

    return loot;
  }
}
