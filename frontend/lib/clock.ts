import dayjs, { type Dayjs } from 'dayjs';
import {
  type Accessor,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import { isServer } from 'solid-js/web';

export type ClockUnit = 'second' | 'minute' | 'hour' | 'day';

export function createNow(unit: Accessor<ClockUnit>): Accessor<Dayjs> {
  const [now, setNow] = createSignal(dayjs());

  if (isServer) return now;

  createEffect(
    on(unit, (currentUnit) => {
      let timeoutRef: ReturnType<typeof setTimeout> | undefined;

      const tick = () => {
        const time = dayjs();

        setNow(time);

        clearTimeout(timeoutRef);
        timeoutRef = setTimeout(
          tick,
          time.startOf(currentUnit).add(1, currentUnit).diff(time),
        );
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') tick();
      };

      tick();

      document.addEventListener('visibilitychange', handleVisibilityChange);

      onCleanup(() => {
        clearTimeout(timeoutRef);
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      });
    }),
  );

  return now;
}
