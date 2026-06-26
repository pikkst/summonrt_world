export const ELEMENTS = ['fire','water','earth','air','lightning','iron','nature','ice','light','darkness'] as const;
export const BIOME_TYPES = ['forest','plains','mountains','swamp','desert','tundra','coast','volcanic','crystal_caves','sky_islands'] as const;

// Global Seeds for each Floor (1-100)
// This ensures that coordinates (X,Y) are identical for all players globally.
export const FLOOR_SEEDS: Record<number, number> = {
  1: 1337,
  2: 8888,
  3: 4242,
  // ... can be expanded or generated deterministically
};

export function getFloorSeed(floor: number): number {
  return FLOOR_SEEDS[floor] || (floor * 999 + 123456);
}

export const BIOME_NAMES = { forest:'Enchanted Forest', plains:'Verdant Plains', mountains:'Stone Peaks', swamp:'Murky Swamp', desert:'Scorched Desert', tundra:'Frozen Tundra', coast:'Azure Coast', volcanic:'Volcanic Wastes', crystal_caves:'Crystal Caverns', sky_islands:'Sky Islands' };
export const WEATHER_TYPES = ['Clear','Cloudy','Rainy','Stormy','Foggy','Hail','Blizzard'] as const;
export const RESOURCES: Record<string, {name: string, icon: string}> = { 
  wood: { name: 'Wood', icon: '🌲' }, 
  stone: { name: 'Stone', icon: '🪨' }, 
  ore: { name: 'Ore', icon: '📦' }, 
  herbs: { name: 'Herbs', icon: '🌿' }, 
  crystal: { name: 'Crystal', icon: '💎' }, 
  essence: { name: 'Essence', icon: '✨' } 
};
export const CREATURE_CLASSES = ['common','uncommon','rare','epic','legendary','mythical'] as const;
export const CLASS_WEIGHTS = [55,28,12,4,0.9,0.1];
export const DIRECTIONS = [{dx:0,dy:-1,name:'north',nameEn:'north'},{dx:0,dy:1,name:'south',nameEn:'south'},{dx:-1,dy:0,name:'west',nameEn:'west'},{dx:1,dy:0,name:'east',nameEn:'east'}];

export function getBiomeForCoords(x: number, y: number, seed: number): string {
  // Natural gradient: Edge (0,0 or 2000,2000) is Water/Coast, moving towards center (1000,1000)
  const centerX = 1000;
  const centerY = 1000;
  const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  const maxDist = 1414; // sqrt(1000^2 + 1000^2)

  const noise = Math.abs(Math.sin(x * 0.01 + y * 0.01 + seed) * 0.5);
  const normalizedDist = (dist / maxDist) + (noise * 0.1);

  if (normalizedDist > 0.8) return 'coast';
  if (normalizedDist > 0.6) return 'plains';
  if (normalizedDist > 0.4) return 'forest';
  if (normalizedDist > 0.2) return 'mountains';
  if (normalizedDist > 0.05) return 'volcanic';
  return 'crystal_caves';
}

export function getWorldName(worldId: number): string {
  const prefixes = ['Shadow','Flame','Aqua','Stone','Storm','Frost','Ember','Wind','Terra','Crystal'];
  const suffixes = ['Realm','World','Domain','Field','Expanse'];
  return `${prefixes[(worldId-1)%prefixes.length]} ${suffixes[Math.floor((worldId-1)/prefixes.length)%suffixes.length]}`;
}

export function getTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
 return [
   { x: x - 1, y },
   { x: x + 1, y },
   { x, y: y - 1 },
   { x, y: y + 1 },
 ];
}
