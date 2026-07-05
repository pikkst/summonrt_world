import type { BiomeType } from '../../types/game';

const WORLD_SIZE = 2000;
const VORONOI_CELL_SIZE = 260;
const BIOME_REGION_ORDER: BiomeType[] = [
  'forest',
  'plains',
  'mountains',
  'swamp',
  'desert',
  'tundra',
  'coast',
  'volcanic',
  'crystal_caves',
  'sky_islands',
];

export interface BiomeGenerationSample {
  biome: BiomeType;
  regionalBiome: BiomeType;
  elevation: number;
  moisture: number;
  temperature: number;
  voronoiInfluence: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hashInt(x: number, y: number, seed: number, salt: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041) ^ salt;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function hashUnit(x: number, y: number, seed: number, salt: number): number {
  return hashInt(x, y, seed, salt) / 0xffffffff;
}

function gradientDot(gridX: number, gridY: number, x: number, y: number, seed: number, salt: number): number {
  const angle = hashUnit(gridX, gridY, seed, salt) * Math.PI * 2;
  const dx = x - gridX;
  const dy = y - gridY;
  return Math.cos(angle) * dx + Math.sin(angle) * dy;
}

function perlin2D(x: number, y: number, seed: number, salt: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const n00 = gradientDot(x0, y0, x, y, seed, salt);
  const n10 = gradientDot(x1, y0, x, y, seed, salt);
  const n01 = gradientDot(x0, y1, x, y, seed, salt);
  const n11 = gradientDot(x1, y1, x, y, seed, salt);

  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  return lerp(ix0, ix1, sy);
}

function fractalPerlin2D(x: number, y: number, seed: number, salt: number): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let octave = 0; octave < 5; octave++) {
    total += perlin2D(x * frequency, y * frequency, seed, salt + octave * 1013) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return clamp01((total / maxAmplitude) * 0.5 + 0.5);
}

function getBiomeCountForWorld(seed: number): number {
  const hash = hashInt(0, 0, seed, 9002);
  return 5 + (hash % 4);
}

function getSelectedBiomesForWorld(seed: number): BiomeType[] {
  const biomeCount = getBiomeCountForWorld(seed);
  const shuffled = [...BIOME_REGION_ORDER];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(hashInt(i, 0, seed, 9997)) % (i + 1));
    const tempI: BiomeType = shuffled[i]!;
    const tempJ: BiomeType = shuffled[j]!;
    shuffled[i] = tempJ;
    shuffled[j] = tempI;
  }

  return shuffled.slice(0, biomeCount);
}

function pickVoronoiRegion(x: number, y: number, seed: number): {
  biome: BiomeType;
  influence: number;
} {
  const cellX = Math.floor(x / VORONOI_CELL_SIZE);
  const cellY = Math.floor(y / VORONOI_CELL_SIZE);
  let closestDistance = Number.POSITIVE_INFINITY;
  let secondClosestDistance = Number.POSITIVE_INFINITY;
  let closestCellX = cellX;
  let closestCellY = cellY;

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const candidateCellX = cellX + ox;
      const candidateCellY = cellY + oy;
      const siteX = (candidateCellX + hashUnit(candidateCellX, candidateCellY, seed, 7001)) * VORONOI_CELL_SIZE;
      const siteY = (candidateCellY + hashUnit(candidateCellX, candidateCellY, seed, 7002)) * VORONOI_CELL_SIZE;
      const distance = Math.hypot(x - siteX, y - siteY);

      if (distance < closestDistance) {
        secondClosestDistance = closestDistance;
        closestDistance = distance;
        closestCellX = candidateCellX;
        closestCellY = candidateCellY;
      } else if (distance < secondClosestDistance) {
        secondClosestDistance = distance;
      }
    }
  }

  const selectedBiomes = getSelectedBiomesForWorld(seed);
  const biomeIndex = Math.abs(hashInt(closestCellX, closestCellY, seed, 9001)) % selectedBiomes.length;
  const borderDistance = Math.max(0, secondClosestDistance - closestDistance);
  const influence = clamp01(borderDistance / (VORONOI_CELL_SIZE * 0.55));

  return {
    biome: selectedBiomes[biomeIndex]!,
    influence,
  };
}

function getClimateBiome(elevation: number, moisture: number, temperature: number): BiomeType {
  if (elevation > 0.86 && moisture < 0.42) return 'sky_islands';
  if (elevation > 0.78 && temperature > 0.66) return 'volcanic';
  if (elevation > 0.72) return 'mountains';
  if (elevation < 0.22) return 'coast';
  if (temperature < 0.24) return 'tundra';
  if (temperature > 0.72 && moisture < 0.34) return 'desert';
  if (moisture > 0.74 && elevation < 0.58) return 'swamp';
  if (moisture > 0.55) return 'forest';
  if (elevation > 0.62 && moisture > 0.48) return 'crystal_caves';
  return 'plains';
}

function blendRegionWithClimate(regionalBiome: BiomeType, climateBiome: BiomeType, elevation: number, influence: number): BiomeType {
  if (elevation < 0.18) return 'coast';
  if (elevation > 0.84 && climateBiome !== 'volcanic') return 'sky_islands';
  if (elevation > 0.74 && regionalBiome !== 'coast' && regionalBiome !== 'swamp') return climateBiome;
  if (influence > 0.48) return regionalBiome;
  if (influence > 0.28 && regionalBiome === 'crystal_caves' && elevation > 0.56) return regionalBiome;
  if (influence > 0.34 && regionalBiome === 'volcanic' && elevation > 0.58) return regionalBiome;
  return climateBiome;
}

export function sampleBiomeGeneration(x: number, y: number, seed: number): BiomeGenerationSample {
  const normalizedX = x / WORLD_SIZE;
  const normalizedY = y / WORLD_SIZE;
  const elevation = fractalPerlin2D(normalizedX * 7.5, normalizedY * 7.5, seed, 1001);
  const moisture = fractalPerlin2D(normalizedX * 6.25 + 80, normalizedY * 6.25 - 80, seed, 2001);
  const latitudeTemperature = 1 - Math.abs((y / WORLD_SIZE) - 0.5) * 1.25;
  const temperatureNoise = fractalPerlin2D(normalizedX * 4.5 - 160, normalizedY * 4.5 + 160, seed, 3001);
  const temperature = clamp01(latitudeTemperature * 0.55 + temperatureNoise * 0.45);
  const climateBiome = getClimateBiome(elevation, moisture, temperature);
  const region = pickVoronoiRegion(x, y, seed);
  const biome = blendRegionWithClimate(region.biome, climateBiome, elevation, region.influence);

  return {
    biome,
    regionalBiome: region.biome,
    elevation,
    moisture,
    temperature,
    voronoiInfluence: region.influence,
  };
}

export function getBiomeForCoords(x: number, y: number, seed: number): BiomeType {
  return sampleBiomeGeneration(x, y, seed).biome;
}
