import { createMemo, createSignal, For, Show } from 'solid-js';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { InlineAction } from '#components/InlineAction';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { PlayerLink } from '#components/PlayerLink';
import { SimpleTable, type SimpleTableColumn } from '#components/SimpleTable';
import { Skeleton } from '#components/Skeleton';
import { Divider, Widget } from '#components/Widget';
import { getRatingConfidence } from '#flib/derivedStats';
import {
  type EntityLookup,
  usePlayerLookup,
  useSeasonLookup,
} from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { getSubjectColor } from '#flib/teamColors';
import { queryPeriodStats } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import { defaultSeasonConfig } from '#shared/defaults/season';
import type { Player } from '#shared/types/api/player';
import type { Season } from '#shared/types/api/season';
import type { RatingStatsEntry } from '#shared/types/api/stats';
import type { RatingSubject } from '#shared/types/stats/ratingStats';
import {
  type RatingSystem,
  RatingSystems,
} from '#shared/types/stats/ratingSystem';
import style from './Leaderboard.module.scss';

interface RatingTableProps {
  subject: RatingSubject;
  entries: RatingStatsEntry[] | undefined;

  players: EntityLookup<Player>;
  seasons: EntityLookup<Season>;

  separated?: boolean;
}

interface RatingRow {
  entry: RatingStatsEntry;

  value: number;
  previous: number;
  spread: string | null;
}

const RatingSubjectLabels: Record<RatingSubject, string> = {
  PLAYER: 'Player',
  HYBRID: 'Hybrid',
  TEAM_INDIVIDUAL: 'Team Individual',
  TEAM: 'Team',
};

const LeaderboardSubjects: RatingSubject[] = [
  'PLAYER',
  'HYBRID',
  'TEAM_INDIVIDUAL',
  'TEAM',
];

const RatingSystemLabels: Record<RatingSystem, [key: string, rest: string]> = {
  ELO: ['E', 'lo'],
  GLICKO2: ['G', 'licko-2'],
  SKILL: ['S', 'kill'],
};

const RatingTable: Component<RatingTableProps> = (props) => {
  const getSortedPlayers = (uuids: string[]) =>
    uuids.toSorted((a, b) =>
      props.players.getLabel(a).localeCompare(props.players.getLabel(b)),
    );

  const getMarkerColor = (entry: RatingStatsEntry) =>
    props.subject === 'TEAM'
      ? getSubjectColor(entry.uuid)
      : props.players.get(entry.uuid)?.color;

  const getRow = (entry: RatingStatsEntry): RatingRow => {
    const { rating, rd } = entry.rating;
    const params = (
      props.seasons.get(entry.epoch)?.config ?? defaultSeasonConfig
    ).ratings;

    if (entry.system === 'SKILL') {
      const deviations = params.SKILL.conservativeDeviations;

      return {
        entry,

        value: rating - deviations * (rd ?? 0),
        previous: entry.previous.rating - deviations * (entry.previous.rd ?? 0),
        spread: `±${(rd ?? 0).toFixed(0)}`,
      };
    }

    return {
      entry,

      value: rating,
      previous: entry.previous.rating,
      spread:
        rd === undefined || entry.system === 'ELO'
          ? null
          : `(${getRatingConfidence(rd, params[entry.system].defaultRd).toFixed(0)}%)`,
    };
  };

  const rows = createMemo((): RatingRow[] =>
    (props.entries ?? [])
      .filter((entry) => entry.subject === props.subject)
      .map(getRow)
      .toSorted((a, b) => b.value - a.value),
  );

  const columns = createMemo((): SimpleTableColumn<RatingRow>[] => [
    { render: (_row, index) => <>{index() + 1}.</> },
    {
      fill: true,
      wrap: true,
      render: (row) => (
        <>
          <span style={{ color: getMarkerColor(row.entry) }}>
            <MaterialSymbol symbol="atr" />
          </span>
          <For each={getSortedPlayers(row.entry.playerUuids)}>
            {(uuid, playerIndex) => (
              <>
                {playerIndex() > 0 ? ' ' : ''}
                <PlayerLink uuid={uuid} name={props.players.getLabel(uuid)} />
              </>
            )}
          </For>
        </>
      ),
    },
    {
      render: (row) => row.value.toFixed(row.entry.system === 'SKILL' ? 0 : 2),
    },
    ...(rows().some((row) => row.spread !== null)
      ? [{ render: (row: RatingRow) => row.spread }]
      : []),
    {
      render: (row) => (
        <DeltaDisplay base={row.value} compared={row.previous} roundIntegers />
      ),
    },
  ]);

  return (
    <Show when={props.entries} fallback={<Skeleton lines={8} />}>
      <Show when={rows().length > 0}>
        <Show when={props.separated}>
          <Divider />
        </Show>

        <div class={style.header}>
          <strong>{RatingSubjectLabels[props.subject]}</strong>
        </div>

        <SimpleTable columns={columns()} rows={rows()} />
      </Show>
    </Show>
  );
};

export const RatingLeaderboard: Component = () => {
  const [period] = useStatsPeriod();
  const players = usePlayerLookup();
  const seasons = useSeasonLookup();

  const [system, setSystem] = createSignal<RatingSystem>('ELO');

  const periodStats = createResilientAsync(
    () => period.period,
    queryPeriodStats,
  );

  const entries = () =>
    periodStats.latest?.ratings.filter((entry) => entry.system === system());

  const subjects = () =>
    LeaderboardSubjects.filter(
      (subject) =>
        entries()?.some((entry) => entry.subject === subject) ?? true,
    );

  return (
    <Widget
      class={style.container}
      topLeftLabels="Leaderboards"
      pending={periodStats.pending()}
      topRightLabels={RatingSystems.map((value) => (
        <span
          classList={{
            [style.label]: true,
            [style.activeStats]: system() === value,
          }}
        >
          <InlineAction
            symbol={RatingSystemLabels[value][0].toLowerCase()}
            content={RatingSystemLabels[value][0]}
            onAction={() => setSystem(value)}
          />
          {RatingSystemLabels[value][1]}
        </span>
      ))}
    >
      <For each={subjects()}>
        {(subject, index) => (
          <RatingTable
            subject={subject}
            entries={entries()}
            players={players}
            seasons={seasons}
            separated={index() > 0}
          />
        )}
      </For>
    </Widget>
  );
};
