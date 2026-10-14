import { useCurrentMatches } from '@solidjs/router';
import { type Accessor, createSignal, onCleanup } from 'solid-js';
import type {
  ExtendedRouteDefinition,
  ExtendedRouteMatch,
} from '#frontend/types';

export type ClickEvent<T extends Element = HTMLElement> = MouseEvent & {
  currentTarget: T;
  target: Element;
};

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

export function observeElementWidth(
  element: HTMLElement,
  onResize: (width: number) => void,
): void {
  const observer = new ResizeObserver(([entry]) => {
    if (entry) onResize(entry.contentRect.width);
  });

  observer.observe(element);

  onCleanup(() => observer.disconnect());
}

export const useCurrentExtendedMatches =
  useCurrentMatches as unknown as () => () => ExtendedRouteMatch[];

export const hasAuxRoutes = (route: ExtendedRouteDefinition): boolean =>
  route.children !== undefined;

export const isPublicRoute = (route: ExtendedRouteDefinition): boolean =>
  route.info.public === true || route.info.public === undefined;

export const autofocus: ComponentUseDirectiveHack<HTMLInputElement> = (
  element,
) => {
  element.focus();
};
