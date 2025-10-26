import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultMatch, defaultMatchStats } from '#flib/sheetUtils';
import type { MatchStats } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import type { Match } from '#shared/types/Sheets';
import { arrayFrom } from '#shared/utils';

export interface MatchPaginatorState {
  currentPage: number;
  match: Match;
  matchStats: MatchStats;
}

export type MatchPaginatorContextValue = [state: MatchPaginatorState];

function createDefaultState(): MatchPaginatorState {
  return {
    currentPage: 0,
    match: structuredClone(defaultMatch),
    matchStats: structuredClone(defaultMatchStats),
  };
}

const MatchPaginatorContext = createContext<MatchPaginatorContextValue>([
  createDefaultState(),
]);

export const MatchPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [sheets, { matchStats, latest }] = useSheets();

  const [state, setState] = createStore<MatchPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const match =
      sheets.matches.at(-state.currentPage - 1) ??
      structuredClone(defaultMatch);

    const stats = matchStats()[match.id];

    if (stats) {
      setState('match', match);
      setState('matchStats', stats);
    } else {
      batch(() => {
        setState('currentPage', 0);
        setState('match', latest().match);
        setState('matchStats', latest().matchStats);
      });
    }
  });

  return (
    <MatchPaginatorContext.Provider value={[state]}>
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
                  Math.min(prev + 1, sheets.matches.length - 1),
                )
              }
            />{' '}
            {sheets.matches.length - state.currentPage}/{sheets.matches.length}{' '}
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
    </MatchPaginatorContext.Provider>
  );
};

export const useMatchPaginator = () => useContext(MatchPaginatorContext);

export const usePaginatedStat = () => {
  const [state] = useMatchPaginator();
  return () => state.matchStats;
};

export const usePaginatedMatch = () => {
  const [state] = useMatchPaginator();
  return () => state.match;
};
