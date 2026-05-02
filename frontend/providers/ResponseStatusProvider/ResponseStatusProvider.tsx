import {
  type Accessor,
  createContext,
  createSignal,
  useContext,
} from 'solid-js';

export interface ResponseStatusContextValue {
  status: Accessor<number | undefined>;
  setStatus: (status: number) => void;
}

const ResponseStatusContext = createContext<ResponseStatusContextValue>({
  status: () => undefined,
  setStatus: () => {
    throw new Error(
      'ResponseStatusContext: setStatus() called before provider',
    );
  },
});

export interface ResponseStatusProviderProps {
  setStatus?: (status: number) => void;
}

export const ResponseStatusProvider: ParentComponent<
  ResponseStatusProviderProps
> = (props) => {
  const [status, setStatus] = createSignal<number | undefined>(undefined);

  const setStatusValue = (next: number) => {
    setStatus(next);
    props.setStatus?.(next);
  };

  return (
    <ResponseStatusContext.Provider
      value={{ status, setStatus: setStatusValue }}
    >
      {props.children}
    </ResponseStatusContext.Provider>
  );
};

export const useResponseStatus = () => useContext(ResponseStatusContext);
