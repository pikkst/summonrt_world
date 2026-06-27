import { QuestTemplate } from '../types/game';

export const QUEST_TEMPLATES: Record<string, QuestTemplate> = {
  starter_explore: {
    key: 'starter_explore',
    title: 'The Great Unveiling',
    description: 'Explore at least 3 sectors of the current world to understand the terrain.',
    type: 'explore',
    amount: 3,
    rewards: {
      money: 500,
      exp: 100
    }
  },
  starter_capture: {
    key: 'starter_capture',
    title: 'Bonding with Souls',
    description: 'Capture your first creature to assist you in your journey.',
    type: 'summon',
    amount: 1,
    rewards: {
      money: 200,
      exp: 150
    }
  },
  gather_herbs: {
    key: 'gather_herbs',
    title: 'Apothecary Aid',
    description: 'Gather 5 Herbs for the local healer.',
    type: 'gather',
    target: 'herbs',
    amount: 5,
    rewards: {
      money: 300,
      items: [{ templateKey: 'healing_herb', quantity: 2 }]
    }
  },
  dungeon_clear_1: {
    key: 'dungeon_clear_1',
    title: 'Spire Initiate',
    description: 'Clear Floor 1 of the Ancient Spire to prove your worth.',
    type: 'combat',
    target: 'dungeon_floor',
    amount: 1,
    rewards: {
      money: 400,
      exp: 200,
      element: 'lightning'
    }
  },
  capture_rare: {
    key: 'capture_rare',
    title: 'Rare Soul Hunter',
    description: 'Capture 2 Rare or higher creatures.',
    type: 'summon',
    amount: 2,
    rewards: {
      money: 600,
      exp: 300,
      element: 'ice'
    }
  },
  explore_10: {
    key: 'explore_10',
    title: 'Cartographer',
    description: 'Explore 10 distinct sectors.',
    type: 'explore',
    amount: 10,
    rewards: {
      money: 800,
      exp: 400,
      element: 'air'
    }
  },
  first_fusion: {
    key: 'first_fusion',
    title: 'Soul Convergence',
    description: 'Perform your first creature fusion at a Soul Forge.',
    type: 'summon',
    target: 'fusion',
    amount: 1,
    rewards: {
      money: 1000,
      exp: 500,
      items: [{ templateKey: 'soul_crystal_rare', quantity: 2 }]
    }
  },
  merchant_run: {
    key: 'merchant_run',
    title: 'Merchant\'s Run',
    description: 'Sell 10 items to merchants.',
    type: 'gather',
    target: 'sold_items',
    amount: 10,
    rewards: {
      money: 1500,
      exp: 350,
      element: 'earth'
    }
  },
  dungeon_clear_3: {
    key: 'dungeon_clear_3',
    title: 'Spire Conqueror',
    description: 'Clear Floors 1-3 of the Ancient Spire.',
    type: 'combat',
    target: 'dungeon_floor',
    amount: 3,
    rewards: {
      money: 2000,
      exp: 800,
      element: 'fire'
    }
  },
  boss_slayer: {
    key: 'boss_slayer',
    title: 'World Boss Slayer',
    description: 'Defeat the World Boss of Floor 1.',
    type: 'combat',
    target: 'world_boss',
    amount: 1,
    rewards: {
      money: 5000,
      exp: 2000,
      items: [{ templateKey: 'boss_egg', quantity: 1 }]
    }
  },
  convergence_part1: {
    key: 'convergence_part1',
    title: 'The Celestial Forge',
    description: 'Acquire the Primordial Shard from the Ancient Spire Floor 10 boss.',
    type: 'combat',
    target: 'dungeon_floor',
    amount: 10,
    rewards: {
      money: 2000,
      exp: 1000
    }
  },
  convergence_part2: {
    key: 'convergence_part2',
    title: 'Elemental Resonance',
    description: 'Collect all 10 base elemental essences and bring them to the Convergence Altar.',
    type: 'gather',
    target: 'element_essences',
    amount: 10,
    rewards: {
      money: 5000,
      exp: 2000
    }
  },
  convergence_part3: {
    key: 'convergence_part3',
    title: 'The Great Convergence',
    description: 'Merge the essences at the Convergence Altar to awaken the Omni element.',
    type: 'summon',
    target: 'fusion',
    amount: 1,
    rewards: {
      money: 10000,
      exp: 5000,
      element: 'omni'
    }
  }
};
