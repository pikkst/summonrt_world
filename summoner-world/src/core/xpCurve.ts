export function getXPThreshold(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  const xp = Math.pow(1.15, level - 1) * 100;
  return BigInt(Math.round(xp));
}

export function getCumulativeXP(level: number): bigint {
  if (level < 1) throw new Error('Level must be at least 1');
  let total = 0n;
  for (let i = 1; i <= level; i++) {
    total += getXPThreshold(i);
  }
  return total;
}

export function getXPForLevel(startLevel: number, endLevel: number): bigint {
  if (startLevel < 1) throw new Error('Start level must be at least 1');
  if (endLevel < startLevel) throw new Error('End level must be >= start level');
  if (startLevel === endLevel) return 0n;
  return getCumulativeXP(endLevel) - getCumulativeXP(startLevel);
}
