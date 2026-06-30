export function getBiomeForCoords(x: number, y: number, seed: number): string {
  const centerX = 1000;
  const centerY = 1000;
  const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  const maxDist = 1414;

  const noise = Math.abs(Math.sin(x * 0.01 + y * 0.01 + seed) * 0.5);
  const normalizedDist = (dist / maxDist) + (noise * 0.1);

  if (normalizedDist > 0.8) return 'coast';
  if (normalizedDist > 0.6) return 'plains';
  if (normalizedDist > 0.4) return 'forest';
  if (normalizedDist > 0.2) return 'mountains';
  if (normalizedDist > 0.05) return 'volcanic';
  return 'crystal_caves';
}
