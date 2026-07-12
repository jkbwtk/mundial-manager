export function lazyObject<T>(instanceFactory: () => T): T {
  let instance: T | null = null;

  const getInstance = (): T => {
    if (instance === null) {
      instance = instanceFactory();
    }

    return instance;
  };

  return new Proxy(
    {},
    {
      get(_target, property) {
        const initializedInstance = getInstance();

        // @ts-expect-error
        return initializedInstance[property];
      },
      set(_target, property, newValue) {
        const initializedInstance = getInstance();

        // @ts-expect-error
        initializedInstance[property] = newValue;

        return true;
      },
    },
  ) as T;
}
