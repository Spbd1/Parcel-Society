export interface RandomGenerator {
  next(): number;
  integer(minInclusive: number, maxInclusive: number): number;
  float(minInclusive: number, maxExclusive: number): number;
  boolean(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
}

const hashSeed = (seed: string | number): number => {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export class SeededRandom implements RandomGenerator {
  private state: number;

  constructor(seed: string | number) {
    this.state = hashSeed(seed) || 1;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  integer(minInclusive: number, maxInclusive: number): number {
    return Math.floor(this.float(minInclusive, maxInclusive + 1));
  }

  float(minInclusive: number, maxExclusive: number): number {
    return minInclusive + this.next() * (maxExclusive - minInclusive);
  }

  boolean(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty array");
    }
    return items[this.integer(0, items.length - 1)] as T;
  }
}

export const createRandom = (seed: string | number): RandomGenerator =>
  new SeededRandom(seed);
