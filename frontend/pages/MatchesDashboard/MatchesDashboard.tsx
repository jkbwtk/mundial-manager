import { revalidate, useAction, useNavigate } from '@solidjs/router';
import { batch, createEffect, createMemo, getOwner, on, Show } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { ActionMenu } from '#components/ActionMenu';
import { Button } from '#components/Button';
import { useConfirmModal } from '#components/ConfirmModal';
import { LegacyMatchImportModal } from '#components/LegacyMatchImportModal';
import { LiveMatchClock } from '#components/LiveMatches';
import { MatchCreatorModal } from '#components/MatchCreatorModal';
import { MatchFilterWidget } from '#components/MatchFilterWidget';
import { MatchSideLabel } from '#components/MatchSideLabel';
import { useMatchSummaryModal } from '#components/MatchSummaryModal';
import { Paginator } from '#components/Paginator';
import { SessionPresenceModal } from '#components/SessionPresenceModal';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useActiveMatches } from '#flib/activeMatches';
import { usePlayerLookup, useTableLookup } from '#flib/entityLookup';
import { useCan } from '#flib/identity';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { actionDeleteMatch, queryMatches } from '#flib/trpcCalls';
import { matchesDashboardSearchState } from '#preloaders/MatchesDashboard';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatKnownStartDatetime } from '#shared/matchLabels';
import { getMatchWinningSide } from '#shared/matchTimeline';
import { PermissionEnum } from '#shared/permissions';
import { formatDuration } from '#shared/timeUtils';
import type {
  Match,
  MatchFilters,
  MatchQueryMeta,
  MatchStatus,
} from '#shared/types/api/match';
import { shortUUID } from '#shared/utils';
import style from './MatchesDashboard.module.scss';

const MatchesDashboardStatusClasses: Record<MatchStatus, string> = {
  SCHEDULED: style.scheduled,
  ONGOING: style.ongoing,
  PAUSED: style.paused,
  FINISHED: '',
  SURRENDERED: style.surrendered,
  CANCELED: style.cancelled,
};

export const MatchesDashboard: Component = () => {
  const timeZone = useLeagueTimeZone();
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState(
    matchesDashboardSearchState,
  );

  const matches = createResilientAsync(queryMeta, queryMatches);
  const activeMatches = useActiveMatches();
  const players = usePlayerLookup();
  const tables = useTableLookup();
  const navigate = useNavigate();

  const activeByUuid = createMemo(
    () => new Map(activeMatches().map((active) => [active.match.uuid, active])),
  );

  const rows = () =>
    (matches.latest?.data ?? []).map(
      (match) => activeByUuid().get(match.uuid)?.match ?? match,
    );

  const deleteMatch = useAction(actionDeleteMatch);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();
  const openSummary = useMatchSummaryModal();
  const can = useCan();

  const handleCreateMatch = () => {
    open({
      props: {
        component: MatchCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleImportLegacyMatch = () => {
    open({
      props: {
        component: LegacyMatchImportModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleFiltersChange = (filters: MatchFilters) => {
    batch(() => {
      setQueryMeta('filters', reconcile(filters));
      setQueryMeta('pagination', 'offset', 0);
    });
  };

  const handleOnSort = (sorting: NonNullable<MatchQueryMeta['sorting']>) => {
    batch(() => {
      setQueryMeta('sorting', sorting);
      setQueryMeta('pagination', 'offset', 0);
    });
  };

  const getActive = (uuid: string) => activeByUuid().get(uuid) ?? null;

  const getWinner = (match: Match) =>
    getMatchWinningSide(match, getActive(match.uuid)?.events ?? []);

  const openPresence = (match: Match) => {
    open({
      props: { component: SessionPresenceModal, matchUuid: match.uuid },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const openEditor = (match: Match) => {
    open({
      props: { component: MatchCreatorModal, match },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleDeleteMatch = useHandleButtonAction(
    async (match: Match) => {
      const confirmed = await openConfirmModal({
        title: 'Delete Match',
        message: 'Delete this match?',
        subject: shortUUID(match.uuid),
        confirmText: 'Delete',
        severity: 'danger',
      });

      if (!confirmed) return;

      await deleteMatch(match.uuid);

      actions.success(`Deleted match: ${shortUUID(match.uuid)}`);
    },
    (err) => {
      console.error('Match deletion error:', err);
      actions.error('Failed to delete match');
    },
  );

  const column: Column[] = [
    {
      key: 'uuid',
      header: 'UUID',
      align: 'left',
      width: 8,
      transform: (val) => shortUUID(val),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      width: 12,
      transform: (val: Match['status']) => (
        <span class={MatchesDashboardStatusClasses[val]}>{val}</span>
      ),
    },
    {
      key: 'side1',
      header: 'Side 1',
      align: 'right',
      width: 20,
      transform: (_val, row: Match) => (
        <MatchSideLabel
          match={row}
          players={players}
          tables={tables}
          side="SIDE_1"
          align="end"
          compact
          highlight={getWinner(row) === 'SIDE_1'}
        />
      ),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'center',
      width: 7,
      transform: (_val, row: Match) => `${row.side1Score}:${row.side2Score}`,
    },
    {
      key: 'side2',
      header: 'Side 2',
      align: 'left',
      width: 20,
      transform: (_val, row: Match) => (
        <MatchSideLabel
          match={row}
          players={players}
          tables={tables}
          side="SIDE_2"
          compact
          highlight={getWinner(row) === 'SIDE_2'}
        />
      ),
    },
    {
      key: 'table',
      header: 'Table',
      align: 'left',
      width: 14,
      transform: (_val, row: Match) =>
        row.tableUuid ? tables.getLabel(row.tableUuid) : '-',
    },
    {
      key: 'startDate',
      header: 'Start Date',
      align: 'center',
      sortable: true,
      width: 21,
      transform: (_val, row: Match) =>
        formatKnownStartDatetime(row, timeZone()),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'center',
      sortable: true,
      width: 10,
      transform: (val, row: Match) => (
        <Show when={getActive(row.uuid)} fallback={formatDuration(val)}>
          {(active) => (
            <Show
              when={active().match.status !== 'SCHEDULED'}
              fallback={formatDuration(val)}
            >
              <LiveMatchClock active={active()} />
            </Show>
          )}
        </Show>
      ),
    },
    {
      key: 'pauseDuration',
      header: 'Pause',
      align: 'center',
      sortable: true,
      width: 8,
      transform: (val) => formatDuration(val),
    },
    {
      key: 'spectators',
      header: 'Spectators',
      align: 'center',
      width: 12,
      transform: (val: string[]) => val.length,
    },
    {
      key: 'spacer',
      header: '',
      align: 'center',
      transform: () => '',
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      width: 6,
      transform: (_, item: Match) => (
        <ActionMenu
          label={`Match ${shortUUID(item.uuid)} actions`}
          items={[
            {
              label: 'Summary',
              symbol: 'visibility',
              onSelect: () => openSummary(item.uuid),
            },
            {
              label: 'Timeline',
              symbol: 'timeline',
              onSelect: () => navigate(`/match-events/${item.uuid}`),
            },
            {
              label: 'Presence',
              symbol: 'groups',
              disabled: !can([
                PermissionEnum.MATCHES_UPDATE,
                PermissionEnum.PLAYERS_READ,
              ]),
              onSelect: () => openPresence(item),
            },
            {
              label: 'Edit',
              symbol: 'edit',
              disabled: !can(PermissionEnum.MATCHES_UPDATE),
              onSelect: () => openEditor(item),
            },
            {
              label: 'Delete',
              symbol: 'delete',
              danger: true,
              disabled:
                !can(PermissionEnum.MATCHES_DELETE) ||
                handleDeleteMatch.loading(),
              onSelect: () => handleDeleteMatch(item),
            },
          ]}
        />
      ),
    },
  ];

  createEffect(
    on(
      () => [...activeByUuid().keys()].toSorted().join(),
      () => revalidate('queryMatches'),
      { defer: true },
    ),
  );

  return (
    <div class={style.outerContainer}>
      <MatchFilterWidget
        value={queryMetaState.filters ?? {}}
        onChange={handleFiltersChange}
        actions={
          <Show when={can(PermissionEnum.MATCHES_CREATE)}>
            <Button onClick={handleCreateMatch}>Create Match</Button>
            <Button severity="secondary" onClick={handleImportLegacyMatch}>
              Import Match
            </Button>
          </Show>
        }
      />

      <Paginator
        total={matches.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
        setLimit={(limit) => setQueryMeta('pagination', { limit, offset: 0 })}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={rows()}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default MatchesDashboard;
