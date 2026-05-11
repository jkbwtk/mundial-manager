import { type Accessor, createSignal } from 'solid-js';

export type ButtonActionHandler<
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  T extends (...args: any[]) => Promise<unknown>,
> = { (...args: Parameters<T>): Promise<void>; loading: Accessor<boolean> };

export function useHandleButtonAction<
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  T extends (...args: any[]) => Promise<unknown>,
>(action: T): ButtonActionHandler<T> {
  const [loading, setLoading] = createSignal(false);

  const handleAction = async (...args: Parameters<T>) => {
    setLoading(true);

    action(...args).then(() => setLoading(false));
  };

  handleAction.loading = loading;

  return handleAction;
}
