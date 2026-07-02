import type { AnyRouter } from '@trpc/server';
import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface SSRUtilsContextState {
  responseStatus?: number;
  title?: string;
  trpcCaller?: ReturnType<AnyRouter['createCaller']>;
  userAgent?: string;
}

export interface SSRUtilsContextActions {
  setResponseStatus: (status: number) => void;
  setTitle: (title: string) => void;
}

export type SSRUtilsContextValue = [
  state: SSRUtilsContextState,
  actions: SSRUtilsContextActions,
];

function createDefaultState(): SSRUtilsContextState {
  return {
    responseStatus: undefined,
    title: undefined,
    trpcCaller: undefined,
    userAgent: undefined,
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
    setTitle: () => {
      throw new Error('SSRUtilsContext: setTitle() called before provider');
    },
  },
]);

export interface SSRUtilsProviderProps {
  setResponseStatus?: (status: number) => void;
  setTitle?: (title: string) => void;
  trpcCaller?: ReturnType<AnyRouter['createCaller']>;
  userAgent?: string;
}

export const SSRUtilsProvider: ParentComponent<SSRUtilsProviderProps> = (
  props,
) => {
  const [state, setState] = createStore<SSRUtilsContextState>({
    ...createDefaultState(),
    trpcCaller: props.trpcCaller,
    userAgent: props.userAgent,
  });

  const setResponseStatus: SSRUtilsContextActions['setResponseStatus'] = (
    next,
  ) => {
    setState('responseStatus', next);
    props.setResponseStatus?.(next);
  };

  const setTitle: SSRUtilsContextActions['setTitle'] = (next) => {
    setState('title', next);
    props.setTitle?.(next);
  };

  return (
    <SSRUtilsContext.Provider
      value={[
        state,
        {
          setResponseStatus,
          setTitle,
        },
      ]}
    >
      {props.children}
    </SSRUtilsContext.Provider>
  );
};

export const useSSRUtils = () => useContext(SSRUtilsContext);
