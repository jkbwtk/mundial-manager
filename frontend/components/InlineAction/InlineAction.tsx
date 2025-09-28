import { onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import style from './InlineAction.module.scss';

export interface InlineActionProps {
  symbol: string;
  onAction: (type: 'shortcut' | 'click') => void;
}

const ignoredTargets = [HTMLInputElement];

export const InlineAction: Component<InlineActionProps> = (props) => {
  const handleKeyPress = (ev: KeyboardEvent) => {
    for (const ignored of ignoredTargets) {
      if (ev.target instanceof ignored) {
        return;
      }
    }

    if (ev.key === props.symbol) {
      props.onAction('shortcut');
    }
  };

  onMount(() => {
    if (isServer === false) {
      document.addEventListener('keyup', handleKeyPress);
    }
  });

  onCleanup(() => {
    if (isServer === false) {
      document.removeEventListener('keyup', handleKeyPress);
    }
  });

  return (
    <button
      type="button"
      class={style.container}
      onPointerUp={() => props.onAction('click')}
    >
      {props.symbol}
    </button>
  );
};
