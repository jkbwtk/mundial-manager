import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultMatchDataFrame } from '#flib/defaultStats';
import { createDeltaFrame } from '#flib/matchDataUtils';
import type { MatchDataFrame } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export interface MatchPaginatorState {
  currentPage: number;
  matchFrame: MatchDataFrame;
}

export type MatchPaginatorContextValue = [state: MatchPaginatorState];

function createDefaultState(): MatchPaginatorState {
  return {
    currentPage: 0,
    matchFrame: structuredClone(defaultMatchDataFrame),
  };
}

const MatchPaginatorContext = createContext<MatchPaginatorContextValue>([
  createDefaultState(),
]);

export const MatchPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [, { matchData, latest }] = useSheets();

  const [state, setState] = createStore<MatchPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const frame = Object.values(matchData().frames).at(-state.currentPage - 1);

    if (frame) {
      setState('matchFrame', frame);
    } else {
      batch(() => {
        setState('currentPage', 0);
        setState('matchFrame', latest());
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
                  Math.min(prev + 1, matchData().frames.length - 1),
                )
              }
            />{' '}
            {matchData().frames.length - state.currentPage}/
            {matchData().frames.length}{' '}
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

export const usePaginatedFrame = () => {
  const [state] = useMatchPaginator();

  return () => state.matchFrame;
};

export const usePaginatedDeltaFrame = () => {
  const [state] = useMatchPaginator();

  return () =>
    createDeltaFrame(state.matchFrame, state.matchFrame.previousFrame);
};
