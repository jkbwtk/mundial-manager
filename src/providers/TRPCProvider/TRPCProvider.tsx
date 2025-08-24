import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppRouter } from '#lib/trpc';

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
  const [state] = createStore<TRPCContextState>(
    structuredClone(createDefaultState()),
  );

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
