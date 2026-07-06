import { TRPCClientError, type TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { useSSRUtils } from '#providers/SSRUtilsProvider';

export function ssrLink<
  TRouter extends AnyRouter = AnyRouter,
>(): TRPCLink<TRouter> {
  return () => {
    return (operationOpts) => {
      const { op } = operationOpts;

      return observable((observer) => {
        const { path, input, type } = op;

        const [state] = useSSRUtils();
        const caller = state.trpcCaller;

        if (!caller) {
          throw new Error('TRPCCaller is not available in SSRUtilsContext');
        }

        if (type === 'subscription') {
          throw new Error('Subscriptions are not supported during SSR');
        }

        // @ts-expect-error
        let current: (...args: unknown[]) => Promise<unknown> = caller;
        const fragments = path.split('.');

        for (const fragment of fragments) {
          // @ts-expect-error
          current = current[fragment];
        }

        if (typeof current !== 'function') {
          observer.error(
            new TRPCClientError(
              `tRPC path does not resolve to a function during SSR: ${path}`,
            ),
          );
          return;
        }

        current(input)
          .then((result) => {
            observer.next({
              result: {
                data: result,
              },
            });
            observer.complete();
          })
          .catch((cause) => {
            const clientError = TRPCClientError.from(cause);

            // @ts-expect-error
            clientError.cause = undefined;
            // @ts-expect-error
            clientError.data = undefined;
            clientError.stack = undefined;

            observer.error(clientError);
          });

        return () => {};
      });
    };
  };
}
