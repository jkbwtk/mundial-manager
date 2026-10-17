import { debounce } from '@solid-primitives/scheduled';
import { createSignal, type JSX, Show } from 'solid-js';
import { ButtonGroup } from '#components/ButtonGroup';
import { DesktopOnly } from '#components/DesktopOnly';
import { Dropdown } from '#components/Dropdown';
import { InlineAction } from '#components/InlineAction';
import { MobileOnly } from '#components/MobileOnly';
import { ProgressBar } from '#components/ProgresBar';
import { isMobile } from '#flib/utils';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import {
  type StatsPeriod,
  type StatsPeriodType,
  StatsPeriodTypes,
} from '#shared/types/api/stats';
import style from './StatsPeriodBar.module.scss';

export interface StatsPeriodBarProps {
  onPrefetch?: (period: StatsPeriod) => void;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

const SLIDER_COMMIT_DELAY_MS = 250;

const StatsPeriodTypeLabels: Record<StatsPeriodType, string> = {
  MATCH: 'Match',
  SESSION: 'Session',
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  SEASON: 'Season',
};

const typeOptions = StatsPeriodTypes.map((type) => ({
  label: StatsPeriodTypeLabels[type],
  value: type,
}));

export const StatsPeriodBar: Component<StatsPeriodBarProps> = (props) => {
  const [period, { setType, setIndex, getLabel, getPeriod }] = useStatsPeriod();

  const [draft, setDraft] = createSignal<number | null>(null);

  const shownIndex = () => draft() ?? period.index;

  const commitIndex = (index: number) => {
    setDraft(null);
    setIndex(index);
  };

  const commitDraft = debounce(commitIndex, SLIDER_COMMIT_DELAY_MS);

  const slide = (index: number) => {
    setDraft(index);
    commitDraft(index);
  };

  const step = (delta: number) => {
    commitDraft.clear();
    commitIndex(period.index + delta);
  };

  const prefetchNeighbors = () => {
    for (const index of [period.index - 1, period.index + 1]) {
      const neighbor = getPeriod(index);

      if (neighbor !== null) props.onPrefetch?.(neighbor);
    }
  };

  return (
    <div
      classList={{
        [style.container]: true,
        [style.mobile]: isMobile(),
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <MobileOnly>
        <Dropdown
          options={typeOptions}
          value={period.type}
          onChange={setType}
        />
      </MobileOnly>

      <DesktopOnly>
        <ButtonGroup
          options={typeOptions}
          value={period.type}
          onChange={setType}
          ariaLabel="Stats period"
        />
      </DesktopOnly>

      <span class={style.stepper} onPointerEnter={prefetchNeighbors}>
        <InlineAction
          content="<"
          symbol="ArrowLeft"
          onAction={() => step(-1)}
        />
        <span class={style.label}>{getLabel(shownIndex())}</span>
        <InlineAction
          content=">"
          symbol="ArrowRight"
          onAction={() => step(1)}
        />
      </span>

      <MobileOnly>
        <Show when={period.count > 0}>
          <span class={style.position}>
            {shownIndex() + 1}/{period.count}
          </span>
        </Show>
      </MobileOnly>

      <ProgressBar
        class={style.slider}
        min={0}
        max={Math.max(period.count - 1, 0)}
        value={shownIndex()}
        valueSetter={slide}
      />
    </div>
  );
};
