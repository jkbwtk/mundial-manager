import { For, type JSX, Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import {
  type EntityLookup,
  usePlayerLookup,
  useTableLookup,
} from '#flib/entityLookup';
import { getTableSideColor } from '#flib/teamColors';
import { getMatchSidePlayers } from '#shared/matchTimeline';
import type { Match } from '#shared/types/api/match';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { Player } from '#shared/types/api/player';
import type { Table } from '#shared/types/api/table';
import style from './MatchSideLabel.module.scss';

export type MatchSideLabelAlign = 'start' | 'end';

export interface MatchSideLabelProps {
  match: Pick<Match, 'tableUuid' | 'playersSide1' | 'playersSide2'>;
  side: MatchSide;

  players?: EntityLookup<Player>;
  tables?: EntityLookup<Table>;

  align?: MatchSideLabelAlign;
  compact?: boolean;
  stacked?: boolean;
  highlight?: boolean;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const MatchSideLabel: Component<MatchSideLabelProps> = (props) => {
  const players = props.players ?? usePlayerLookup();
  const tables = props.tables ?? useTableLookup();

  const align = () => props.align ?? 'start';

  const color = () =>
    getTableSideColor(
      props.match.tableUuid ? tables.get(props.match.tableUuid) : null,
      props.side,
    );

  const uuids = () => getMatchSidePlayers(props.match, props.side);

  const getName = (uuid: string) => {
    const player = players.get(uuid);

    if (props.compact && player) return player.alias;

    return players.getLabel(uuid);
  };

  const names = () => uuids().map(getName);
  const fullNames = () => uuids().map(players.getLabel).join(', ');

  return (
    <span
      classList={{
        [style.matchSideLabel]: true,
        [style.end]: align() === 'end',
        [style.stacked]: !!props.stacked,
        [style.highlight]: !!props.highlight,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      title={fullNames()}
    >
      <ColorBlock color={color()} width={2} class={style.swatch} />
      <span class={style.names}>
        <Show when={props.stacked} fallback={names().join(' ')}>
          <For each={names()}>
            {(name) => <span class={style.name}>{name}</span>}
          </For>
        </Show>
      </span>
    </span>
  );
};
