import { SequenceGenerator } from '#lib/SequenceGenerator';

import { describe, expect, it } from 'vitest';

function createGenerator(): SequenceGenerator {
  return new SequenceGenerator(1024);
}

describe('SequenceGenerator', () => {
  it('should move head to the correct position', () => {
    const generator = createGenerator();

    generator.setHead(100);

    expect(generator.head).toBe(100);
  });

  it('should throw an error when setting head to a negative position', () => {
    const generator = createGenerator();

    expect(() => generator.setHead(-1)).toThrow('Head cannot be negative');
  });

  it('should handle setting head backwards', () => {
    const generator = createGenerator();

    generator.setHead(100);
    generator.setHead(80);

    expect(generator.head).toBe(80);
  });

  it('should throw an error when moving head to a negative position', () => {
    const generator = createGenerator();

    expect(() => generator.moveHead(-1)).toThrow('Head cannot be negative');
  });

  it('should move head to the correct position when moving forward', () => {
    const generator = createGenerator();

    generator.moveHead(100);

    expect(generator.head).toBe(100);
  });

  it('should move head to the correct position when moving backward', () => {
    const generator = createGenerator();

    generator.setHead(100);
    generator.moveHead(-80);

    expect(generator.head).toBe(20);
  });

  it('should throw an error when moving head to a negative position', () => {
    const generator = createGenerator();

    expect(() => generator.moveHead(-1)).toThrow('Head cannot be negative');
  });

  it('should reset head to 0', () => {
    const generator = createGenerator();

    generator.setHead(100);
    generator.resetHead();

    expect(generator.head).toBe(0);
  });

  it('should return identical sequences with the same seed and head', () => {
    const generator = createGenerator();

    generator.setHead(100);

    const sequence1 = generator.generateN(1000, 0, 100);
    const sequence2 = generator.generateN(1000, 0, 100);

    expect(sequence1).toEqual(sequence2);
  });

  it('should return different sequences with different seeds', () => {
    const generator1 = new SequenceGenerator(1024);
    const generator2 = new SequenceGenerator(2048);

    const sequence1 = generator1.generateN(1000, 0, 100);
    const sequence2 = generator2.generateN(1000, 0, 100);

    expect(sequence1).not.toEqual(sequence2);
  });

  it('should return different sequences with different heads', () => {
    const generator = createGenerator();

    const sequence1 = generator.generateN(1000, 0, 100);

    generator.setHead(100);

    const sequence2 = generator.generateN(1000, 0, 100);

    expect(sequence1).not.toEqual(sequence2);
  });

  it('should return different sequences with different default seeds', () => {
    const generator1 = new SequenceGenerator();
    const generator2 = new SequenceGenerator();

    const sequence1 = generator1.generateN(1000, 0, 100);
    const sequence2 = generator2.generateN(1000, 0, 100);

    expect(sequence1).not.toEqual(sequence2);
  });

  it('should return correctly cloned instance', () => {
    const generator = createGenerator();

    generator.setHead(100);

    const clone = generator.clone();

    expect(clone.head).toBe(generator.head);
    expect(clone.seed).toBe(generator.seed);
    expect(clone.generateN(1, 0, 100)).toEqual(generator.generateN(1, 0, 100));

    clone.moveHead(100);

    expect(clone.generateN(1, 0, 100)).not.toEqual(
      generator.generateN(1, 0, 100),
    );
  });
});
