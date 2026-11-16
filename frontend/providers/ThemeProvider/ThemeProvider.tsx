import {
  batch,
  createContext,
  createEffect,
  createMemo,
  on,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import { createNow } from '#flib/clock';
import {
  getSeasonFraction,
  getThemePhase,
  readThemeCookies,
  resolveTheme,
  setThemeCookie,
  THEME_DEFAULT_PHASE,
  ThemeDefinitions,
} from '#flib/themes';
import { prefersReducedMotion } from '#flib/utils';
import {
  Theme,
  type ThemeDecorations,
  type ThemeEffectOrigin,
  type ThemeEffectProps,
  type ThemePreference,
} from '#frontend/types';
import { useSSRUtils } from '#providers/SSRUtilsProvider/SSRUtilsProvider';
import { getZonedCalendar } from '#shared/timeUtils';

export interface ThemeEffectEntry {
  id: number;
  effect: Component<ThemeEffectProps>;
  origin: ThemeEffectOrigin | null;
}

export interface ThemeContextState {
  preference: ThemePreference;
  theme: Theme;
  decorationsEnabled: boolean;
  decorations: ThemeDecorations | null;
  effects: ThemeEffectEntry[];
  progressOverride: number | null;
  phaseOverride: string | null;
  readonly progress: number;
  readonly phase: string | null;
}

export interface ThemeContextActions {
  setPreference: (preference: ThemePreference) => void;
  setDecorationsEnabled: (enabled: boolean) => void;
  playEffect: (
    effect: Component<ThemeEffectProps>,
    origin?: ThemeEffectOrigin,
  ) => void;
  stopEffect: (id: number) => void;
  setProgressOverride: (fraction: number | null) => void;
  setPhaseOverride: (phase: string | null) => void;
}

export type ThemeContextValue = [
  state: ThemeContextState,
  actions: ThemeContextActions,
];

const DECORATIONS_IDLE_TIMEOUT_MS = 3000;

const ThemeContext = createContext<ThemeContextValue>([
  {
    preference: 'DEFAULT',
    theme: 'DEFAULT',
    decorationsEnabled: true,
    decorations: null,
    effects: [],
    progressOverride: null,
    phaseOverride: null,
    progress: 1,
    phase: null,
  },
  {
    setPreference: () => {
      throw new Error('ThemeContext: setPreference() called before provider');
    },
    setDecorationsEnabled: () => {
      throw new Error(
        'ThemeContext: setDecorationsEnabled() called before provider',
      );
    },
    playEffect: () => {
      throw new Error('ThemeContext: playEffect() called before provider');
    },
    stopEffect: () => {
      throw new Error('ThemeContext: stopEffect() called before provider');
    },
    setProgressOverride: () => {
      throw new Error(
        'ThemeContext: setProgressOverride() called before provider',
      );
    },
    setPhaseOverride: () => {
      throw new Error(
        'ThemeContext: setPhaseOverride() called before provider',
      );
    },
  },
]);

function canLoadDecorations(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;

  return connection?.saveData !== true;
}

export const ThemeProvider: ParentComponent = (props) => {
  const [ssrState] = useSSRUtils();

  const cookies = readThemeCookies(
    isServer ? ssrState.cookies : document.cookie,
  );

  const clock = createNow(() => 'hour');
  const timeZone = isServer ? (cookies.themeTimeZone ?? undefined) : undefined;
  const now = createMemo(() => getZonedCalendar(clock().valueOf(), timeZone));

  const renderedTheme = isServer
    ? undefined
    : Theme.safeParse(document.documentElement.dataset.theme).data;
  const initialTheme = renderedTheme ?? resolveTheme(cookies.theme, now());

  const [state, setState] = createStore<ThemeContextState>({
    preference: cookies.theme,
    theme: initialTheme,
    decorationsEnabled: cookies.themeDecorations,
    decorations: null,
    effects: [],
    progressOverride: null,
    phaseOverride: null,
    get progress() {
      return progress();
    },
    get phase() {
      return phase();
    },
  });

  const progress = createMemo((): number => {
    if (state.progressOverride !== null) return state.progressOverride;

    const window = ThemeDefinitions[state.theme].window;
    if (window === undefined) return 1;

    return getSeasonFraction(window, now()) ?? 1;
  });

  const phase = createMemo((): string | null => {
    if (state.phaseOverride === THEME_DEFAULT_PHASE) return null;

    return state.phaseOverride ?? getThemePhase(state.theme, now());
  });

  let nextEffectId = 0;

  const setPreference: ThemeContextActions['setPreference'] = (preference) => {
    setThemeCookie('theme', preference);

    const update = () =>
      setState({ preference, theme: resolveTheme(preference, now()) });

    if (prefersReducedMotion()) {
      update();

      return;
    }

    document.startViewTransition(update);
  };

  const setDecorationsEnabled: ThemeContextActions['setDecorationsEnabled'] = (
    enabled,
  ) => {
    const update = () =>
      batch(() => {
        setThemeCookie('themeDecorations', enabled ? 'on' : 'off');
        setState('decorationsEnabled', enabled);
      });

    if (prefersReducedMotion()) {
      update();

      return;
    }

    document.startViewTransition(update);
  };

  const playEffect: ThemeContextActions['playEffect'] = (effect, origin) => {
    nextEffectId += 1;

    setState('effects', state.effects.length, {
      id: nextEffectId,
      effect,
      origin: origin ?? null,
    });
  };

  const stopEffect: ThemeContextActions['stopEffect'] = (id) => {
    setState('effects', (effects) =>
      effects.filter((entry) => entry.id !== id),
    );
  };

  const setProgressOverride: ThemeContextActions['setProgressOverride'] = (
    fraction,
  ) => {
    setState('progressOverride', fraction);
  };

  const setPhaseOverride: ThemeContextActions['setPhaseOverride'] = (phase) => {
    setState('phaseOverride', phase);
  };

  createEffect(
    on(
      () => state.theme,
      (theme) => {
        document.documentElement.dataset.theme = theme;
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute('content', ThemeDefinitions[theme].browserColor);
      },
    ),
  );

  createEffect(() => {
    const root = document.documentElement;

    if (state.phase === null) {
      delete root.dataset.themePhase;

      return;
    }

    root.dataset.themePhase = state.phase;
  });

  createEffect(
    on(
      [() => state.theme, () => state.decorationsEnabled],
      ([theme, enabled]) => {
        setState({ decorations: null, effects: [] });

        const loadDecorations = ThemeDefinitions[theme].loadDecorations;
        if (!enabled || loadDecorations === undefined) return;
        if (!canLoadDecorations()) return;

        let cancelled = false;

        const load = () => {
          loadDecorations()
            .then((decorations) => {
              if (!cancelled) setState('decorations', () => decorations);
            })
            .catch((err) => {
              console.error('Failed to load theme decorations', err);
            });
        };

        if (window.requestIdleCallback === undefined) {
          let timeoutRef: ReturnType<typeof setTimeout> | undefined;
          const frameRef = requestAnimationFrame(() => {
            timeoutRef = setTimeout(load, 0);
          });

          onCleanup(() => {
            cancelled = true;
            cancelAnimationFrame(frameRef);
            clearTimeout(timeoutRef);
          });

          return;
        }

        const idleRef = window.requestIdleCallback(load, {
          timeout: DECORATIONS_IDLE_TIMEOUT_MS,
        });

        onCleanup(() => {
          cancelled = true;
          window.cancelIdleCallback(idleRef);
        });
      },
    ),
  );

  onMount(() => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

    if (cookies.themeTimeZone !== timeZone) {
      setThemeCookie('themeTimeZone', timeZone);
    }
  });

  return (
    <ThemeContext.Provider
      value={[
        state,
        {
          setPreference,
          setDecorationsEnabled,
          playEffect,
          stopEffect,
          setProgressOverride,
          setPhaseOverride,
        },
      ]}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
