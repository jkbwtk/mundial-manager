import { Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button } from '#components/Button';
import { InlineAction } from '#components/InlineAction';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { formatDate, formatDuration } from '#flib/sheetUtils';
import { getTeamColorClass } from '#flib/teamColors';
import { useSheets } from '#providers/SheetsProvider';
import type { MatchCreate } from '#shared/types/Sheets';
import style from './CreatedMatchesTest.module.scss';

interface MatchRow extends MatchCreate {
  hash: string;
  synced: boolean;
  [key: string]: unknown;
}

const CreatedMatchesTest: Component = () => {
  const [
    state,
    {
      createLocalMatch,
      matchHashMap,
      syncCreatedMatch,
      syncCreatedMatches,
      clearCreatedMatches,
      removeCreatedMatch,
    },
  ] = useSheets();
  const [syncing, setSyncing] = createStore<Record<string, boolean>>({});

  const addMockMatch = () => {
    const newMatch: MatchCreate = {
      date: Math.floor(Date.now() / 1000),
      team1: 'Player1 Player2',
      team2: 'Player3 Player4',
      score1: 10,
      score2: 0,
      winningColor: 'unknown',
      duration: Math.floor(Math.random() * 600),
      replayMetadata: null,
    };

    createLocalMatch(newMatch);
  };

  const syncMatch = async (hash: string) => {
    setSyncing(hash, true);

    try {
      await syncCreatedMatch(hash);
    } finally {
      setSyncing(hash, false);
    }
  };

  const syncAll = async () => {
    const hashes = Object.keys(state.createdMatches);
    const hashesToSync = hashes.filter((hash) => !matchHashMap()[hash]);

    setSyncing(hashesToSync, true);

    try {
      await syncCreatedMatches(hashesToSync);
    } finally {
      setSyncing(hashesToSync, false);
    }
  };

  const clearAll = () => {
    clearCreatedMatches();
  };

  const removeMatch = (hash: string) => {
    removeCreatedMatch(hash);
  };

  const matchesCount = () => Object.keys(state.createdMatches).length;
  const syncedCount = () =>
    Object.keys(state.createdMatches).filter((hash) => matchHashMap()[hash])
      .length;
  const unsyncedCount = () => matchesCount() - syncedCount();

  const tableData = (): MatchRow[] => {
    return Object.entries(state.createdMatches).map(([hash, match]) => ({
      ...match,
      hash,
      synced: !!matchHashMap()[hash],
    }));
  };

  const columns: Column<string>[] = [
    {
      key: 'synced',
      header: 'Sync',
      align: 'center',
      width: 6,
      transform: (value: boolean, row: MatchRow) => {
        if (value) {
          return <MaterialSymbol symbol="check_box" />;
        }
        if (syncing[row.hash]) {
          return <span>...</span>;
        }
        return (
          <InlineAction
            symbol="s"
            content="S"
            onAction={() => syncMatch(row.hash)}
          />
        );
      },
    },
    {
      key: 'team1',
      header: 'Team 1',
    },
    {
      key: 'score1',
      header: 'Score',
      align: 'center',
      width: 8,
      transform: (_: number, row: MatchRow) => (
        <>
          <span class={row.score1 > row.score2 ? style.highlightedScore : ''}>
            {row.score1}
          </span>
          :
          <span class={row.score1 < row.score2 ? style.highlightedScore : ''}>
            {row.score2}
          </span>
        </>
      ),
    },
    {
      key: 'team2',
      header: 'Team 2',
    },
    {
      key: 'winningColor',
      header: 'Color',
      align: 'center',
      width: 8,
      transform: (value: string) => {
        const colorClass = getTeamColorClass(value);

        return <span class={`${style.teamColor} ${colorClass}`} />;
      },
    },
    {
      key: 'duration',
      header: 'Time',
      width: 10,
      transform: (value: number | null) =>
        value ? formatDuration(value) : 'N/A',
    },
    {
      key: 'date',
      header: 'Date',
      width: 12,
      transform: (value: number | null) => (value ? formatDate(value) : 'N/A'),
    },
    {
      key: 'hash',
      header: 'Actions',
      align: 'center',
      width: 10,
      transform: (hash: string) => (
        <Button onClick={() => removeMatch(hash)} severity="danger">
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Widget
      topLeftLabels="Created Matches Test"
      topRightLabels={[
        `Total: ${matchesCount()}`,
        `Synced: ${syncedCount()}`,
        `Unsynced: ${unsyncedCount()}`,
      ]}
      class={style.container}
    >
      <div class={style.controls}>
        <Button onClick={addMockMatch}>Add Mock Match</Button>
        <Button
          onClick={syncAll}
          disabled={matchesCount() === 0}
          severity="secondary"
        >
          Sync All
        </Button>
        <Button
          onClick={clearAll}
          disabled={matchesCount() === 0}
          severity="danger"
        >
          Clear All
        </Button>
      </div>

      <Divider />

      <Show
        when={matchesCount() > 0}
        fallback={<div class={style.emptyState}>No created matches yet</div>}
      >
        <Table columns={columns} data={tableData()} class={style.table} />
      </Show>
    </Widget>
  );
};

export default CreatedMatchesTest;
