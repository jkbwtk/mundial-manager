export function pickRandom<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot pick a random element from an empty array');
  }

  const index = Math.floor(Math.random() * array.length);
  return array.at(index)!;
}

export function pickRandomMultiple<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error(
      'Cannot pick more elements than are available in the array',
    );
  }

  const result: T[] = [];
  const usedIndices = new Set<number>();

  while (result.length < count) {
    const index = Math.floor(Math.random() * array.length);

    if (usedIndices.has(index)) continue;

    usedIndices.add(index);
    result.push(array.at(index)!);
  }

  return result;
}

export function runWithProbability<T>(
  probability: number,
  trueFn: () => T,
  falseFn?: () => T,
): T | undefined {
  if (Math.random() < probability) {
    return trueFn();
  }

  if (falseFn) {
    return falseFn();
  }
}
