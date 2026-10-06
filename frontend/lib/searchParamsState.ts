import { trackDeep } from '@solid-primitives/deep';
import {
  type SearchParams,
  useLocation,
  useSearchParams,
} from '@solidjs/router';
import { type Accessor, createEffect, createMemo, on } from 'solid-js';
import {
  createStore,
  reconcile,
  type SetStoreFunction,
  unwrap,
} from 'solid-js/store';
import type z from 'zod';
import { getValueHash } from '#shared/utils';

export interface SearchParamsStateOptions<T extends z.ZodObject> {
  schema: T;
  defaultState: z.infer<T>;

  prefix?: string;
  separator?: string;
}

const MAX_SEARCH_PARAM_DEPTH = 5;
const DEFAULT_SEARCH_PARAM_SEPARATOR = '.';
const SEARCH_PARAMS_STATE_MARKER = 'searchParamsState';

function isSearchParamPrimitive(
  value: unknown,
): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function isSearchParamsStateNavigation(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    SEARCH_PARAMS_STATE_MARKER in state
  );
}

function flattenEntries(
  o: object,
  path: string[] = [],
): [path: string[], value: string | string[]][] {
  const entries: [string[], string | string[]][] = [];

  for (const [key, value] of Object.entries(o)) {
    const keyPath = [...path, key];

    if (Array.isArray(value)) {
      if (value.every(isSearchParamPrimitive)) {
        entries.push([keyPath, value.map(String)]);
      }

      continue;
    }

    if (typeof value === 'object' && value !== null) {
      entries.push(...flattenEntries(value, keyPath));
      continue;
    }

    if (isSearchParamPrimitive(value)) entries.push([keyPath, String(value)]);
  }

  return entries;
}

function flatten(o: object, scope: string, separator: string): SearchParams {
  return Object.fromEntries(
    flattenEntries(o).map(([path, value]) => [
      `${scope}${path.join(separator)}`,
      value,
    ]),
  );
}

function treeify(
  searchParams: SearchParams,
  scope: string,
  separator: string,
): Record<string, unknown> {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  const tree: Record<string, any> = Object.create(null);

  for (const [param, value] of Object.entries(searchParams)) {
    if (!param.startsWith(scope)) continue;

    const keys = param.slice(scope.length).split(separator);
    const last = keys.pop()!;

    if (keys.length > MAX_SEARCH_PARAM_DEPTH) continue;

    let node = tree;

    for (const key of keys) {
      if (typeof node[key] !== 'object' || node[key] === null) {
        node[key] = Object.create(null);
      }

      node = node[key];
    }

    node[last] = value;
  }

  return tree;
}

function parseSearchParams<T extends z.ZodObject>(
  tree: Record<string, unknown>,
  options: SearchParamsStateOptions<T>,
): z.infer<T> {
  const defaultState: Record<string, unknown> = options.defaultState;

  const entries = Object.entries(options.schema.shape).map(([key, field]) => {
    if (tree[key] === undefined) return [key, defaultState[key]];

    const parsed = field.safeParse(tree[key]);

    return [key, parsed.success ? parsed.data : defaultState[key]];
  });

  return structuredClone(Object.fromEntries(entries));
}

export function useSearchParamsState<T extends z.ZodObject>(
  options: SearchParamsStateOptions<T>,
): [
  snapshot: Accessor<z.infer<T>>,
  state: z.infer<T>,
  setState: SetStoreFunction<z.infer<T>>,
] {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const separator = options.separator ?? DEFAULT_SEARCH_PARAM_SEPARATOR;
  const scope = options.prefix ? `${options.prefix}${separator}` : '';

  const readSearchParams = () =>
    parseSearchParams(treeify(searchParams, scope, separator), options);

  const [store, setStore] = createStore<z.infer<T>>(readSearchParams());

  const snapshot = createMemo(() => structuredClone(unwrap(trackDeep(store))));

  createEffect(
    on(
      snapshot,
      (current) => {
        if (getValueHash(readSearchParams()) === getValueHash(current)) return;

        setSearchParams(flatten(current, scope, separator), {
          replace: true,
          state: { [SEARCH_PARAMS_STATE_MARKER]: true },
        });
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => location.search,
      () => {
        if (isSearchParamsStateNavigation(location.state)) return;

        setStore(reconcile(readSearchParams()));
      },
      { defer: true },
    ),
  );

  return [snapshot, store, setStore];
}
