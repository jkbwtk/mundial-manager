import {
  createTRPCClient,
  httpBatchStreamLink,
  httpSubscriptionLink,
  loggerLink,
  retryLink,
  splitLink,
} from '@trpc/client';
import { createContext, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppRouter } from '#backend/routes/app';
import { isDev } from '#flib/utils';

export interface TRPCContextState {
  client: ReturnType<typeof createTRPCClient<AppRouter>>;
}

export interface TRPCContextActions {
  ping(): Promise<string>;
}

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
              opts.error.data.code !== 'INTERNAL_SERVER_ERROR'
            ) {
              return false;
            }

            if (opts.op.type !== 'query') {
              return false;
            }

            return opts.attempts <= 3;
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

const TRPCContext = createContext<TRPCContextValue>([
  createDefaultState(),
  {
    ping: () => {
      throw new Error('TRPCContext: ping() called before provider');
    },
  },
]);

export const TRPCProvider: ParentComponent = (props) => {
  const [state] = createStore<TRPCContextState>(createDefaultState());

  const actions: TRPCContextActions = {
    ping: () => {
      return state.client.system.ping.query();
    },
  };

  onMount(async () => {
    const result = await state.client.system.ping.query();

    console.log('TRPC ping result:', result);
  });

  return (
    <TRPCContext.Provider value={[state, actions]}>
      {props.children}
    </TRPCContext.Provider>
  );
};

export function useTRPC() {
  return useContext(TRPCContext);
}
