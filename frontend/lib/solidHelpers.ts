import { type Accessor, createSignal } from 'solid-js';

export type ButtonActionHandler<
  T extends (...args: unknown[]) => Promise<unknown>,
> = { (...args: Parameters<T>): Promise<void>; loading: Accessor<boolean> };

export function useHandleButtonAction<
  T extends (...args: unknown[]) => Promise<unknown>,
>(action: T): ButtonActionHandler<T> {
  const [loading, setLoading] = createSignal(false);

  const handleAction = async (...args: Parameters<T>) => {
    setLoading(true);
    try {
      await action(...args);
    } finally {
      setLoading(false);
    }
  };

  handleAction.loading = loading;

  return handleAction;
}
