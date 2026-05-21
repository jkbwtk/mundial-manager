import { useIsRouting } from '@solidjs/router';
import { batch, createEffect, createSignal, onCleanup, Show } from 'solid-js';
import style from './RouteLoadingBar.module.scss';

const SHOW_DELAY_MS = 100;
const FADE_OUT_MS = 220;
const SLOW_LOAD_CAP = 90;
const MIN_START = 0;
const SLOW_RATE = 1;
const FAST_RATE = 8;

type Phase = 'idle' | 'slow' | 'fast';

export const RouteLoadingBar: Component = () => {
  const isRouting = useIsRouting();
  const [progress, setProgress] = createSignal(0);
  const [visible, setVisible] = createSignal(false);
  const [fading, setFading] = createSignal(false);

  let phase: Phase = 'idle';
  let rafId: number | undefined;
  let lastTimestamp = 0;
  let showTimeout: ReturnType<typeof setTimeout> | undefined;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  const stopShow = () => {
    clearTimeout(showTimeout);
    showTimeout = undefined;
  };

  const stopHide = () => {
    clearTimeout(hideTimeout);
    hideTimeout = undefined;
  };

  const stopLoop = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }

    lastTimestamp = 0;
  };

  const startLoop = () => {
    if (rafId !== undefined) return;
    lastTimestamp = 0;
    rafId = requestAnimationFrame(tick);
  };

  const setPhase = (next: Phase) => {
    if (phase === next) return;

    const oldPhase = phase;
    phase = next;

    switch (phase) {
      case 'idle':
        stopLoop();
        break;

      case 'slow':
      case 'fast':
        if (oldPhase === 'idle') {
          startLoop();
        }
        break;
    }
  };

  const easedStep = (
    value: number,
    target: number,
    rate: number,
    deltaMs: number,
  ) => {
    const factor = 1 - Math.exp((-rate * deltaMs) / 1000);
    return value + (target - value) * factor;
  };

  const finishToHidden = () => {
    setFading(true);
    stopHide();

    hideTimeout = setTimeout(() => {
      batch(() => {
        setVisible(false);
        setFading(false);
        setProgress(0);
      });
    }, FADE_OUT_MS);
  };

  const tick = (time: number) => {
    if (phase === 'idle') {
      stopLoop();
      return;
    }

    if (lastTimestamp === 0) {
      lastTimestamp = time;
      rafId = requestAnimationFrame(tick);
      return;
    }

    const deltaMs = time - lastTimestamp;
    lastTimestamp = time;

    if (phase === 'slow') {
      setProgress((value) => {
        if (value >= SLOW_LOAD_CAP) return value;

        const next = easedStep(value, SLOW_LOAD_CAP, SLOW_RATE, deltaMs);
        return Math.min(SLOW_LOAD_CAP, next);
      });
    }

    if (phase === 'fast') {
      setProgress((value) => {
        if (value >= 100) return value;

        const next = easedStep(value, 100, FAST_RATE, deltaMs);
        if (next >= 99.9) {
          setPhase('idle');
          finishToHidden();
          return 100;
        }

        return next;
      });
    }

    rafId = requestAnimationFrame(tick);
  };

  const startRouting = () => {
    stopHide();
    stopShow();
    setFading(false);

    if (visible() === false) {
      showTimeout = setTimeout(() => {
        if (isRouting()) {
          setVisible(true);
        }
      }, SHOW_DELAY_MS);
    }

    setProgress((value) => {
      if (value <= 0 || value >= 100) return MIN_START;
      return Math.min(value, SLOW_LOAD_CAP);
    });

    setPhase('slow');
  };

  const finishRouting = () => {
    stopShow();

    if (visible() === false) {
      batch(() => {
        setPhase('idle');
        setProgress(0);
        setFading(false);
      });
      return;
    }

    setPhase('fast');
  };

  createEffect(() => {
    const routing = isRouting();
    routing ? startRouting() : finishRouting();
  });

  onCleanup(() => {
    stopShow();
    stopHide();
    stopLoop();
    setVisible(false);
  });

  return (
    <Show when={visible()}>
      <div
        classList={{
          [style.container]: true,
          [style.fading]: fading(),
        }}
        role="progressbar"
        aria-valuenow={Math.round(progress())}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div class={style.bar} style={{ '--progress': `${progress()}%` }} />
      </div>
    </Show>
  );
};
