import { createContext, onCleanup, onMount, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export interface ConsoleUnit {
  height: number;
  width: number;
}

export interface ConsoleUnitPrototypeContextState {
  unit: ConsoleUnit;
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
    height: 0,
    width: 0,
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

    setState('unit', unit);

    document.documentElement.style.setProperty(
      '--console-unit-height',
      `${unit.height}px`,
    );
    document.documentElement.style.setProperty(
      '--console-unit-width',
      `${unit.width}px`,
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
