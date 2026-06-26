export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'string' ? this.hashString(seed) : seed;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0xffffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickWeighted<T>(items: { item: T; weight: number }[]): T {
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.next() * total;
    for (const entry of items) {
      r -= entry.weight;
      if (r <= 0) return entry.item;
    }
    return items[items.length - 1]!.item;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = a[i] as T;
      a[i] = a[j] as T;
      a[j] = temp;
    }
    return a;
  }

  clone(seed?: string | number): SeededRandom {
    return new SeededRandom(seed ?? this.state);
  }
}
