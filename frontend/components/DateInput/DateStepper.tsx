import { createEffect, createSignal, For, on, splitProps } from 'solid-js';
import { Button } from '#components/Button';
import { DateInput, type DateInputProps } from './DateInput';
import style from './DateInput.module.scss';

export type DateStepperProps = DateInputProps & {
  steps: number[];
};

export function formatDateStep(step: number): string {
  const sign = step < 0 ? '-' : '+';
  const absolute = Math.abs(step);

  const units: [number, string][] = [
    [86_400_000, 'd'],
    [3_600_000, 'h'],
    [60_000, 'm'],
  ];

  for (const [size, unit] of units) {
    if (absolute >= size) return `${sign}${absolute / size}${unit}`;
  }

  return `${sign}${absolute / 1000}s`;
}

export const DateStepper: Component<DateStepperProps> = (props) => {
  const [local, dateProps] = splitProps(props, ['steps', 'value', 'onInput']);

  const [value, setValue] = createSignal<Date | null>(local.value ?? null, {
    equals: (a, b) => a?.getTime() === b?.getTime(),
  });

  createEffect(
    on(
      () => local.value,
      (newValue) => setValue(newValue ?? null),
      { defer: true },
    ),
  );

  const handleInput = (date: Date | null) => {
    setValue(date);
    local.onInput?.(date);
  };

  const step = (offset: number) => {
    const current = value();
    if (current === null || dateProps.disabled) return;

    setValue(new Date(current.getTime() + offset));
  };

  return (
    <span class={style.dateStepper}>
      <DateInput {...dateProps} value={value()} onInput={handleInput} />

      <span class={style.steps}>
        <For each={local.steps}>
          {(offset) => (
            <Button
              type="button"
              severity="secondary"
              padding={0}
              disabled={dateProps.disabled || value() === null}
              onPointerUp={() => step(offset)}
            >
              {formatDateStep(offset)}
            </Button>
          )}
        </For>
      </span>
    </span>
  );
};
