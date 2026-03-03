import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

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
      const that = dayjs(date);

      const start = (this > that ? that : this).startOf('day');
      const goal = (this > that ? this : that).startOf('day');

      let current = start.add(1, 'day');
      let count = 0;

      while (!current.isAfter(goal)) {
        if (current.isWorkDay()) {
          count += 1;
        }

        current = current.add(1, 'day');
      }

      return this > that ? count : -count;
    }

    return oldDiff.call(this, date, unit, float);
  };
};
