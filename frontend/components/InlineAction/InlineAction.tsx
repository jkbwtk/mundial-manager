import { children, createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useModal, useModalActions } from '#providers/ModalProvider';
import style from './InlineAction.module.scss';

export type TriggerType = 'shortcut' | 'click';
export interface InlineActionProps {
  symbol: string;
  content?: string | undefined;
  onAction: (type: TriggerType) => void;
  disabledTriggers?: TriggerType[];
}

const ignoredTargets = isServer ? [] : [HTMLInputElement];

export const InlineAction: Component<InlineActionProps> = (props) => {
  const [, { isActive }] = useModal();
  const { isTop } = useModalActions();

  const [activated, setActivated] = createSignal(false);
  const content = children(() => props.content ?? props.symbol);

  let timeoutRef: undefined | ReturnType<typeof setTimeout>;

  const handleKeyPress = (ev: KeyboardEvent) => {
    for (const ignored of ignoredTargets) {
      if (ev.target instanceof ignored) {
        return;
      }
    }

    if (ev.key === props.symbol) {
      if (isActive() && isTop() === false) {
        return;
      }

      triggerAction('shortcut');
    }
  };

  const triggerAction = (type: TriggerType) => {
    const disabledTriggers = props.disabledTriggers ?? [];

    if (disabledTriggers.includes(type)) {
      return;
    }

    clearTimeout(timeoutRef);
    setActivated(true);
    timeoutRef = setTimeout(() => setActivated(false), 200);

    props.onAction(type);
  };

  onMount(() => {
    if (isServer === false) {
      document.addEventListener('keyup', handleKeyPress);

      onCleanup(() => {
        document.removeEventListener('keyup', handleKeyPress);
      });
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
      {content()}
    </button>
  );
};
