import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DAY_MS } from '#shared/timeUtils';

dayjs.extend(isoWeek);

type Unit = 'workDay' | 'workDays';

declare module 'dayjs' {
  interface Dayjs {
    isWorkDay(): boolean;

    diff(
      date?: ConfigType,
      unit?: QUnitType | OpUnitType | Unit,
      float?: boolean,
    ): number;
  }
}

export default (
  _option: unknown,
  dayjsClass: typeof Dayjs,
  _dayjsFactory: typeof dayjs,
) => {
  dayjsClass.prototype.isWorkDay = function () {
    const dayOfWeek = this.isoWeekday();
    return dayOfWeek < 6;
  };

  const oldDiff = dayjsClass.prototype.diff;

  dayjsClass.prototype.diff = function (date, unit, float) {
    if (unit === 'workDay' || unit === 'workDays') {
      const that = dayjs.isDayjs(date) ? date : dayjs(date);

      const start = (this > that ? that : this).startOf('day');
      const goal = (this > that ? this : that).startOf('day');

      const days = Math.round(
        (Date.UTC(goal.year(), goal.month(), goal.date()) -
          Date.UTC(start.year(), start.month(), start.date())) /
          DAY_MS,
      );
      const startWeekday = start.isoWeekday();

      let count = Math.floor(days / 7) * 5;

      for (let offset = 1; offset <= days % 7; offset += 1) {
        if (((startWeekday + offset - 1) % 7) + 1 < 6) count += 1;
      }

      return this > that ? count : -count;
    }

    return oldDiff.call(this, date, unit, float);
  };
};
