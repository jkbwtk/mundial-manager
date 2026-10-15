export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function average(values: number[]): number {
  return sum(values) / values.length;
}

export function countValues(values: string[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const value of values) {
    result[value] = (result[value] ?? 0) + 1;
  }

  return result;
}

export function mergeCounts<Counts extends Partial<Record<string, number>>>(
  a: Counts,
  b: Counts,
): Counts {
  const result: Partial<Record<string, number>> = { ...a };

  for (const [key, count] of Object.entries(b)) {
    result[key] = (result[key] ?? 0) + (count ?? 0);
  }

  return result as Counts;
}

export function mergeNullable(
  a: number | null,
  b: number | null,
  merge: (a: number, b: number) => number,
): number | null {
  if (a === null) return b;
  if (b === null) return a;

  return merge(a, b);
}

export function mergeUnique(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}
