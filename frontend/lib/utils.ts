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
