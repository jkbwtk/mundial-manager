import { useCurrentMatches } from '@solidjs/router';
import { type Accessor, createSignal } from 'solid-js';
import type { ExtendedRouteMatch } from '#frontend/types';

export type ButtonActionHandler<
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  T extends (...args: any[]) => Promise<unknown>,
> = { (...args: Parameters<T>): Promise<void>; loading: Accessor<boolean> };

export function useHandleButtonAction<
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  T extends (...args: any[]) => Promise<unknown>,
>(action: T, onError?: (error: unknown) => void): ButtonActionHandler<T> {
  const [loading, setLoading] = createSignal(false);

  const handleAction = async (...args: Parameters<T>) => {
    setLoading(true);

    try {
      await action(...args);
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  handleAction.loading = loading;

  return handleAction;
}

export type ComponentUseDirectiveHack<E extends HTMLElement> = (
  element: E,
) => void;

export function applyDirectives<E extends HTMLElement>(
  element: E,
  directives: ComponentUseDirectiveHack<E>[],
) {
  for (const directive of directives) {
    directive(element);
  }
}

export const useCurrentExtendedMatches =
  useCurrentMatches as unknown as () => () => ExtendedRouteMatch[];
