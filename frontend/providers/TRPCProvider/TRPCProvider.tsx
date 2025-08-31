import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createContext, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppRouter } from '../../../backend/trpc';

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
        httpBatchLink({
          url: '/trpc',
        }),
      ],
    }),
  };
}

const TRPCContext = createContext<TRPCContextValue>([createDefaultState(), {}]);

export const TRPCProvider: ParentComponent = (props) => {
  const [state] = createStore<TRPCContextState>(createDefaultState());

  const actions: TRPCContextActions = {};

  onMount(async () => {
    const result = await state.client.add.query({ a: 1, b: 2 });
    console.log('TRPC test query result:', result);
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
