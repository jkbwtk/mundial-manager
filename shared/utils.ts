import dayjs from 'dayjs';

export const sleep = (time: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const arrayFrom = <T>(variable: T[] | T): T[] => {
  return Array.isArray(variable) ? variable.slice() : [variable];
};

export const setFrom = <T>(variable: T[] | T): Set<T> => {
  return new Set(arrayFrom(variable));
};

export const shortUUID = (uuid: string): string => {
  return uuid.substring(0, 8);
};

export const slowCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const isObject = (variable: unknown): boolean => {
  return (
    typeof variable === 'object' &&
    variable !== null &&
    !Array.isArray(variable)
  );
};

export const isStrOrNumber = (variable: unknown): boolean => {
  return typeof variable === 'string' || typeof variable === 'number';
};

export const clamp = (min: number, max: number, val: number): number => {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
};

export const enumerate = <T>(array: T[]): [number, T][] =>
  array.map((v, k) => [k, v]);

// https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set/48244432
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
export type AtLeastOneOf<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export const randomAlphanumeric = (length: number): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

export const definedOrFail = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) {
    throw new Error(`${name} is undefined`);
  }

  return value;
};

export const mapOptionsToArray = <T extends string>(
  options: Record<T, boolean>,
): T[] => {
  const result: T[] = [];

  for (const key in options) {
    if (options[key]) {
      result.push(key);
    }
  }

  return result;
};

export type AsyncLike<T> = T | Promise<T>;

export type QuickSwitchKeyTypes = number | string;

export type QuickSwitchCases<T, K extends QuickSwitchKeyTypes> = Record<
  K,
  T
> & { default: T };

export const quickSwitch = <T, K extends QuickSwitchKeyTypes = string>(
  value: QuickSwitchKeyTypes,
  cases: QuickSwitchCases<T, K>,
): T => {
  if (value in cases) {
    const option = cases[value as keyof typeof cases];
    if (option !== undefined) {
      return option;
    }
  }

  return cases.default;
};

type Defined = string | number | boolean | symbol | object | bigint | null;

export const mergeOptions = <T extends Record<string, Defined>>(
  options: T,
  defaults: RequiredDefaults<T>,
): Required<T> => {
  const definedOptions = Object.entries(options).filter(
    ([, value]) => value !== undefined,
  ) as [keyof T, Defined][];

  return Object.assign(
    {},
    defaults,
    Object.fromEntries(definedOptions),
  ) as Required<T>;
};

// https://stackoverflow.com/questions/57593022/reverse-required-and-optional-properties
type OptionalKeys<T> = {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type RequiredDefaults<T extends Record<string, unknown>> = Required<
  Pick<T, OptionalKeys<T>>
>;

export type Awaitable<T> = T | Promise<T>;

export function makeDisposable<T extends object>(
  obj: T,
  cleanup: () => void,
): T & Disposable {
  // @ts-expect-error
  obj[Symbol.dispose] = cleanup;

  return obj as T & Disposable;
}

export function containsTime(date: dayjs.ConfigType): boolean {
  const startOfDay = dayjs(date).startOf('day');

  return dayjs(date).isAfter(startOfDay);
}

export function range(end: number, inclusive?: boolean): number[];
export function range(
  start: number,
  end: number,
  inclusive?: boolean,
): number[];
export function range(a: number, b?: number | boolean, c = false): number[] {
  const start = typeof b === 'number' ? a : 0;
  const end = typeof b === 'number' ? b : a;
  const inclusive = typeof b === 'boolean' ? b : c;

  const length = Math.abs(end - start) + (inclusive ? 1 : 0);

  const mapper =
    end >= start
      ? (_v: unknown, i: number) => i + start
      : (_v: unknown, i: number) => start - i;

  return Array.from({ length }).map(mapper);
}

export function objectToEntries<T extends object>(obj: T): [
  keyof T,
  T[keyof T],
][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}