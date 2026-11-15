import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useTheme } from '#providers/ThemeProvider';
import style from './ThemeLayer.module.scss';

export const ThemeLayer: Component = () => {
  const [state, { stopEffect }] = useTheme();

  return (
    <>
      <div class={style.container} aria-hidden="true">
        <For each={state.decorations?.layers ?? []}>
          {(layer) => <Dynamic component={layer} />}
        </For>
      </div>

      <For each={state.effects}>
        {(entry) => (
          <Dynamic
            component={entry.effect}
            origin={entry.origin}
            onDone={() => stopEffect(entry.id)}
          />
        )}
      </For>
    </>
  );
};
