import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultDayStats } from '#flib/sheetUtils';
import type { DayStats } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export interface DayPaginatorState {
  currentPage: number;
  dayStats: DayStats;
}
export type DayPaginatorContextValue = [state: DayPaginatorState];

function createDefaultState(): DayPaginatorState {
  return {
    currentPage: 0,
    dayStats: structuredClone<DayStats>(defaultDayStats),
  };
}

const DayPaginatorContext = createContext<DayPaginatorContextValue>([
  createDefaultState(),
]);

export const DayPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [, { dayStats, latest }] = useSheets();

  const [state, setState] = createStore<DayPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const stats =
      Object.values(dayStats())
        .sort((a, b) => a.date - b.date)
        .at(-state.currentPage - 1) ?? structuredClone(defaultDayStats);

    if (stats) {
      setState('dayStats', stats);
    } else {
      batch(() => {
        setState('currentPage', 0);
        setState('dayStats', latest().dayStats);
      });
    }
  });

  return (
    <DayPaginatorContext.Provider value={[state]}>
      <Widget
        {...props}
        bottomRightLabels={[
          ...arrayFrom(props.bottomRightLabels).filter(Boolean),
          <span>
            <InlineAction
              content="<"
              symbol="ArrowLeft"
              onAction={() =>
                setState('currentPage', (prev) =>
                  Math.min(prev + 1, Object.keys(dayStats()).length - 1),
                )
              }
            />{' '}
            {state.dayStats.humanDate}{' '}
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
    </DayPaginatorContext.Provider>
  );
};

export const useDayPaginator = () => useContext(DayPaginatorContext);

export const usePaginatedDayStat = () => {
  const [state] = useDayPaginator();
  return () => state.dayStats;
};
