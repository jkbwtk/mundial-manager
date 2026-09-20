import { Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { InlineAction } from '#components/InlineAction';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { getTeamColor } from '#flib/teamColors';
import { useSheets } from '#providers/SheetsProvider';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type { MatchCreate } from '#shared/types/Sheets';
import style from './CreatedMatchesTest.module.scss';

interface MatchRow extends MatchCreate {
  syncId: string;
  synced: boolean;
  [key: string]: unknown;
}

const CreatedMatchesTest: Component = () => {
  const [
    state,
    {
      createLocalMatch,
      matchSyncIdMap,
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

  const syncMatch = async (syncId: string) => {
    setSyncing(syncId, true);

    try {
      await syncCreatedMatch(syncId);
    } finally {
      setSyncing(syncId, false);
    }
  };

  const syncAll = async () => {
    const syncIds = Object.keys(state.createdMatches);
    const syncIdsToSync = syncIds.filter((syncId) => !matchSyncIdMap()[syncId]);

    setSyncing(syncIdsToSync, true);

    try {
      await syncCreatedMatches(syncIdsToSync);
    } finally {
      setSyncing(syncIdsToSync, false);
    }
  };

  const clearAll = () => {
    clearCreatedMatches();
  };

  const removeMatch = (syncId: string) => {
    removeCreatedMatch(syncId);
  };

  const matchesCount = () => Object.keys(state.createdMatches).length;
  const syncedCount = () =>
    Object.keys(state.createdMatches).filter(
      (syncId) => matchSyncIdMap()[syncId],
    ).length;
  const unsyncedCount = () => matchesCount() - syncedCount();

  const tableData = (): MatchRow[] => {
    return Object.entries(state.createdMatches).map(([syncId, match]) => ({
      ...match,
      syncId,
      synced: !!matchSyncIdMap()[syncId],
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
        if (syncing[row.syncId]) {
          return <span>...</span>;
        }
        return (
          <InlineAction
            symbol="s"
            content="S"
            onAction={() => syncMatch(row.syncId)}
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
      transform: (value: string) => (
        <ColorBlock color={getTeamColor(value)} width={6} />
      ),
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
      key: 'syncId',
      header: 'Actions',
      align: 'center',
      width: 10,
      transform: (syncId: string) => (
        <Button onClick={() => removeMatch(syncId)} severity="danger">
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

      <div class={style.innerContainer}>
        <Show
          when={matchesCount() > 0}
          fallback={<div>No created matches yet</div>}
        >
          <Table columns={columns} data={tableData()} class={style.table} />
        </Show>
      </div>
    </Widget>
  );
};

export default CreatedMatchesTest;
