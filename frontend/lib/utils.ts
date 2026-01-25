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
  return navigator.maxTouchPoints > 1;
}
