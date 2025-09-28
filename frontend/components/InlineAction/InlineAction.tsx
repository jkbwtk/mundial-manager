import { createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import style from './InlineAction.module.scss';

export type TriggerType = 'shortcut' | 'click';
export interface InlineActionProps {
  symbol: string;
  onAction: (type: TriggerType) => void;
}

const ignoredTargets = isServer ? [] : [HTMLInputElement];

export const InlineAction: Component<InlineActionProps> = (props) => {
  const [activated, setActivated] = createSignal(false);

  let timeoutRef: undefined | ReturnType<typeof setTimeout>;

  const handleKeyPress = (ev: KeyboardEvent) => {
    for (const ignored of ignoredTargets) {
      if (ev.target instanceof ignored) {
        return;
      }
    }

    if (ev.key === props.symbol) {
      triggerAction('shortcut');
    }
  };

  const triggerAction = (type: TriggerType) => {
    clearTimeout(timeoutRef);
    setActivated(true);
    timeoutRef = setTimeout(() => setActivated(false), 200);

    props.onAction(type);
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
      onPointerUp={() => triggerAction('click')}
      classList={{
        [style.container]: true,
        [style.activated]: activated(),
      }}
    >
      {props.symbol}
    </button>
  );
};
