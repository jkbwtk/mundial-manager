import { A } from '@solidjs/router';
import { type JSX, Show } from 'solid-js';
import { useActiveMatches } from '#flib/activeMatches';
import style from './LiveMatches.module.scss';
import { LiveMatchClock } from './LiveMatchParts';

export interface LiveMatchBadgeProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const LiveMatchBadge: Component<LiveMatchBadgeProps> = (props) => {
  const matches = useActiveMatches();

  const live = () =>
    matches().filter((active) => active.match.status === 'ONGOING');

  return (
    <Show when={live()[0]}>
      {(active) => (
        <A
          href={`/matches/${active().match.uuid}`}
          classList={{
            'no-style': true,
            [style.badge]: true,
            [props.class ?? '']: !!props.class,
            ...(props.classList ?? {}),
          }}
        >
          <span class={style.liveDot} aria-hidden="true">
            ●
          </span>
          <LiveMatchClock active={active()} />
          <strong class={style.tickerScore}>
            {active().match.side1Score}:{active().match.side2Score}
          </strong>
          <Show when={live().length > 1}>
            <span class={style.dimmed}>+{live().length - 1}</span>
          </Show>
        </A>
      )}
    </Show>
  );
};
