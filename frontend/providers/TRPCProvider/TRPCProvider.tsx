import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createContext, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppRouter } from '#backend/routes/app';

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
        httpBatchLink({
          url: '/trpc',
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
