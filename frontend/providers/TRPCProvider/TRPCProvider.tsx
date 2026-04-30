import {
  createTRPCClient,
  httpBatchStreamLink,
  httpSubscriptionLink,
  loggerLink,
  retryLink,
  splitLink,
} from '@trpc/client';
import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppRouter } from '#backend/routers/trpc/app';
import { isDev } from '#flib/utils';

export interface TRPCContextState {
  client: ReturnType<typeof createTRPCClient<AppRouter>>;
}

// biome-ignore lint/suspicious/noEmptyInterface: yeah
export interface TRPCContextActions {}

export type TRPCContextValue = [
  state: TRPCContextState,
  actions: TRPCContextActions,
];

function createDefaultState(): TRPCContextState {
  return {
    client: createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: isDev,
        }),
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: [
            retryLink({
              retry: (opts) => {
                const code = opts.error.data?.code;

                if (code === 'INTERNAL_SERVER_ERROR') {
                  return false;
                }

                if (opts.attempts > 120) {
                  console.warn(
                    `tRPC subscription max retries reached for ${opts.op.path}`,
                  );
                  return false;
                }

                if (isDev()) {
                  console.log(
                    `tRPC subscription reconnecting (attempt ${opts.attempts})`,
                  );
                }

                return true;
              },
              retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            }),
            httpSubscriptionLink({
              url: '/trpc',
            }),
          ],
          false: [
            retryLink({
              retry: (opts) => {
                if (
                  opts.error.data &&
                  opts.error.data.code === 'INTERNAL_SERVER_ERROR'
                ) {
                  return false;
                }

                if (opts.op.type === 'mutation') {
                  return false;
                }

                return opts.attempts <= 3;
              },
              retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            }),
            httpBatchStreamLink({
              url: '/trpc',
            }),
          ],
        }),
      ],
    }),
  };
}

const TRPCContext = createContext<TRPCContextValue>([createDefaultState(), {}]);

export const TRPCProvider: ParentComponent = (props) => {
  const [state] = createStore<TRPCContextState>(createDefaultState());

  const actions: TRPCContextActions = {};

  return (
    <TRPCContext.Provider value={[state, actions]}>
      {props.children}
    </TRPCContext.Provider>
  );
};

export function useTRPC() {
  return useContext(TRPCContext);
}
