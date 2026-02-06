import { batch, createContext, createEffect, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { InlineAction } from '#components/InlineAction';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { defaultAggregateFrame } from '#flib/defaultStats';
import { createDeltaFrame } from '#flib/matchDataUtils';
import type { AggregateFrame } from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';

export interface DayPaginatorState {
  currentPage: number;
  aggregateFrame: AggregateFrame;
}
export type DayPaginatorContextValue = [state: DayPaginatorState];

function createDefaultState(): DayPaginatorState {
  return {
    currentPage: 0,
    aggregateFrame: structuredClone(defaultAggregateFrame),
  };
}

const DayPaginatorContext = createContext<DayPaginatorContextValue>([
  createDefaultState(),
]);

export const DayPaginatorWidget: Component<
  WidgetPropsWithoutComponent<'div'>
> = (props) => {
  const [, { matchData, latest }] = useSheets();

  const [state, setState] = createStore<DayPaginatorState>(
    createDefaultState(),
  );

  createEffect(() => {
    const frame = Object.values(matchData().dayStats).at(
      -state.currentPage - 1,
    );

    if (frame) {
      setState('aggregateFrame', frame);
    } else {
      const fallbackFrame =
        matchData().dayStats[latest().match.date!] ?? defaultAggregateFrame;

      batch(() => {
        setState('currentPage', 0);
        setState('aggregateFrame', fallbackFrame);
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
                  Math.min(
                    prev + 1,
                    Object.keys(matchData().dayStats).length - 1,
                  ),
                )
              }
            />{' '}
            {state.aggregateFrame.frame.dayStats.humanDate}{' '}
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

export const useDayPaginatedFrame = () => {
  const [state] = useDayPaginator();
  return () => state.aggregateFrame.frame;
};

export const useDayPaginatedDeltaFrame = () => {
  const [state] = useDayPaginator();
  return () =>
    createDeltaFrame(
      state.aggregateFrame.frame,
      state.aggregateFrame.previousFrame,
    );
};
