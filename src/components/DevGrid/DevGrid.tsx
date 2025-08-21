import { Show, createSignal, onCleanup, onMount } from 'solid-js';

import { isServer } from 'solid-js/web';
import style from './DevGrid.module.scss';

export const DevGrid: Component = () => {
  const [visible, setVisible] = createSignal(true);

  const handleEvent = (ev: KeyboardEvent) => {
    if (ev.key.toLowerCase() === 'g' && ev.shiftKey) {
      ev.preventDefault();
      setVisible((s) => !s);
    }
  };

  onMount(() => {
    if (!isServer) {
      document.addEventListener('keypress', handleEvent);
    }
  });

  onCleanup(() => {
    if (!isServer) {
      document.removeEventListener('keypress', handleEvent);
    }
  });

  return (
    <Show when={visible()}>
      <div class={style.devGrid} />
    </Show>
  );
};
