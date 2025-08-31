export const Unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

export type Unit = (typeof Unit)[number];

export function getSizeWithUnit(size: number): { size: number; unit: Unit } {
  let result = size;
  let unitIndex = 0;

  while (result > 1024 && unitIndex < Unit.length - 1) {
    result /= 1024;
    unitIndex += 1;
  }

  const resultUnit = Unit[unitIndex];

  return resultUnit ? { size: result, unit: resultUnit } : { size, unit: 'B' };
}

export function getExtension(filename: string): string {
  return filename.split('.').pop() ?? '';
}
