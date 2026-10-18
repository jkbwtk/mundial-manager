import { createMemo, createSignal, For, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { Modal } from '#components/Modal';
import { PlayerLink } from '#components/PlayerLink';
import { PlayerPickerModal } from '#components/PlayerPickerModal';
import { SimpleTable, type SimpleTableColumn } from '#components/SimpleTable';
import { Skeleton } from '#components/Skeleton';
import { Divider } from '#components/Widget';
import {
  divide,
  getAverageMatchDuration,
  getGoalDifference,
} from '#flib/derivedStats';
import { usePlayerLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createResilientAsync, ResilientSkip } from '#flib/resilientAsync';
import type { ClickEvent } from '#flib/solidHelpers';
import { queryPlayerProfileStats } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type {
  HeadToHead,
  HeadToHeadRecord,
} from '#shared/types/api/headToHead';
import type { PlayerProfileStats } from '#shared/types/api/stats';
import type { PlayerStats } from '#shared/types/stats/playerStats';
import style from './PlayerProfileModal.module.scss';

export interface PlayerProfileModalProps {
  playerUuid: string;
}

interface PlayerProfile {
  all: PlayerStats | null;
  today: PlayerStats | null;
  season: PlayerStats | null;

  mostMatchesInSeason: number | undefined;

  ratings: Partial<Record<string, number>>;
}

interface PlayerProfileRow {
  label: string;
  getValue: (profile: PlayerProfile) => number | null | undefined;
  formatter?: (value: number | undefined) => string;
}

const PROFILE_SKELETON_LINES = 40;

const formatProfileDuration = (value: number | undefined) =>
  formatDuration(value ?? 0);

const sections: PlayerProfileRow[][] = [
  [
    {
      label: 'Total Playtime',
      getValue: (profile) => profile.all?.playtime,
      formatter: formatProfileDuration,
    },
    {
      label: 'Total Presence',
      getValue: (profile) => profile.all?.participationTime,
      formatter: formatProfileDuration,
    },
    {
      label: 'Avg. Match Duration',
      getValue: (profile) =>
        profile.all && getAverageMatchDuration(profile.all),
      formatter: formatProfileDuration,
    },
  ],
  [
    { label: 'Total Matches', getValue: (profile) => profile.all?.matches },
    {
      label: 'Spectated Matches',
      getValue: (profile) => profile.all?.spectatedMatches,
    },
    { label: 'Wins', getValue: (profile) => profile.all?.wins },
    { label: 'Losses', getValue: (profile) => profile.all?.losses },
    { label: 'Draws', getValue: (profile) => profile.all?.draws },
    {
      label: 'Win/Loss Ratio',
      getValue: (profile) =>
        profile.all && divide(profile.all.wins, profile.all.losses),
    },
  ],
  [
    {
      label: 'Current Win Streak',
      getValue: (profile) => profile.all?.currentWinStreak,
    },
    {
      label: 'Current Loss Streak',
      getValue: (profile) => profile.all?.currentLossStreak,
    },
    {
      label: 'Longest Win Streak',
      getValue: (profile) => profile.all?.longestWinStreak,
    },
    {
      label: 'Longest Loss Streak',
      getValue: (profile) => profile.all?.longestLossStreak,
    },
  ],
  [
    { label: 'Goals For', getValue: (profile) => profile.all?.goalsFor },
    {
      label: 'Goals Against',
      getValue: (profile) => profile.all?.goalsAgainst,
    },
    {
      label: 'Goal Difference',
      getValue: (profile) => profile.all && getGoalDifference(profile.all),
    },
    {
      label: 'Goal Ratio',
      getValue: (profile) =>
        profile.all && divide(profile.all.goalsFor, profile.all.goalsAgainst),
    },
    { label: 'Goals Scored', getValue: (profile) => profile.all?.goals },
    { label: 'Own Goals', getValue: (profile) => profile.all?.ownGoals },
  ],
  [
    {
      label: 'Matches Today',
      getValue: (profile) => profile.today?.matches ?? 0,
    },
    {
      label: 'Most Matches In Day',
      getValue: (profile) => profile.all?.mostMatchesInDay,
    },
    {
      label: 'Matches In Season',
      getValue: (profile) => profile.season?.matches ?? 0,
    },
    {
      label: 'Most Matches In Season',
      getValue: (profile) => profile.mostMatchesInSeason,
    },
  ],
  [
    {
      label: 'Individual Elo',
      getValue: (profile) => profile.ratings['ELO:PLAYER'],
    },
    {
      label: 'Hybrid Elo',
      getValue: (profile) => profile.ratings['ELO:HYBRID'],
    },
    {
      label: 'Team Indiv. Elo',
      getValue: (profile) => profile.ratings['ELO:TEAM_INDIVIDUAL'],
    },
  ],
  [
    {
      label: 'Individual Glicko2',
      getValue: (profile) => profile.ratings['GLICKO2:PLAYER'],
    },
    {
      label: 'Hybrid Glicko2',
      getValue: (profile) => profile.ratings['GLICKO2:HYBRID'],
    },
    {
      label: 'Team Indiv. Glicko2',
      getValue: (profile) => profile.ratings['GLICKO2:TEAM_INDIVIDUAL'],
    },
  ],
  [
    {
      label: 'Skill',
      getValue: (profile) => profile.ratings['SKILL:HYBRID'],
    },
    {
      label: 'Style Points',
      getValue: (profile) => profile.all?.stylePoints,
    },
  ],
];

function getWinPercentage(record: HeadToHeadRecord): number {
  const total = record.wins + record.losses + record.draws;

  return total === 0 ? 0 : (record.wins / total) * 100;
}

function getPlayerProfile(
  stats: PlayerProfileStats | null | undefined,
): PlayerProfile | null {
  if (!stats) return null;

  return {
    ...stats,

    ratings: Object.fromEntries(
      stats.ratings.map((entry) => [
        `${entry.system}:${entry.subject}`,
        entry.rating.rating,
      ]),
    ),
  };
}

export const PlayerProfileModal: Component<PlayerProfileModalProps> = (
  props,
) => {
  const [, { open }] = useModal();
  const players = usePlayerLookup();
  const timeZone = useLeagueTimeZone();
  const owner = getOwner();

  const [selectedOverride, setSelectedOverride] = createSignal<string | null>(
    null,
  );
  const [comparedPlayer, setComparedPlayer] = createSignal<string | null>(null);

  const selectedPlayer = () => selectedOverride() ?? props.playerUuid;
  const selectedStats = createResilientAsync(
    () => selectedPlayer(),
    queryPlayerProfileStats,
  );
  const comparedStats = createResilientAsync(
    () => comparedPlayer() ?? ResilientSkip,
    queryPlayerProfileStats,
  );

  const isPending = () => selectedStats.pending() || comparedStats.pending();

  const shownPlayer = createMemo<string>(
    (previous) => (isPending() ? previous : selectedPlayer()),
    props.playerUuid,
  );
  const shownCompared = createMemo<string | null>(
    (previous) => (isPending() ? previous : comparedPlayer()),
    null,
  );

  const profile = createMemo(() => getPlayerProfile(selectedStats.latest));
  const comparedProfile = createMemo(() =>
    shownCompared() === null ? null : getPlayerProfile(comparedStats.latest),
  );

  const lastMatchDate = () => selectedStats.latest?.lastMatchDate ?? null;

  const getRowValue = (row: PlayerProfileRow, profile: PlayerProfile | null) =>
    profile === null ? undefined : (row.getValue(profile) ?? undefined);

  const headToHeadRecords = () => selectedStats.latest?.headToHead ?? [];

  const compareOpponents = (a: HeadToHead, b: HeadToHead) =>
    players
      .getLabel(a.opponentUuid)
      .localeCompare(players.getLabel(b.opponentUuid));

  const renderSplit = (split: HeadToHeadRecord) => (
    <Show when={split.wins + split.losses > 0}>
      <div class={style.comparison}>
        <span class={style.positive}>{split.wins}</span>
        <span>:</span>
        <span class={style.negative}>{split.losses}</span>
      </div>
    </Show>
  );

  const headToHeadColumns: SimpleTableColumn<HeadToHead>[] = [
    {
      header: 'Opponent',
      fill: true,
      wrap: true,
      render: (record) => (
        <PlayerLink
          uuid={record.opponentUuid}
          name={players.getLabel(record.opponentUuid)}
        />
      ),
    },
    {
      header: 'Won',
      align: 'right',
      class: style.positive,
      key: 'wins',
    },
    {
      header: 'Lost',
      align: 'right',
      class: style.negative,
      key: 'losses',
    },
    {
      header: 'Win%',
      align: 'right',
      render: (record) => `${getWinPercentage(record).toFixed(0)}%`,
    },
    {
      header: '1v1',
      align: 'center',
      render: (record) => renderSplit(record.singles),
    },
    {
      header: '2v2',
      align: 'center',
      render: (record) => renderSplit(record.doubles),
    },
  ];

  const handlePickerClose = (pickedPlayer?: unknown) => {
    if (typeof pickedPlayer === 'string') setComparedPlayer(pickedPlayer);
  };

  const handleListClick = (ev: ClickEvent, playerUuid: string) => {
    ev.preventDefault();

    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
      setComparedPlayer(playerUuid);
    } else {
      setSelectedOverride(playerUuid);
    }
  };

  const clearComparison = () => {
    setComparedPlayer(null);
  };

  const openPlayerPicker = () => {
    open({
      props: {
        component: PlayerPickerModal,
        disabledPlayers: [selectedPlayer()],
      },
      owner,
      afterClose: handlePickerClose,
    });
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Player Profile"
      bottomRightLabels={[
        <Show when={comparedPlayer()}>
          <Button severity="secondary" onClick={clearComparison}>
            Clear
          </Button>
        </Show>,
        <Button severity="secondary" onClick={openPlayerPicker}>
          Compare
        </Button>,
      ]}
    >
      <div class={style.playerListContainer}>
        <For each={players.all()}>
          {(player) => (
            <button
              type="button"
              onClick={(ev) => handleListClick(ev, player.uuid)}
              classList={{
                [style.player]: true,
                [style.selected]: player.uuid === selectedPlayer(),
                [style.compared]: player.uuid === comparedPlayer(),
              }}
            >
              {player.name}
            </button>
          )}
        </For>
      </div>

      <Divider />

      <Show
        when={selectedStats.latest !== undefined}
        fallback={<Skeleton lines={PROFILE_SKELETON_LINES} />}
      >
        <div
          classList={{ [style.content]: true, [style.pending]: isPending() }}
        >
          <Show
            when={profile()?.all}
            fallback={
              <div class={style.notFound}>
                No stats for "{players.getLabel(shownPlayer())}".
              </div>
            }
          >
            <div class={style.container}>
              <span>Player{shownCompared() ? 's' : ''}:</span>
              <strong>
                <ColorBlock
                  color={players.get(shownPlayer())?.color ?? ''}
                  width={2}
                />{' '}
                {players.getLabel(shownPlayer())}
                <Show when={shownCompared()}>
                  {(compared) => (
                    <>
                      <span> vs </span>
                      <ColorBlock
                        color={players.get(compared())?.color ?? ''}
                        width={2}
                      />{' '}
                      <strong>{players.getLabel(compared())}</strong>
                    </>
                  )}
                </Show>
              </strong>

              <span>Last Match Date:</span>
              <strong>{formatDate(lastMatchDate(), timeZone())}</strong>
            </div>

            <For each={sections}>
              {(rows) => (
                <>
                  <Divider class={style.divider} />

                  <div class={style.container}>
                    <For each={rows}>
                      {(row) => (
                        <>
                          <span>{row.label}:</span>
                          <strong>
                            <DeltaDisplay
                              base={getRowValue(row, profile())}
                              compared={getRowValue(row, comparedProfile())}
                              displayBase={true}
                              displayCompared={true}
                              formatter={row.formatter}
                            />
                          </strong>
                        </>
                      )}
                    </For>
                  </div>
                </>
              )}
            </For>

            <Show when={headToHeadRecords().length > 0}>
              <Divider class={style.divider} />

              <strong class={style.sectionLabel}>Head-to-Head</strong>

              <SimpleTable
                class={style.hthTable}
                columns={headToHeadColumns}
                rows={headToHeadRecords()}
                sort={compareOpponents}
              />
            </Show>
          </Show>
        </div>
      </Show>
    </Modal>
  );
};
