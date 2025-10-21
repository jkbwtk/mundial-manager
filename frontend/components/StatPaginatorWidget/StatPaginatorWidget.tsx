import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultMatchStats } from '#flib/sheetUtils';
import type { MatchStats } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export interface StatPaginatorState {
  currentPage: number;
  matchStats: MatchStats;
}

export type StatPaginatorContextValue = [state: StatPaginatorState];

function createDefaultState(): StatPaginatorState {
  return {
    currentPage: 0,
    matchStats: structuredClone(defaultMatchStats),
  };
}

const StatPaginatorContext = createContext<StatPaginatorContextValue>([
  createDefaultState(),
]);

export const StatPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [sheets, { matchStats, latestMatchStats }] = useSheets();

  const [state, setState] = createStore<StatPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const stats =
      matchStats()[sheets.matches.at(-state.currentPage - 1)?.id ?? -1];

    if (stats) {
      setState('matchStats', stats);
    } else {
      batch(() => {
        setState('currentPage', 0);
        setState('matchStats', latestMatchStats());
      });
    }
  });

  return (
    <StatPaginatorContext.Provider value={[state]}>
      <Widget
        {...props}
        bottomRightLabels={[
          ...arrayFrom(props.bottomRightLabels).filter(Boolean),
          <span>
            <InlineAction
              symbol="<"
              disabledTriggers={['shortcut']}
              onAction={() =>
                setState('currentPage', (prev) =>
                  Math.min(prev + 1, sheets.matches.length - 1),
                )
              }
            />{' '}
            Match: {state.matchStats.label}{' '}
            <InlineAction
              symbol=">"
              disabledTriggers={['shortcut']}
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

export const usePaginatedStat = () => {
  const [state] = useStatPaginator();
  return () => state.matchStats;
};
