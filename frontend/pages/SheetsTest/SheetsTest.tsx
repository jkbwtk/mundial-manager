import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { For, batch, createSignal } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { HighlightedCode } from '#components/HighlightedCode';
import { type Column, Table } from '#components/Table';
import { Widget } from '#components/Widget';
import { formatDate, formatDuration } from '#flib/sheetUtils';
import { toJson } from '#flib/utils';
import { useSheets } from '#providers/SheetsProvider';
import type { Match } from '#shared/types/Sheets';
import { quickSwitch } from '#shared/utils';
import style from './SheetsTest.module.scss';

dayjs.extend(duration);

export const SheetsTest: Component = () => {
  const [sheets, { playerStats, generalStats, matchStats, dayStats }] =
    useSheets();

  const [sortColumn, setSortColumn] = createSignal<keyof Match | null>(null);
  const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc' | null>(
    null,
  );

  const columns: Column<keyof Match>[] = [
    { key: 'id', header: 'ID', align: 'right', sortable: true, width: 4 },
    {
      key: 'team1',
      header: 'Team 1',
      sortable: true,
    },
    {
      key: 'score1',
      header: 'Score',
      align: 'right',
      sortable: true,
      width: 8,
      transform: (_: number, row: Match) => (
        <>
          <span
            classList={{
              [style.highlightedScore]: row.score1 > row.score2,
            }}
          >
            {row.score1}
          </span>
          :
          <span
            classList={{
              [style.highlightedScore]: row.score1 < row.score2,
            }}
          >
            {row.score2}
          </span>
        </>
      ),
    },
    {
      key: 'team2',
      header: 'Team 2',
      sortable: true,
    },
    {
      key: 'floor',
      header: 'Floor',
      align: 'right',
      sortable: true,
      width: 8,
    },
    {
      key: 'winningColor',
      header: 'Color',
      sortable: true,
      align: 'center',
      transform: (value: string) => {
        const colorClass = quickSwitch<string>(value.toLowerCase(), {
          czerwony2: style.teamColorRed2,
          czerwony3: style.teamColorRed3,
          zielony: style.teamColorGreen,
          niebieski: style.teamColorBlue,
          default: '',
        });

        return (
          <span
            classList={{
              [style.teamColor]: true,
              [colorClass]: true,
            }}
          />
        );
      },
    },
    {
      key: 'duration',
      header: 'Time',
      sortable: true,
      transform: (value: number | null) =>
        value ? formatDuration(value) : null,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      transform: (value: number | null) => (value ? formatDate(value) : null),
    },
  ];

  const sortedData = () => {
    const key = sortColumn();
    const direction = sortDirection();

    if (key === null || direction === null) {
      return sheets.matches;
    }

    return sheets.matches.toSorted((a, b) => {
      if (a[key] === null) {
        return 1;
      }
      if (b[key] === null) {
        return -1;
      }

      switch (direction) {
        case 'asc':
          return a[key] > b[key] ? 1 : -1;

        case 'desc':
          return a[key] < b[key] ? 1 : -1;

        default:
          return 0;
      }
    });
  };

  function onSort(column: string, direction: 'asc' | 'desc') {
    batch(() => {
      // @ts-expect-error
      setSortColumn(column);
      setSortDirection(direction);
    });
  }

  return (
    <Widget title="Sheets Test Page" class={style.container}>
      <Widget title="Metadata" class={style.metadata}>
        Title:{' '}
        <strong>
          <AnimatedText>{sheets.metadata.title}</AnimatedText>
        </strong>
        <br />
        Timezone:
        <strong>
          <AnimatedText>{sheets.metadata.timezone}</AnimatedText>
        </strong>
        <br />
        Locale:{' '}
        <strong>
          <AnimatedText>{sheets.metadata.locale}</AnimatedText>
        </strong>
        <br />
        Rows:{' '}
        <strong>
          <AnimatedText>{sheets.metadata.rows}</AnimatedText>
        </strong>
        <br />
        Columns:{' '}
        <strong>
          <AnimatedText>{sheets.metadata.columns}</AnimatedText>
        </strong>
        <br />
        Ready:{' '}
        <strong>
          <AnimatedText>{sheets.ready ? 'Yes' : 'No'}</AnimatedText>
        </strong>
      </Widget>

      <Widget title="Players" class={style.metadata}>
        <For each={generalStats().uniquePlayers}>
          {(player) => <div>{player}</div>}
        </For>
      </Widget>

      <Widget title="General Stats" class={style.metadata}>
        <strong>Total playtime:</strong>{' '}
        <AnimatedText>{generalStats().totalPlaytimeFormatted}</AnimatedText>
        <br />
        <strong>Total individual playtime:</strong>{' '}
        <AnimatedText>
          {generalStats().totalIndividualPlaytimeFormatted}
        </AnimatedText>
        <br />
        <strong>Average match duration:</strong>{' '}
        <AnimatedText>
          {generalStats().averageMatchDurationFormatted}
        </AnimatedText>
        <br />
        <strong>Total playtime (extrapolated):</strong>{' '}
        <AnimatedText>
          {generalStats().totalPlaytimeExtrapolatedFormatted}
        </AnimatedText>
        <br />
        <strong>Total individual playtime (extrapolated):</strong>{' '}
        <AnimatedText>
          {generalStats().totalIndividualPlaytimeExtrapolatedFormatted}
        </AnimatedText>
        <br />
        <strong>Raw:</strong>
        <HighlightedCode language="json" code={toJson(generalStats())} />
      </Widget>

      <Widget title="Player Stats" class={style.metadata}>
        <strong>Playtime per player:</strong>
        <For each={Object.values(playerStats())}>
          {(stat) => (
            <div>
              <strong>{stat.player}: </strong>
              <AnimatedText>{stat.totalPlaytimeFormatted}</AnimatedText>
            </div>
          )}
        </For>
        <br />

        <strong>Raw:</strong>
        <HighlightedCode language="json" code={toJson(playerStats())} />
      </Widget>

      <Widget title="Match Stats" class={style.metadata}>
        <strong>Raw:</strong>
        <HighlightedCode language="json" code={toJson(matchStats())} />
      </Widget>

      <Widget title="Day Stats" class={style.metadata}>
        <strong>Raw:</strong>
        <HighlightedCode language="json" code={toJson(dayStats())} />
      </Widget>

      <Table
        columns={columns}
        data={sortedData()}
        class={style.matches}
        onSort={onSort}
      />
    </Widget>
  );
};

export default SheetsTest;
