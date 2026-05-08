import type { AnyRouter } from '@trpc/server';
import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface SSRUtilsContextState {
  responseStatus?: number;
  trpcCaller?: ReturnType<AnyRouter['createCaller']>;
}

export interface SSRUtilsContextActions {
  setResponseStatus: (status: number) => void;
}

export type SSRUtilsContextValue = [
  state: SSRUtilsContextState,
  actions: SSRUtilsContextActions,
];

function createDefaultState(): SSRUtilsContextState {
  return {
    responseStatus: undefined,
    trpcCaller: undefined,
  };
}

const SSRUtilsContext = createContext<SSRUtilsContextValue>([
  createDefaultState(),
  {
    setResponseStatus: () => {
      throw new Error(
        'SSRUtilsContext: setResponseStatus() called before provider',
      );
    },
  },
]);

export interface SSRUtilsProviderProps {
  setResponseStatus?: (status: number) => void;
  trpcCaller?: ReturnType<AnyRouter['createCaller']>;
}

export const SSRUtilsProvider: ParentComponent<SSRUtilsProviderProps> = (
  props,
) => {
  const [state, setState] = createStore<SSRUtilsContextState>({
    ...createDefaultState(),
    trpcCaller: props.trpcCaller,
  });

  const setResponseStatus: SSRUtilsContextActions['setResponseStatus'] = (
    next,
  ) => {
    setState('responseStatus', next);
    props.setResponseStatus?.(next);
  };

  return (
    <SSRUtilsContext.Provider
      value={[
        state,
        {
          setResponseStatus,
        },
      ]}
    >
      {props.children}
    </SSRUtilsContext.Provider>
  );
};

export const useSSRUtils = () => useContext(SSRUtilsContext);
