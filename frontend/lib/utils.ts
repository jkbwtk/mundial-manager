import type { JSX } from 'solid-js';

export const isDev = (): boolean => {
  try {
    return import.meta.env.DEV ?? false;
  } catch {
    return false;
  }
};

export function bytesToBase64(bytes: Uint8Array) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join('');
  return btoa(binString);
}

export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function isMobile(): boolean {
  // TODO: Implement mobile detection method that works during SSR
  return navigator.maxTouchPoints > 1;
}

export function addNullable<T extends number | null>(
  a: number | null,
  b: number | null,
  fallback: T = null as T,
): number | T {
  if (a === null && b === null) return fallback;

  return (a ?? 0) + (b ?? 0);
}

export function joinPaths(...paths: string[]): string {
  if (paths.length === 0) return '';

  const startingSlash = paths.at(0)!.startsWith('/') ? '/' : '';
  const endingSlash = paths.at(-1)!.endsWith('/') ? '/' : '';

  const joined = paths
    .map((path) => path.replace(/^\/+|\/+$/g, ''))
    .filter((path) => path.length > 0)
    .join('/');

  if (joined.length === 0) {
    return startingSlash || endingSlash ? '/' : '';
  }

  return startingSlash + joined + endingSlash;
}

export function normalizeInputType(
  type: JSX.InputHTMLAttributes<HTMLInputElement>['type'],
  inputMode?: JSX.InputHTMLAttributes<HTMLInputElement>['inputMode'],
): JSX.InputHTMLAttributes<HTMLInputElement>['type'] {
  if (inputMode) {
    switch (inputMode) {
      case 'text':
        return 'text';
      case 'search':
        return 'search';
      case 'email':
        return 'email';
      case 'numeric':
        return 'number';
      case 'decimal':
        return 'number';
      case 'tel':
        return 'text';
    }
  }

  return type;
}
