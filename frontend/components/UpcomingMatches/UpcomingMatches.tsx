import { A } from '@solidjs/router';
import { getOwner, type JSX, Show } from 'solid-js';
import { Button } from '#components/Button';
import { KeyedFor } from '#components/KeyedFor';
import { MatchCreatorModal } from '#components/MatchCreatorModal';
import { MatchSideLabel } from '#components/MatchSideLabel';
import { useMatchSummaryModal } from '#components/MatchSummaryModal';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Widget } from '#components/Widget';
import {
  formatUpcomingMatchTime,
  formatWinChances,
  getUpcomingMatches,
  UPCOMING_MATCHES_HREF,
  type UpcomingMatch,
  useActiveMatches,
  useLiveMatchPrediction,
  WIN_CHANCES_TITLE,
} from '#flib/activeMatches';
import { createNow } from '#flib/clock';
import { useCan } from '#flib/identity';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { useModal } from '#providers/ModalProvider';
import { PermissionEnum } from '#shared/permissions';
import style from './UpcomingMatches.module.scss';

export interface UpcomingMatchesProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface UpcomingMatchRowProps {
  upcoming: UpcomingMatch;
  label: string;
}

const UPCOMING_MATCHES_LIMIT = 5;

const UpcomingMatchRow: Component<UpcomingMatchRowProps> = (props) => {
  const prediction = useLiveMatchPrediction(() => props.upcoming.active);
  const openSummary = useMatchSummaryModal();

  return (
    <button
      type="button"
      classList={{
        [style.row]: true,
        [style.overdue]: props.upcoming.overdue,
        [style.paused]: props.upcoming.active.match.status === 'PAUSED',
      }}
      onClick={() => openSummary(props.upcoming.active.match.uuid)}
    >
      <span
        class={style.time}
        title={props.upcoming.overdue ? 'Overdue' : undefined}
      >
        <Show when={props.upcoming.overdue}>
          <MaterialSymbol symbol="event_busy" />{' '}
        </Show>
        {props.label}
      </span>
      <MatchSideLabel
        match={props.upcoming.active.match}
        side="SIDE_1"
        align="end"
        compact
      />
      <span class={style.dimmed}>vs</span>
      <MatchSideLabel
        match={props.upcoming.active.match}
        side="SIDE_2"
        compact
      />
      <span
        classList={{ [style.dimmed]: true, [style.odds]: true }}
        title={
          props.upcoming.active.match.status === 'PAUSED'
            ? undefined
            : WIN_CHANCES_TITLE
        }
      >
        <Show
          when={props.upcoming.active.match.status === 'PAUSED'}
          fallback={
            <Show when={prediction()}>
              {(current) => (
                <>{formatWinChances(current().preMatchWinProbability)}</>
              )}
            </Show>
          }
        >
          {props.upcoming.active.match.side1Score}:
          {props.upcoming.active.match.side2Score}
        </Show>
      </span>
    </button>
  );
};

export const UpcomingMatches: Component<UpcomingMatchesProps> = (props) => {
  const [, { open }] = useModal();
  const matches = useActiveMatches();
  const timeZone = useLeagueTimeZone();
  const now = createNow(() => 'minute');
  const can = useCan();
  const owner = getOwner();

  const upcoming = () =>
    getUpcomingMatches(matches(), timeZone() ?? 'UTC', now().valueOf());

  const shown = () => upcoming().slice(0, UPCOMING_MATCHES_LIMIT);
  const hidden = () => upcoming().length - shown().length;

  const handleSchedule = () => {
    open({
      props: {
        component: MatchCreatorModal,
        schedule: true,
        initialValues: { startDate: new Date() },
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  return (
    <Show when={upcoming().length > 0 || can(PermissionEnum.MATCHES_CREATE)}>
      <Widget
        classList={{
          [style.widget]: true,
          [props.class ?? '']: !!props.class,
          ...(props.classList ?? {}),
        }}
        topLeftLabels="Upcoming"
        topRightLabels={
          <Show when={can(PermissionEnum.MATCHES_CREATE)}>
            <Button severity="secondary" onClick={handleSchedule}>
              Schedule
            </Button>
          </Show>
        }
        bottomRightLabels={
          <Show when={hidden() > 0}>
            <A href={UPCOMING_MATCHES_HREF} class={style.more}>
              {hidden()} more →
            </A>
          </Show>
        }
      >
        <Show
          when={shown().length > 0}
          fallback={<span class={style.noData}>Nothing scheduled</span>}
        >
          <div class={style.list}>
            <KeyedFor each={shown()} by={(entry) => entry.active.match.uuid}>
              {(entry) => (
                <UpcomingMatchRow
                  upcoming={entry()}
                  label={formatUpcomingMatchTime(
                    entry(),
                    timeZone() ?? 'UTC',
                    now().valueOf(),
                  )}
                />
              )}
            </KeyedFor>
          </div>
        </Show>
      </Widget>
    </Show>
  );
};
