import { For, Show } from 'solid-js';
import { PlayerLink } from '#components/PlayerLink';
import type { MatchTimelineLookup } from '#flib/matchTimelineLookup';
import type { MatchSide } from '#shared/types/api/matchEvent';
import style from './MatchTimelineTable.module.scss';

export interface MatchSideNameProps {
  side: MatchSide;
  lookup: MatchTimelineLookup;

  links?: boolean;
}

export const MatchSideName: Component<MatchSideNameProps> = (props) => (
  <span
    class={style.teamName}
    style={{ '--team-color': props.lookup.getSideColor(props.side) }}
  >
    <For each={props.lookup.getSidePlayerNames(props.side)}>
      {(name, index) => (
        <>
          {index() > 0 ? ' ' : ''}
          <Show when={props.links} fallback={name}>
            <PlayerLink name={name} />
          </Show>
        </>
      )}
    </For>
  </span>
);
