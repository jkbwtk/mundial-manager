import { For, type JSX, Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider } from '#components/Widget';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import style from './StatRow.module.scss';

export interface StatRowItem {
  value: JSX.Element;
  label: string;
  symbol?: SupportedMaterialSymbol;
}

export interface StatRowProps {
  items: StatRowItem[];
}

export const StatRow: Component<StatRowProps> = (props) => (
  <div class={style.container}>
    <For each={props.items}>
      {(item, index) => (
        <>
          <Show when={index() > 0}>
            <Divider
              direction="vertical"
              connect={0b00}
              class={style.divider}
            />
          </Show>

          <div class={style.stat}>
            <span class={style.value}>
              <Show when={item.symbol}>
                {(symbol) => (
                  <MaterialSymbol symbol={symbol()} color="primary" />
                )}
              </Show>

              {item.value}
            </span>

            <span class={style.label}>{item.label}</span>
          </div>
        </>
      )}
    </For>
  </div>
);
