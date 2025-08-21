import {
  type RandomGenerator,
  skipN,
  unsafeUniformIntDistribution,
  xoroshiro128plus,
} from 'pure-rand';

export class SequenceGenerator {
  public readonly seed: number;
  _head = 0;

  get head(): number {
    return this._head;
  }

  private generator: RandomGenerator;
  private originalGenerator: RandomGenerator;

  constructor(seed = Date.now() ^ (Math.random() * 0x100000000)) {
    this.seed = seed;

    this.generator = xoroshiro128plus(seed);
    this.originalGenerator = this.generator.clone();
  }

  private skipN(n: number): void {
    this.generator = skipN(this.generator, n);
    this._head += n;
  }

  private resetGenerator(): void {
    this.generator = this.originalGenerator.clone();
  }

  public resetHead(): void {
    this.resetGenerator();
    this._head = 0;
  }

  public setHead(head: number): void {
    if (head < 0) {
      throw new Error('Head cannot be negative');
    }

    if (head > this.head) {
      this.skipN(head - this.head);
    } else if (head < this.head) {
      this.resetHead();
      this.skipN(head);
    }
  }

  public moveHead(n: number): void {
    if (this.head + n < 0) {
      throw new Error('Head cannot be negative');
    }

    if (n > 0) {
      this.skipN(n);
    } else if (n < 0) {
      const offset = this.head + n;

      this.resetHead();
      this.skipN(offset);
    }
  }

  public generateN(n: number, min: number, max: number): number[] {
    const usedGenerator = this.generator.clone();
    const generated: number[] = [];

    for (let i = 0; i < n; i += 1) {
      generated.push(unsafeUniformIntDistribution(min, max, usedGenerator));
    }

    return generated;
  }

  public clone(): SequenceGenerator {
    const clone = new SequenceGenerator(this.seed);
    clone.setHead(this.head);

    return clone;
  }
}
