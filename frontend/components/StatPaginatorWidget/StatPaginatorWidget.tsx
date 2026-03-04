import {
  batch,
  createContext,
  createEffect,
  createMemo,
  on,
  splitProps,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import {
  defaultAggregateFrame,
  defaultMatchDataFrame,
} from '#flib/defaultStats';
import { createDeltaFrame } from '#flib/matchDataUtils';
import type {
  AggregateFrame,
  AggregateStats,
  MatchData,
  MatchDataFrame,
} from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export type AggregateType = 'session' | 'day' | 'week' | 'month' | 'season';

export type StatType = AggregateType | 'match';

interface StatMapping {
  aggregateFrame: (data: MatchData, page: number) => AggregateFrame | null;
  aggregateStats: (frame: MatchDataFrame) => AggregateStats;
  paginatorLabel: (data: MatchData, frame: MatchDataFrame) => string;
  paginatorLength: (data: MatchData) => number;
}

export interface StatPaginatorState {
  currentPage: number;
  aggregateFrame: AggregateFrame;
}

export type StatPaginatorContextValue = [state: StatPaginatorState];

export interface StatPaginatorWidgetProps
  extends WidgetPropsWithoutComponent<'div'> {
  statType: StatType;
}

export const AggregateTypeOptions = [
  { label: 'Session', value: 'session' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Season', value: 'season' },
] satisfies {
  label: string;
  value: AggregateType;
}[];

export const StatTypeOptions = [
  { label: 'Match', value: 'match' },
  { label: 'Session', value: 'session' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Season', value: 'season' },
] satisfies {
  label: string;
  value: StatType;
}[];

const StatMappings = {
  match: {
    aggregateFrame: (d, page) => {
      const current = d.frames.at(-page - 1);
      const previous = d.frames.at(-page - 2) ?? defaultMatchDataFrame;

      if (current === undefined) {
        return null;
      }

      return {
        frame: current,
        previousFrame: previous,
      };
    },
    aggregateStats: () => {
      throw new Error('Not supported');
    },
    paginatorLabel: (d, f) => `${f.match.id}/${d.frames.length}`,
    paginatorLength: (d) => d.frames.length,
  },
  session: {
    aggregateFrame: (d, page) =>
      Object.values(d.sessionStats).at(-page - 1) ?? null,
    aggregateStats: (f) => f.sessionStats,
    paginatorLabel: (_, f) => f.sessionStats.humanSession,
    paginatorLength: (d) => Object.keys(d.sessionStats).length,
  },
  day: {
    aggregateFrame: (d, page) =>
      Object.values(d.dayStats).at(-page - 1) ?? null,
    aggregateStats: (f) => f.dayStats,
    paginatorLabel: (_, f) => f.dayStats.humanDate,
    paginatorLength: (d) => Object.keys(d.dayStats).length,
  },
  week: {
    aggregateFrame: (d, page) =>
      Object.values(d.weekStats).at(-page - 1) ?? null,
    aggregateStats: (f) => f.weekStats,
    paginatorLabel: (_, f) => f.weekStats.humanWeek,
    paginatorLength: (d) => Object.keys(d.weekStats).length,
  },
  month: {
    aggregateFrame: (d, page) =>
      Object.values(d.monthStats).at(-page - 1) ?? null,
    aggregateStats: (f) => f.monthStats,
    paginatorLabel: (_, f) => f.monthStats.humanMonth,
    paginatorLength: (d) => Object.keys(d.monthStats).length,
  },
  season: {
    aggregateFrame: (d, page) =>
      Object.values(d.seasonStats).at(-page - 1) ?? null,
    aggregateStats: (f) => f.seasonStats,
    paginatorLabel: (_, f) => f.seasonStats.season.label,
    paginatorLength: (d) => Object.keys(d.seasonStats).length,
  },
} satisfies Record<StatType, StatMapping>;

function createDefaultState(): StatPaginatorState {
  return {
    currentPage: 0,
    aggregateFrame: structuredClone(defaultAggregateFrame),
  };
}

const StatPaginatorContext = createContext<StatPaginatorContextValue>([
  createDefaultState(),
]);

export const StatPaginatorWidget: Component<StatPaginatorWidgetProps> = (
  userProps,
) => {
  const [local, props] = splitProps(userProps, ['statType']);
  const [, { matchData }] = useSheets();

  const [state, setState] = createStore<StatPaginatorState>(
    createDefaultState(),
  );

  const mapping = createMemo(() => StatMappings[local.statType]);

  createEffect(
    on(
      () => local.statType,
      () => setState('currentPage', 0),
      { defer: true },
    ),
  );

  createEffect(() => {
    const frame = mapping().aggregateFrame(matchData(), state.currentPage);

    if (frame) {
      setState('aggregateFrame', frame);
    } else {
      const fallbackFrame =
        mapping().aggregateFrame(matchData(), 0) ?? defaultAggregateFrame;

      batch(() => {
        setState('currentPage', 0);
        setState('aggregateFrame', fallbackFrame);
      });
    }
  });

  const paginatorLabel = () => {
    return mapping().paginatorLabel(matchData(), state.aggregateFrame.frame);
  };

  return (
    <StatPaginatorContext.Provider value={[state]}>
      <Widget
        {...props}
        bottomRightLabels={[
          ...arrayFrom(props.bottomRightLabels).filter(Boolean),
          <span>
            <InlineAction
              content="<"
              symbol="ArrowLeft"
              onAction={() => {
                setState('currentPage', (prev) =>
                  Math.min(
                    prev + 1,
                    mapping().paginatorLength(matchData()) - 1,
                  ),
                );
              }}
            />{' '}
            {paginatorLabel()}{' '}
            <InlineAction
              content=">"
              symbol="ArrowRight"
              onAction={() =>
                setState('currentPage', (prev) => Math.max(prev - 1, 0))
              }
            />
          </span>,
        ]}
      />
    </StatPaginatorContext.Provider>
  );
};

export const useStatPaginator = () => useContext(StatPaginatorContext);

export const useStatPaginatedFrame = () => {
  const [state] = useStatPaginator();
  return () => state.aggregateFrame.frame;
};

export const useStatPaginatedDeltaFrame = () => {
  const [state] = useStatPaginator();
  return () =>
    createDeltaFrame(
      state.aggregateFrame.frame,
      state.aggregateFrame.previousFrame,
    );
};

export const useStatPaginatedAggregateStats = (type: () => AggregateType) => {
  const frame = useStatPaginatedFrame();
  const mapping = createMemo(() => StatMappings[type()]);

  return () => mapping().aggregateStats(frame());
};
