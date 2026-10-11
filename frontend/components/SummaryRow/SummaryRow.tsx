import { For, type JSX, Show } from 'solid-js';
import { DesktopOnly } from '#components/DesktopOnly';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider } from '#components/Widget';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import style from './SummaryRow.module.scss';

export interface SummaryRowItem {
  symbol: SupportedMaterialSymbol;
  value: JSX.Element;
}

export interface SummaryRowProps {
  items: SummaryRowItem[];
}

export const SummaryRow: Component<SummaryRowProps> = (props) => (
  <div class={style.container}>
    <For each={props.items}>
      {(item, index) => (
        <>
          <Show when={index() > 0}>
            <DesktopOnly>
              <Divider
                direction="vertical"
                connect={0b00}
                class={style.divider}
              />
            </DesktopOnly>
          </Show>

          <span class={style.item}>
            <MaterialSymbol symbol={item.symbol} color="primary" />
            <strong>{item.value}</strong>
          </span>
        </>
      )}
    </For>
  </div>
);
