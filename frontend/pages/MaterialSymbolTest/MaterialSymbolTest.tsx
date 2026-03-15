import { For } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Widget } from '#components/Widget';
import { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';

export const MaterialSymbolTest: Component = () => {
  return (
    <Widget topLeftLabels="Material Symbol Test">
      <For each={SupportedMaterialSymbol}>
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
    </Widget>
  );
};

export default MaterialSymbolTest;
