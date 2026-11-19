import { createMemo, createSignal, For, getOwner, Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import { InlineAction } from '#components/InlineAction';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Modal } from '#components/Modal';
import { SessionPresenceModal } from '#components/SessionPresenceModal';
import { Skeleton } from '#components/Skeleton';
import { StatRow } from '#components/StatRow';
import { Divider } from '#components/Widget';
import { usePlayerLookup } from '#flib/entityLookup';
import { useCan } from '#flib/identity';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createResilientAsync } from '#flib/resilientAsync';
import { useStatsFeed } from '#flib/statsFeed';
import { queryPlayerPresence } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { PermissionEnum } from '#shared/permissions';
import { formatStatsWeekKey } from '#shared/stats/buckets';
import { DAY_MS, formatDuration, formatTime } from '#shared/timeUtils';
import type { PlayerPresenceSession } from '#shared/types/api/stats';
import style from './PresenceLogModal.module.scss';

export interface PresenceLogModalProps {
  playerUuid: string;
}

interface PresenceLogDay {
  day: string;
  sessions: PlayerPresenceSession[];
}

const PRESENCE_LOG_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRESENCE_LOG_SKELETON_LINES = 12;

function sumPresenceLog(
  sessions: PlayerPresenceSession[],
  getValue: (session: PlayerPresenceSession) => number,
): number {
  return sessions.reduce((total, session) => total + getValue(session), 0);
}

function getPresence(session: PlayerPresenceSession): number {
  return session.playingTime + session.spectatingTime;
}

export const PresenceLogModal: Component<PresenceLogModalProps> = (props) => {
  const [, { open }] = useModal();
  const players = usePlayerLookup();
  const timeZone = useLeagueTimeZone();
  const can = useCan();
  const owner = getOwner();

  useStatsFeed();

  const [week, setWeek] = createSignal<string | undefined>();

  const presence = createResilientAsync(
    () => ({ playerUuid: props.playerUuid, week: week() }),
    queryPlayerPresence,
  );

  const sessions = () => presence.latest?.sessions ?? [];
  const sum = (getValue: (session: PlayerPresenceSession) => number) =>
    sumPresenceLog(sessions(), getValue);

  const days = createMemo((): PresenceLogDay[] => {
    const current = presence.latest?.week;

    if (current === null || current === undefined) return [];

    const monday = Date.parse(`${current}T00:00:00Z`);

    return PRESENCE_LOG_WEEKDAYS.map((_, index) => {
      const day = new Date(monday + index * DAY_MS).toISOString().slice(0, 10);

      return {
        day,
        sessions: sessions().filter((session) => session.day === day),
      };
    });
  });

  const stepWeek = (delta: number) => {
    const weeks = presence.latest?.weeks ?? [];
    const next = weeks[weeks.indexOf(presence.latest?.week ?? '') + delta];

    if (next === undefined) return;

    setWeek(next);
  };

  const openSessionPresence = (session: PlayerPresenceSession) => {
    open({
      props: { component: SessionPresenceModal, matchUuid: session.matchUuid },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Player Presence Log"
      bottomRightLabels={
        <Show when={presence.latest?.week}>
          {(current) => (
            <span>
              <InlineAction
                content="<"
                symbol="ArrowLeft"
                onAction={() => stepWeek(-1)}
              />{' '}
              {formatStatsWeekKey(current())}{' '}
              <InlineAction
                content=">"
                symbol="ArrowRight"
                onAction={() => stepWeek(1)}
              />
            </span>
          )}
        </Show>
      }
    >
      <div class={style.container}>
        <div class={style.header}>
          <Show when={players.get(props.playerUuid)}>
            {(player) => (
              <strong class={style.label}>
                <ColorBlock color={player().color} width={2} /> {player().name}
              </strong>
            )}
          </Show>

          <Show when={days().length > 0}>
            <span class={style.dim}>
              {days().at(0)?.day} - {days().at(-1)?.day}
            </span>
          </Show>
        </div>

        <Show
          when={presence.latest !== undefined}
          fallback={<Skeleton lines={PRESENCE_LOG_SKELETON_LINES} />}
        >
          <Show
            when={days().length > 0}
            fallback={
              <span class={style.notice}>
                No presence recorded for "{players.getLabel(props.playerUuid)}".
              </span>
            }
          >
            <div
              classList={{
                [style.content]: true,
                [style.pending]: presence.pending(),
              }}
            >
              <StatRow
                items={[
                  {
                    symbol: 'timer',
                    value: formatDuration(sum(getPresence)),
                    label: 'present',
                  },
                  {
                    symbol: 'sports_soccer',
                    value: formatDuration(
                      sum((session) => session.playingTime),
                    ),
                    label: `${sum((session) => session.matches)} played`,
                  },
                  {
                    symbol: 'visibility',
                    value: formatDuration(
                      sum((session) => session.spectatingTime),
                    ),
                    label: `${sum((session) => session.spectatedMatches)} watched`,
                  },
                ]}
              />

              <Divider />

              <For each={days()}>
                {(day, index) => (
                  <>
                    <Show when={index() > 0}>
                      <Divider class={style.divider} />
                    </Show>

                    <div
                      classList={{
                        [style.day]: true,
                        [style.empty]: day.sessions.length === 0,
                      }}
                    >
                      <strong class={style.dayHeader}>
                        <span>
                          {PRESENCE_LOG_WEEKDAYS[index()]} {day.day.slice(5)}
                        </span>
                        <span>
                          {day.sessions.length === 0
                            ? '-'
                            : formatDuration(
                                sumPresenceLog(day.sessions, getPresence),
                              )}
                        </span>
                      </strong>

                      <For each={day.sessions}>
                        {(session) => (
                          <div class={style.session}>
                            <button
                              class={style.time}
                              type="button"
                              disabled={
                                !can([
                                  PermissionEnum.PRESENCE_UPDATE,
                                  PermissionEnum.PLAYERS_READ,
                                ])
                              }
                              onClick={() => openSessionPresence(session)}
                            >
                              {formatTime(session.startDate, timeZone())} →{' '}
                              {formatTime(session.endDate, timeZone())}
                            </button>

                            <Show when={session.playingTime > 0}>
                              <span class={style.value}>
                                <MaterialSymbol
                                  symbol="sports_soccer"
                                  color="primary"
                                />
                                {formatDuration(session.playingTime)}
                                <span class={style.dim}>
                                  ×{session.matches}
                                </span>
                              </span>
                            </Show>

                            <Show when={session.spectatingTime > 0}>
                              <span class={style.value}>
                                <MaterialSymbol
                                  symbol="visibility"
                                  color="primary"
                                />
                                {formatDuration(session.spectatingTime)}
                                <span class={style.dim}>
                                  ×{session.spectatedMatches}
                                </span>
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </Modal>
  );
};
