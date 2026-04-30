const UNINITIALIZED = Symbol('uninitialized');

// biome-ignore lint/suspicious/noExplicitAny: yeah
export function memoized<T extends () => any>(originalMethod: T): T {
  const cached = { value: UNINITIALIZED };

  const cachedMethod = (...args: unknown[]) => {
    if (cached.value !== UNINITIALIZED) {
      return cached.value;
    }

    // @ts-expect-error
    cached.value = originalMethod(...args);
    return cached.value;
  };

  cachedMethod.originalMethod = originalMethod;
  cachedMethod.cache = cached;

  // @ts-expect-error
  return cachedMethod;
}
