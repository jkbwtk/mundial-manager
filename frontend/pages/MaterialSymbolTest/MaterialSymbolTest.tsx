import { For } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';

import { SupportedMaterialSymbols } from '#flib/supportedMaterialSymbols';
import style from './MaterialSymbolTest.module.scss';

export const MaterialSymbolTest: Component = () => {
  return (
    <div class={style.container}>
      <For each={SupportedMaterialSymbols}>
        {(symbol) => (
          <div>
            {symbol}
            {' -> '}
            <MaterialSymbol symbol={symbol} color="inherit" />
            <MaterialSymbol symbol={symbol} color="primary" />
            <MaterialSymbol symbol={symbol} color="gray" />
            <MaterialSymbol symbol={symbol} color="blue" />
            <MaterialSymbol symbol={symbol} color="green" />
            <MaterialSymbol symbol={symbol} color="red" />
            <MaterialSymbol symbol={symbol} color="yellow" />
          </div>
        )}
      </For>
    </div>
  );
};

export default MaterialSymbolTest;
