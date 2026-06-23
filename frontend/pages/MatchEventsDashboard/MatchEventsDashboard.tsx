import { createAsync, useParams } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createSignal } from 'solid-js';
import { HighlightedCode } from '#components/HighlightedCode';
import { Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { queryMatchEventsByMatchId } from '#flib/trpcCalls';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type {
  MatchEvent,
  MatchEventByMatchId,
  MatchEventQueryMeta,
} from '#shared/types/api/matchEvent';
import { shortUUID } from '#shared/utils';
import style from './MatchEventsDashboard.module.scss';
import 'highlight.js/styles/gml.min.css';

hljs.registerLanguage('json', json);

export interface MatchEventsDashboardParams {
  matchUuid: string;
  [key: string]: string | undefined;
}

export const MatchEventsDashboard: Component = () => {
  const params = useParams<MatchEventsDashboardParams>();

  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [sorting, setSorting] = createSignal<MatchEventQueryMeta['sorting']>({
    field: 'time',
    direction: 'asc',
  });

  const queryMetaProp = (): MatchEventByMatchId => ({
    matchUuid: params.matchUuid,
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    sorting: sorting(),
  });

  const matchEvents = createAsync(() =>
    queryMatchEventsByMatchId(queryMetaProp()),
  );

  const handleOnSort = (field: string, direction: 'asc' | 'desc') => {
    setSorting({
      field: field as NonNullable<MatchEventQueryMeta['sorting']>['field'],
      direction,
    });
  };

  const matchStart = createMemo(() => {
    const startEvent = matchEvents.latest?.data.find(
      (event) => event.type === 'MATCH_START',
    );
    return startEvent?.time.getTime() ?? 0;
  });

  const column: Column[] = [
    {
      key: 'uuid',
      header: 'UUID',
      align: 'left',
      width: 8,
      transform: (val) => shortUUID(val),
    },
    {
      key: 'time',
      header: 'Date',
      align: 'center',
      width: 12,
      sortable: true,
      transform: (val: Date) => formatDate(val.getTime() / 1000),
    },
    {
      key: 'deltaT',
      header: 'T+',
      align: 'center',
      width: 8,
      transform: (_val, row: MatchEvent) => {
        const deltaT = row.time.getTime() - matchStart();

        return formatDuration(deltaT / 1000);
      },
    },
    {
      key: 'type',
      header: 'Type',
      align: 'left',
      width: 12,
    },
    {
      key: 'details',
      header: 'Details',
      align: 'left',
      transform: (_val, row: MatchEvent) => {
        const { uuid, matchUuid, time, type, ...rest } = row;

        return <HighlightedCode code={JSON.stringify(rest)} language="json" />;
      },
    },
  ];

  return (
    <div class={style.outerContainer}>
      <div class={style.controls} />

      <Paginator
        total={matchEvents.latest?.total ?? 0}
        limit={limit()}
        setLimit={setLimit}
        page={page()}
        setPage={setPage}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={matchEvents.latest?.data ?? []}
          classic={false}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default MatchEventsDashboard;
