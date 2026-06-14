import {
  batch,
  createContext,
  createEffect,
  on,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import changelogFile from '#assets/metadata/changelog.json';
import { ChangelogModal } from '#components/ChangelogModal';
import { ChangelogConfig } from '#frontend/types';
import { useModal } from '#providers/ModalProvider';
import { Changelog } from '#shared/types/Changelog';

export interface ChangelogContextState {
  changelog: Changelog;
  valid: boolean;

  config: ChangelogConfig;
}

export interface ChangelogContextActions {
  openChangelog: () => void;
  triggerOpenChangelog: () => void;
  disablePermanently: () => void;
  disableUntilNextVersion: () => void;
  resetOptions: () => void;
  latestVersion: () => string | null;
  latestCommitHash: () => string | null;
}

export type ChangelogContextValue = [
  state: ChangelogContextState,
  actions: ChangelogContextActions,
];

const defaultState: ChangelogContextState = {
  changelog: { versions: [] },
  valid: false,

  config: {
    disabledPermanently: false,
    disabledUntilNextVersion: false,
    lastViewedVersion: null,
  },
};

const ChangelogContext = createContext<ChangelogContextValue>([
  structuredClone(defaultState),
  {
    openChangelog: () => {
      throw new Error(
        'ChangelogContext: openChangelog() called before provider',
      );
    },
    triggerOpenChangelog: () => {
      throw new Error(
        'ChangelogContext: triggerOpenChangelog() called before provider',
      );
    },
    disablePermanently: () => {
      throw new Error(
        'ChangelogContext: disablePermanently() called before provider',
      );
    },
    disableUntilNextVersion: () => {
      throw new Error(
        'ChangelogContext: disableUntilNextVersion() called before provider',
      );
    },
    resetOptions: () => {
      throw new Error(
        'ChangelogContext: resetOptions() called before provider',
      );
    },
    latestVersion: () => {
      throw new Error(
        'ChangelogContext: latestVersion() called before provider',
      );
    },
    latestCommitHash: () => {
      throw new Error(
        'ChangelogContext: latestCommitHash() called before provider',
      );
    },
  },
]);

const changelogConfigKey = 'CHANGELOG_CONFIG';

export const ChangelogProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<ChangelogContextState>(
    structuredClone(defaultState),
  );

  const [, { open: openModal }] = useModal();

  const loadChangelog = () => {
    // @ts-expect-error
    const changelog = Changelog.safeDecode(changelogFile);

    const storedConfig = localStorage.getItem(changelogConfigKey) ?? '';
    const parsedConfig = ChangelogConfig.safeDecode(storedConfig);

    batch(() => {
      if (changelog.success) {
        setState('changelog', changelog.data);
        setState('valid', true);
      } else {
        console.error('Failed to load changelog:', changelog.error);
      }

      if (parsedConfig.success) {
        setState('config', parsedConfig.data);
      }
    });
  };

  const saveConfig = (config: ChangelogConfig) => {
    const encodedConfig = ChangelogConfig.encode(config);
    localStorage.setItem(changelogConfigKey, encodedConfig);
  };

  const openChangelog = () => {
    openModal({
      props: {
        component: ChangelogModal,
      },
    });
  };

  const triggerOpenChangelog = () => {
    const latestVersion = state.changelog.versions[0];
    if (!latestVersion) return;

    if (state.config.disabledPermanently) return;

    if (
      state.config.disabledUntilNextVersion &&
      state.config.lastViewedVersion === latestVersion.version
    )
      return;

    setState('config', 'lastViewedVersion', latestVersion.version);

    openChangelog();
  };

  const disablePermanently = () => {
    setState('config', 'disabledPermanently', true);
  };

  const disableUntilNextVersion = () => {
    setState('config', 'disabledUntilNextVersion', true);
  };

  const resetOptions = () => {
    setState('config', defaultState.config);
  };

  const latestVersion: ChangelogContextActions['latestVersion'] = () => {
    return state.changelog.versions.at(0)?.version ?? null;
  };

  const latestCommitHash: ChangelogContextActions['latestCommitHash'] = () => {
    return state.changelog.versions.at(0)?.commits.at(0)?.hash ?? null;
  };

  createEffect(
    on(
      () => ({ ...state.config }),
      (config) => saveConfig(config),
      { defer: true },
    ),
  );

  onMount(() => {
    loadChangelog();

    triggerOpenChangelog();
  });

  return (
    <ChangelogContext.Provider
      value={[
        state,
        {
          openChangelog,
          triggerOpenChangelog,
          disablePermanently,
          disableUntilNextVersion,
          resetOptions,
          latestVersion,
          latestCommitHash,
        },
      ]}
    >
      {props.children}
    </ChangelogContext.Provider>
  );
};

export const useChangelog = (): ChangelogContextValue =>
  useContext(ChangelogContext);
