import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultAggregateFrame } from '#flib/defaultStats';
import { createDeltaFrame } from '#flib/matchDataUtils';
import type { AggregateFrame } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export interface SeasonPaginatorState {
  currentPage: number;
  aggregateFrame: AggregateFrame;
}

export type SeasonPaginatorContextValue = [state: SeasonPaginatorState];

function createDefaultState(): SeasonPaginatorState {
  return {
    currentPage: 0,
    aggregateFrame: structuredClone(defaultAggregateFrame),
  };
}

const SeasonPaginatorContext = createContext<SeasonPaginatorContextValue>([
  createDefaultState(),
]);

export const SeasonPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [, { matchData, latest }] = useSheets();

  const [state, setState] = createStore<SeasonPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const frame = Object.values(matchData().seasonStats).at(
      -state.currentPage - 1,
    );

    if (frame) {
      setState('aggregateFrame', frame);
    } else {
      const latestSeason = latest().season.number;
      const fallbackFrame =
        matchData().seasonStats[latestSeason] ?? defaultAggregateFrame;

      batch(() => {
        setState('currentPage', 0);
        setState('aggregateFrame', fallbackFrame);
      });
    }
  });

  return (
    <SeasonPaginatorContext.Provider value={[state]}>
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
                  Math.min(
                    prev + 1,
                    Object.keys(matchData().seasonStats).length - 1,
                  ),
                )
              }
            />{' '}
            {state.aggregateFrame.frame.seasonStats.season.label}{' '}
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
    </SeasonPaginatorContext.Provider>
  );
};

export const useSeasonPaginator = () => useContext(SeasonPaginatorContext);

export const useSeasonPaginatedFrame = () => {
  const [state] = useSeasonPaginator();
  return () => state.aggregateFrame.frame;
};

export const useSeasonPaginatedDeltaFrame = () => {
  const [state] = useSeasonPaginator();
  return () =>
    createDeltaFrame(
      state.aggregateFrame.frame,
      state.aggregateFrame.previousFrame,
    );
};
