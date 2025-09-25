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
import type { AppRouter } from '#backend/routes/app';
import { isDev } from '#flib/utils';
import { quickSwitch } from '#shared/utils';

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

            const attempts = quickSwitch<number>(opts.op.type, {
              subscription: 120,
              default: 3,
            });

            return opts.attempts <= attempts;
          },
          retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        }),
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: httpSubscriptionLink({
            url: '/trpc',
          }),
          false: httpBatchStreamLink({
            url: '/trpc',
          }),
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
