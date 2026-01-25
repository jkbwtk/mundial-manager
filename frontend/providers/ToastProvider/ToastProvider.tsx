import {
  createContext,
  createMemo,
  createUniqueId,
  For,
  Show,
  useContext,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import type {
  ToastConfig,
  ToastEntry,
  ToastProviderConfig,
} from '#frontend/types';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { QueueIndicator, Toast } from '#providers/ToastProvider';
import style from './ToastProvider.module.scss';

export const TOAST_DEFAULT_DURATION = 5000;
export const TOAST_DEFAULT_MAX_VISIBLE = 5;
export const TOAST_COUNTDOWN_INTERVAL = 50;
export const TOAST_ANIMATION_DURATION = 200;

export interface ToastInternalEntry extends ToastEntry {
  isLeaving: boolean;
}

export interface ToastContextState {
  toasts: ToastInternalEntry[];
  config: Required<ToastProviderConfig>;
}

export interface ToastContextActions {
  show: (config: ToastConfig) => { dismiss: () => void };
  info: (
    message: string,
    config?: Omit<ToastConfig, 'message' | 'severity'>,
  ) => { dismiss: () => void };
  success: (
    message: string,
    config?: Omit<ToastConfig, 'message' | 'severity'>,
  ) => { dismiss: () => void };
  warning: (
    message: string,
    config?: Omit<ToastConfig, 'message' | 'severity'>,
  ) => { dismiss: () => void };
  error: (
    message: string,
    config?: Omit<ToastConfig, 'message' | 'severity'>,
  ) => { dismiss: () => void };
  dismissAll: () => void;
}

export type ToastContextValue = [
  state: ToastContextState,
  actions: ToastContextActions,
];

const defaultConfig: Required<ToastProviderConfig> = {
  maxVisible: TOAST_DEFAULT_MAX_VISIBLE,
  defaultDuration: TOAST_DEFAULT_DURATION,
};

const defaultState: ToastContextState = {
  toasts: [],
  config: defaultConfig,
};

const ToastContext = createContext<ToastContextValue>([
  structuredClone(defaultState),
  {
    show: () => {
      throw new Error('ToastContext: show() called before provider');
    },
    info: () => {
      throw new Error('ToastContext: info() called before provider');
    },
    success: () => {
      throw new Error('ToastContext: success() called before provider');
    },
    warning: () => {
      throw new Error('ToastContext: warning() called before provider');
    },
    error: () => {
      throw new Error('ToastContext: error() called before provider');
    },
    dismissAll: () => {
      throw new Error('ToastContext: dismissAll() called before provider');
    },
  },
]);

export const ToastProvider: ParentComponent<{
  config?: ToastProviderConfig;
}> = (props) => {
  const [unit] = useConsoleUnitPrototype();
  const [state, setState] = createStore<ToastContextState>({
    toasts: [],
    config: { ...structuredClone(defaultConfig), ...props.config },
  });

  const isNarrowScreen = () => unit.windowSize.width <= 60;

  const removeToast = (id: string) => {
    setState('toasts', (toasts) => toasts.filter((t) => t.id !== id));
  };

  const startLeaving = (id: string) => {
    setState(
      'toasts',
      (t) => t.id === id,
      produce((toast) => {
        toast.isLeaving = true;
      }),
    );
  };

  const dismiss = (id: string) => {
    const toast = state.toasts.find((t) => t.id === id);
    if (toast && !toast.isLeaving) {
      startLeaving(id);
    }
  };

  const show: ToastContextActions['show'] = (config) => {
    const id = createUniqueId();
    const duration =
      config.duration === undefined
        ? state.config.defaultDuration
        : config.duration;

    const dismissCallback = () => dismiss(id);

    const entry: ToastInternalEntry = {
      ...config,
      duration,
      id,
      severity: config.severity ?? 'info',
      dismissible: config.dismissible ?? true,
      createdAt: Date.now(),
      dismiss: dismissCallback,
      isLeaving: false,
    };

    setState('toasts', (entries) => [...entries, entry]);
    return { dismiss: dismissCallback };
  };

  const info: ToastContextActions['info'] = (message, config) =>
    show({ ...config, message, severity: 'info' });

  const success: ToastContextActions['success'] = (message, config) =>
    show({ ...config, message, severity: 'success' });

  const warning: ToastContextActions['warning'] = (message, config) =>
    show({ ...config, message, severity: 'warning' });

  const error: ToastContextActions['error'] = (message, config) =>
    show({ ...config, message, severity: 'error' });

  const dismissAll: ToastContextActions['dismissAll'] = () => {
    for (const toast of state.toasts) {
      if (!toast.isLeaving) {
        startLeaving(toast.id);
      }
    }
  };

  const visibleToasts = createMemo(() => {
    const persistent = state.toasts.filter((t) => t.duration === null);
    const regular = state.toasts.filter((t) => t.duration !== null);
    const maxRegular = Math.max(0, state.config.maxVisible - persistent.length);

    return [...persistent, ...regular.slice(0, maxRegular)];
  });

  const queuedCount = createMemo(() => {
    return Math.max(0, state.toasts.length - visibleToasts().length);
  });

  return (
    <ToastContext.Provider
      value={[state, { show, info, success, warning, error, dismissAll }]}
    >
      {props.children}
      <div
        classList={{
          [style.container]: true,
          [style.narrow]: isNarrowScreen(),
        }}
      >
        <For each={visibleToasts()}>
          {(toast, index) => (
            <Toast
              index={index()}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          )}
        </For>

        <Show when={queuedCount() > 0}>
          <QueueIndicator count={queuedCount()} />
        </Show>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => useContext(ToastContext);

export const useToastActions = (): ToastContextActions =>
  useContext(ToastContext)[1];
