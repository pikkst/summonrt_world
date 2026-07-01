import { SeededRandom } from '../../utils/SeededRandom';
import type { RoomInteractionChoice } from '../../types/game';

export interface TrapRoomInteraction {
  description: string;
  choices: { id: string; label: string; description: string }[];
}

export interface PuzzleRoomInteraction {
  description: string;
  choices: { id: string; label: string; description: string }[];
}

export interface EliteRoomInteraction {
  description: string;
  enemyLevel: number;
  enemyName: string;
}

export interface VendorRoomInteraction {
  description: string;
  items: { key: string; name: string; price: number; stock: number }[];
}

export interface TreasureRoomInteraction {
  description: string;
  hasMythicalEgg: boolean;
}

export const generateTrapInteraction = (rng: SeededRandom): TrapRoomInteraction => {
  const trapTypes: TrapRoomInteraction[] = [
    {
      description: "A pressure plate triggers a dart trap! Poison darts shoot across the corridor.",
      choices: [
        { id: 'dodge', label: 'Dodge', description: 'Attempt to evade the darts (Agility check)' },
        { id: 'block', label: 'Block', description: 'Raise your arm to shield your face (Defense check)' },
        { id: 'endure', label: 'Endure', description: 'Accept the damage and push through' }
      ]
    },
    {
      description: "A tripwire releases a cloud of toxic gas! The air shimmers with dark mist.",
      choices: [
        { id: 'hold_breath', label: 'Hold Breath', description: 'Take a deep breath and wait (Stamina check)' },
        { id: 'disarm', label: 'Disarm', description: 'Try to disable the mechanism (Skill check)' },
        { id: 'rush', label: 'Rush Through', description: 'Sprint before the gas fills the room' }
      ]
    },
    {
      description: "A hidden blade swings from the wall! The metal glints in the dim light.",
      choices: [
        { id: 'duck', label: 'Duck', description: 'Drop low to avoid the strike (Agility check)' },
        { id: 'parry', label: 'Parry', description: 'Deflect with your weapon (Combat check)' },
        { id: 'backflip', label: 'Backflip', description: 'Acrobatic escape (Skill check)' }
      ]
    }
  ];

  const idx = rng.int(0, trapTypes.length - 1);
  return trapTypes[idx]!;
};

export const generatePuzzleInteraction = (rng: SeededRandom, worldIndex: number): PuzzleRoomInteraction => {
  const puzzleTypes: PuzzleRoomInteraction[] = [
    {
      description: "Three stone pedestals hold orbs of different colors. A riddle is inscribed: 'Fire burns, Water flows, Earth endures. Choose in reverse order of creation.'",
      choices: [
        { id: 'earth_fire_water', label: 'Earth, Fire, Water', description: 'Ancient order of the elements' },
        { id: 'water_fire_earth', label: 'Water, Fire, Earth', description: 'Natural cycle' },
        { id: 'fire_water_earth', label: 'Fire, Water, Earth', description: 'Triangle of power' }
      ]
    },
    {
      description: "A pattern of runes glows on the floor. The sequence shifts: ▲●■▲●■, then ■●▲■●▲, then...?",
      choices: [
        { id: 'triangle_circle_square', label: '▲●■', description: 'Original pattern' },
        { id: 'square_circle_triangle', label: '■●▲', description: 'Inverted pattern' },
        { id: 'circle_triangle_square', label: '●▲■', description: 'Shifted pattern' }
      ]
    },
    {
      description: "An ancient lock displays four symbols: ☀︎ ♁ ♃ ♄. A voice whispers: 'Align the path to the cosmos.'",
      choices: [
        { id: 'sun_earth_mars_saturn', label: 'Sun-Earth-Mars-Saturn', description: 'Natural order' },
        { id: 'sun_mars_earth_saturn', label: 'Sun-Mars-Earth-Saturn', description: 'Battle order' },
        { id: 'earth_sun_mars_saturn', label: 'Earth-Sun-Mars-Saturn', description: 'Ground-first path' }
      ]
    }
  ];

  const idx = rng.int(0, puzzleTypes.length - 1);
  const puzzle = puzzleTypes[idx]!;
  return {
    ...puzzle,
    description: worldIndex > 20
      ? `${puzzle.description} The magic here feels stronger - the solution matters more.`
      : puzzle.description
  };
};

export const generateEliteInteraction = (rng: SeededRandom, worldIndex: number): EliteRoomInteraction => {
  const elitePrefixes = ['Alpha', 'Beta', 'Gamma', 'Prime', 'Elder', 'Ancient', 'Void', 'Chaos'];
  const eliteSuffixes = ['Warden', 'Guardian', 'Sentinel', 'Protector', 'Keeper', 'Watcher'];

  const prefix = elitePrefixes[rng.int(0, elitePrefixes.length - 1)];
  const suffix = eliteSuffixes[rng.int(0, eliteSuffixes.length - 1)];
  const enemyLevel = Math.max(1, worldIndex + rng.int(0, 5));

  return {
    description: `A powerful elite guardian stands guard! Its eyes glow with ancient knowledge.`,
    enemyLevel,
    enemyName: `${prefix} ${suffix}`
  };
};

export const generateVendorInteraction = (rng: SeededRandom, worldIndex: number): VendorRoomInteraction => {
  const vendorTypes = [
    { name: 'Wandering Merchant', stockMultiplier: 1 },
    { name: 'Dungeon Peddler', stockMultiplier: 1.5 },
    { name: 'Forgotten Trader', stockMultiplier: 2 }
  ];

  const vendorIdx = rng.int(0, vendorTypes.length - 1);
  const vendor = vendorTypes[vendorIdx]!;
  const baseStock = Math.max(1, Math.floor(worldIndex / 10) + 2);

  const items = [
    { key: 'healing_herb', name: 'Healing Herb', price: 50, stock: 5 },
    { key: 'mana_crystal', name: 'Mana Crystal', price: 75, stock: 3 },
    { key: 'basic_food', name: 'Travel Rations', price: 25, stock: 10 },
    { key: 'soul_crystal_common', name: 'Soul Crystal (Common)', price: 200, stock: 2 },
    { key: 'resource_shard', name: 'Essence Shard', price: 100, stock: baseStock }
  ];

  const adjustedItems = items.map(item => ({
    ...item,
    stock: Math.min(item.stock * vendor.stockMultiplier, 20)
  }));

  return {
    description: `${vendor.name} has set up shop in this chamber. Rare dungeon wares available!`,
    items: adjustedItems
  };
};

export const generateTreasureInteraction = (rng: SeededRandom, worldIndex: number): TreasureRoomInteraction => {
  const mythicalChance = Math.max(0.001, 0.01 - (worldIndex * 0.0001));
  const hasMythicalEgg = rng.next() < mythicalChance;

  return {
    description: hasMythicalEgg
      ? "An ornate chest pulses with ethereal light! You sense something extraordinary within."
      : "A treasure chest rests on a stone pedestal, waiting to be claimed.",
    hasMythicalEgg
  };
};

export const resolveTrapRoom = (
  choice: string,
  playerDexterity: number,
  playerDefense: number,
  rng: SeededRandom
): { success: boolean; damageTaken?: number; message: string } => {
  const dodgeThreshold = 15 + playerDexterity;
  const blockThreshold = 12 + playerDefense;
  const endureDamage = 8 + rng.int(0, 4);

  switch (choice) {
    case 'dodge':
    case 'duck':
    case 'hold_breath':
    case 'backflip':
    case 'rush':
      if (rng.int(0, 100) < dodgeThreshold) {
        return { success: true, message: "You deftly avoided the trap! No damage taken." };
      }
      return { success: false, damageTaken: endureDamage, message: "You took some damage but escaped." };
    case 'block':
    case 'parry':
      if (rng.int(0, 100) < blockThreshold) {
        return { success: true, message: "Your defense absorbed the trap's impact! No damage taken." };
      }
      return { success: false, damageTaken: Math.floor(endureDamage * 0.6), message: "You took reduced damage." };
    case 'disarm':
      if (rng.int(0, 100) < (10 + playerDexterity)) {
        return { success: true, message: "You successfully disarmed the trap! Ingenious." };
      }
      return { success: false, damageTaken: endureDamage, message: "The trap triggered despite your efforts." };
    case 'endure':
      return { success: false, damageTaken: endureDamage, message: "You pushed through, taking the full damage." };
    default:
      return { success: false, damageTaken: 10, message: "Unexpected choice. The trap caught you off guard." };
  }
};

export const resolvePuzzleRoom = (
  choice: string,
  _rng: SeededRandom
): { success: boolean; message: string } => {
  const correctChoice = choice === 'earth_fire_water' ||
                          choice === 'square_circle_triangle' ||
                          choice === 'sun_earth_mars_saturn';

  if (correctChoice || _rng.chance(0.35)) {
    return { success: true, message: "The mechanism clicks satisfactorily. The path opens!" };
  }
  return { success: false, message: "Your answer proves incorrect. The magic recoils..." };
};
