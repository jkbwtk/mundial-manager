import dayjs from 'dayjs';
import { For, Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { customWidgetType } from '#components/Widget';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { Change, ChangeType, Version } from '#shared/types/Changelog';
import style from './ChangelogModal.module.scss';

export interface VersionProps {
  version: Version;
}

const DetailsWidget = customWidgetType('details');

const getChangeTypeIcon = (type: ChangeType): SupportedMaterialSymbol => {
  const icons = {
    feature: 'stars_2',
    improvement: 'deblur',
    bugfix: 'handyman',
    removal: 'delete',
  } as const;

  return icons[type];
};

const formatDate = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const VersionChangelog: Component<VersionProps> = (props) => {
  return (
    <div class={style.version}>
      <div class={style.versionHeader}>
        <span
          classList={{
            [style.releaseTypeLabel]: true,
            [style[props.version.releaseType]]: true,
          }}
        >
          {props.version.releaseType}
        </span>
        <strong>
          <i>v{props.version.version}</i>
        </strong>

        <span class={style.versionDate}>{formatDate(props.version.date)}</span>
      </div>

      <div class={style.versionName}>{props.version.name}</div>

      <ul class={style.changes}>
        <Show
          when={props.version.changes.length > 0}
          fallback={<div>No changelog provided</div>}
        >
          <div>
            <strong>Changes:</strong>
          </div>

          <For each={props.version.changes}>
            {(change: Change) => {
              return (
                <li class={style.change}>
                  <MaterialSymbol
                    symbol={getChangeTypeIcon(change.type)}
                    filled={true}
                    classList={{
                      [style.changeType]: true,
                      [style[change.type]]: true,
                    }}
                  />
                  <div>
                    <span class={style.changeText}>{change.change}</span>
                    <Show when={change.description}>
                      <div>
                        <i>{change.description}</i>
                      </div>
                    </Show>
                  </div>
                </li>
              );
            }}
          </For>
        </Show>
      </ul>

      <Show when={props.version.commits.length > 0}>
        <DetailsWidget class={style.commits}>
          <summary class={style.commitsSummary}>
            {props.version.commits.length} commit
            {props.version.commits.length !== 1 ? 's' : ''}
          </summary>
          <div class={style.commitsList}>
            <For each={props.version.commits}>
              {(commit) => (
                <div class={style.commit}>
                  <span class={style.commitHash}>
                    {commit.hash.substring(0, 7)}
                  </span>
                  <span class={style.commitMessage}>{commit.message}</span>
                </div>
              )}
            </For>
          </div>
        </DetailsWidget>
      </Show>
    </div>
  );
};
