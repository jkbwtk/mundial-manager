import { batch, createContext, onCleanup, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export interface ConsoleUnit {
  height: number;
  width: number;
}

export interface WindowSize {
  height: number;
  width: number;
}

export interface ConsoleUnitPrototypeContextState {
  unit: ConsoleUnit;
  windowSize: WindowSize;
}

export interface ConsoleUnitPrototypeContextActions {
  update: () => ConsoleUnit;
}

export type ConsoleUnitPrototypeContextValue = [
  state: ConsoleUnitPrototypeContextState,
  actions: ConsoleUnitPrototypeContextActions,
];

const defaultState: ConsoleUnitPrototypeContextState = {
  unit: {
    height: 18,
    width: 8.4,
  },
  windowSize: {
    height: 50,
    width: 200,
  },
};

const ConsoleUnitPrototypeContext =
  createContext<ConsoleUnitPrototypeContextValue>([
    structuredClone(defaultState),
    {
      update: () => {
        throw new Error(
          'ConsoleUnitPrototypeContext: update() called before provider',
        );
      },
    },
  ]);

export const ConsoleUnitPrototypeProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<ConsoleUnitPrototypeContextState>(
    structuredClone(ConsoleUnitPrototypeContext.defaultValue[0]),
  );

  // biome-ignore lint/style/useConst: uninitialized ref
  let ref: HTMLDivElement = null!;

  const update = (): ConsoleUnit => {
    const box = ref.getBoundingClientRect();
    const unit: ConsoleUnit = {
      height: box.height,
      width: box.width,
    };

    const windowSize: WindowSize = {
      height: Math.floor(window.innerHeight / unit.height),
      width: Math.floor(window.innerWidth / unit.width),
    };

    batch(() => {
      setState('unit', unit);
      setState('windowSize', windowSize);
    });

    document.documentElement.style.setProperty(
      '--console-unit-height',
      `${unit.height}px`,
    );
    document.documentElement.style.setProperty(
      '--console-unit-width',
      `${unit.width}px`,
    );

    document.documentElement.style.setProperty(
      '--window-height',
      `${windowSize.height}`,
    );
    document.documentElement.style.setProperty(
      '--window-width',
      `${windowSize.width}`,
    );

    return unit;
  };

  if (!isServer) {
    onMount(() => {
      update();

      window.addEventListener('resize', update);
    });

    onCleanup(() => {
      window.removeEventListener('resize', update);
    });
  }

  return (
    <ConsoleUnitPrototypeContext.Provider
      value={[
        state,
        {
          update,
        },
      ]}
    >
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9001px',
          color: 'transparent',
          'pointer-events': 'none',
        }}
        aria-hidden="true"
      >
        {'?'}
      </div>

      {props.children}
    </ConsoleUnitPrototypeContext.Provider>
  );
};

export const useConsoleUnitPrototype = () =>
  useContext(ConsoleUnitPrototypeContext);
