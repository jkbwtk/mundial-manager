import { createMemo, Match, mergeProps, Show, Switch } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './DeltaDisplay.module.scss';

export type DeltaDisplayProps = {
  base: number | undefined;
  compared: number | undefined;
  displayBase?: boolean;
  displayCompared?: boolean;
  roundIntegers?: boolean;
  fractionDigits?: number;
  formatter?: (
    value: number | undefined,
    roundIntegers: boolean,
    fractionDigits: number,
  ) => string;
};

const round = (
  value: number | undefined,
  roundIntegers: boolean,
  fractionDigits: number,
): string => {
  if (value === undefined) return '';

  if (roundIntegers === false && value % 1 === 0) return value.toString();

  return value.toFixed(fractionDigits);
};

const defaultDeltaDisplayProps: RequiredDefaults<DeltaDisplayProps> = {
  displayBase: false,
  displayCompared: false,
  roundIntegers: false,
  fractionDigits: 2,
  formatter: round,
};

export const DeltaDisplay: Component<DeltaDisplayProps> = (userProps) => {
  const props = mergeProps(defaultDeltaDisplayProps, userProps);

  const delta = createMemo(() => props.base! - props.compared!);

  const formattedBase = () =>
    props.formatter(props.base, props.roundIntegers, props.fractionDigits);
  const formattedDelta = () =>
    props.formatter(
      Math.abs(delta()),
      props.roundIntegers,
      props.fractionDigits,
    );
  const formattedCompared = () =>
    props.formatter(props.compared, props.roundIntegers, props.fractionDigits);

  return (
    <>
      <Show when={props.displayBase && props.base !== undefined}>
        <span class={style.baseDisplay}>{formattedBase()}</span>
      </Show>

      <Show when={Number.isNaN(delta()) === false}>
        <span
          classList={{
            [style.positive]: delta() > 0,
            [style.negative]: delta() < 0,
          }}
        >
          <span class={style.deltaSymbol}>
            <Switch>
              <Match when={delta() === 0}>=</Match>
              <Match when={delta() > 0}>↑</Match>
              <Match when={delta() < 0}>↓</Match>
            </Switch>
          </span>

          {formattedDelta()}
        </span>
      </Show>

      <Show when={props.displayCompared && props.compared !== undefined}>
        <span class={style.comparedDisplay}>{formattedCompared()}</span>
      </Show>
    </>
  );
};
