import { createContext, createMemo, useContext } from 'solid-js';
import { useSeasonLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import {
  defaultStatsPeriodSearch,
  getStatsPeriod,
  StatsPeriodSearch,
} from '#flib/statsPeriod';
import { queryStatsPeriods } from '#flib/trpcCalls';
import {
  formatStatsMonthKey,
  formatStatsSessionKey,
  formatStatsWeekKey,
} from '#shared/stats/buckets';
import type { StatsPeriod, StatsPeriodType } from '#shared/types/api/stats';
import { clamp } from '#shared/utils';

export interface StatsPeriodContextState {
  type: StatsPeriodType;
  period: StatsPeriod;

  index: number;
  count: number;
}

export interface StatsPeriodContextActions {
  setType: (type: StatsPeriodType) => void;
  setIndex: (index: number) => void;
  getLabel: (index: number) => string;
  getPeriod: (index: number) => StatsPeriod | null;
}

export type StatsPeriodContextValue = [
  state: StatsPeriodContextState,
  actions: StatsPeriodContextActions,
];

const PENDING_LABEL = '…';

const StatsPeriodContext = createContext<StatsPeriodContextValue>([
  {
    type: defaultStatsPeriodSearch.period,
    period: getStatsPeriod(defaultStatsPeriodSearch),
    index: 0,
    count: 0,
  },
  {
    setType: () => {
      throw new Error('StatsPeriodContext: setType() called before provider');
    },
    setIndex: () => {
      throw new Error('StatsPeriodContext: setIndex() called before provider');
    },
    getLabel: () => PENDING_LABEL,
    getPeriod: () => null,
  },
]);

export const StatsPeriodProvider: ParentComponent = (props) => {
  const seasons = useSeasonLookup();

  const [search, , setSearch] = useSearchParamsState({
    schema: StatsPeriodSearch,
    defaultState: defaultStatsPeriodSearch,
  });

  const periods = createResilientAsync(
    () => search().period,
    queryStatsPeriods,
  );

  const shown = () => periods.latest ?? { type: search().period, keys: [] };
  const isShownCurrent = () => shown().type === search().period;

  const count = () => shown().keys.length;

  const index = createMemo((previous: number) => {
    if (!isShownCurrent()) return previous;

    const at = search().at;

    return at === '' ? count() - 1 : shown().keys.indexOf(at);
  }, -1);

  const getLabel = (index: number) => {
    const key = shown().keys[index];

    if (key === undefined) return PENDING_LABEL;

    switch (shown().type) {
      case 'MATCH':
        return `#${index + 1}`;
      case 'SESSION':
        return formatStatsSessionKey(key);
      case 'DAY':
        return key;
      case 'WEEK':
        return formatStatsWeekKey(key);
      case 'MONTH':
        return formatStatsMonthKey(key);
      case 'SEASON':
        return seasons.getLabel(key);
    }
  };

  const getPeriod = (index: number): StatsPeriod | null => {
    const key = shown().keys[index];

    return key === undefined ? null : { type: shown().type, key };
  };

  const setType = (type: StatsPeriodType) => {
    setSearch({ period: type, at: '' });
  };

  const setIndex = (next: number) => {
    const clamped = clamp(0, count() - 1, next);

    setSearch({
      period: shown().type,
      at: clamped >= count() - 1 ? '' : (shown().keys[clamped] ?? ''),
    });
  };

  const state: StatsPeriodContextState = {
    get type() {
      return search().period;
    },
    get period() {
      return getStatsPeriod(search());
    },
    get index() {
      return index();
    },
    get count() {
      return count();
    },
  };

  return (
    <StatsPeriodContext.Provider
      value={[state, { setType, setIndex, getLabel, getPeriod }]}
    >
      {props.children}
    </StatsPeriodContext.Provider>
  );
};

export const useStatsPeriod = (): StatsPeriodContextValue =>
  useContext(StatsPeriodContext);
