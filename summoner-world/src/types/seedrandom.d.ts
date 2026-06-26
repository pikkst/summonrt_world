declare module 'seedrandom' {
  export default function seedrandom(seed?: string | (() => number)): {
    (): number;
    double(): number;
    int(min?: number, max?: number): number;
    quick(range?: number): number;
  };
}
