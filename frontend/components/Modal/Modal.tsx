import {
  children,
  For,
  type JSX,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js';
import { Button } from '#components/Button';
import type { WidgetPropsWithoutComponent } from '#components/Widget';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useModalActions } from '#providers/ModalProvider';
import { clamp } from '#shared/utils';
import style from './Modal.module.scss';

export type ModalProps = WidgetPropsWithoutComponent<'div'>;

export const Modal: Component<ModalProps> = (userProps) => {
  const [props, modalProps] = splitProps(userProps, [
    'topLeftLabels',
    'topRightLabels',
    'bottomLeftLabels',
    'bottomRightLabels',
    'children',
    'class',
    'classList',
  ]);

  const [unit] = useConsoleUnitPrototype();
  const { closeModal } = useModalActions();

  const topLeftLabels = children(() => props.topLeftLabels);
  const topRightLabels = children(() => props.topRightLabels);

  const bottomLeftLabels = children(() => props.bottomLeftLabels);
  const bottomRightLabels = children(() => props.bottomRightLabels);

  // biome-ignore lint/style/useConst: yeah
  let modalRef: HTMLDivElement = null!;

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  const clampOffset = (): { x: number; y: number } => {
    const box = modalRef.getBoundingClientRect();
    const parentBox = modalRef.parentElement!.getBoundingClientRect();

    const clampedX = clamp(
      -((parentBox.width - box.width) / 2) + unit.unit.width * 3,
      (parentBox.width - box.width) / 2 - unit.unit.width * 3,
      offsetX,
    );
    const clampedY = clamp(
      -((parentBox.height - box.height) / 2) + unit.unit.height * 1,
      (parentBox.height - box.height) / 2 - unit.unit.height * 1,
      offsetY,
    );

    return { x: clampedX, y: clampedY };
  };

  const initializePosition = () => {
    setModalPosition(0, 0);
  };

  const updateModalPosition = () => {
    const { x: clampedX, y: clampedY } = clampOffset();

    setModalPosition(clampedX, clampedY);
  };

  const setModalPosition = (x: number, y: number) => {
    modalRef.style.setProperty('--modal-offset-x', `${x}px`);
    modalRef.style.setProperty('--modal-offset-y', `${y}px`);
  };

  const onDrag = (ev: MouseEvent) => {
    ev.preventDefault();

    offsetX = ev.clientX - startX;
    offsetY = ev.clientY - startY;

    updateModalPosition();
  };

  const onDragEnd = (ev: MouseEvent) => {
    ev.preventDefault();

    document.removeEventListener('pointerup', onDragEnd);
    document.removeEventListener('pointermove', onDrag);
  };

  const onDragStart: JSX.DOMAttributes<HTMLDivElement>['onPointerDown'] = (
    ev,
  ) => {
    ev.preventDefault();

    const { x: clampedX, y: clampedY } = clampOffset();

    startX = ev.clientX - clampedX;
    startY = ev.clientY - clampedY;

    document.addEventListener('pointerup', onDragEnd);
    document.addEventListener('pointermove', onDrag);
  };

  const handleResize = () => {
    updateModalPosition();
  };

  onMount(() => {
    initializePosition();
    window.addEventListener('resize', handleResize);
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });

  return (
    <div
      {...modalProps}
      ref={modalRef}
      classList={{
        [props.class ?? '']: true,
        [style.modal]: true,
      }}
    >
      {props.children}

      <div class={style.topBar} onPointerDown={onDragStart} />

      <div class={style.topLabels}>
        <div class={style.leftLabels}>
          <For each={topLeftLabels.toArray()}>
            {(label) => <div class={style.topLeftLabel}>{label}</div>}
          </For>
        </div>

        <div class={style.rightLabels}>
          <For each={topRightLabels.toArray()}>
            {(label) => <div class={style.topRightLabel}>{label}</div>}
          </For>

          <div class={style.topRightLabel}>
            <Button class={style.closeButton} onPointerUp={() => closeModal()}>
              X
            </Button>
          </div>
        </div>
      </div>

      <div class={style.bottomLabels}>
        <div class={style.leftLabels}>
          <For each={bottomLeftLabels.toArray()}>
            {(label) => (
              <div class={style.bottomLeftLabel}>
                <div class={style.preDecoratorBottom} />
                {label}
                <div class={style.postDecoratorBottom} />
              </div>
            )}
          </For>
        </div>

        <div class={style.rightLabels}>
          <For each={bottomRightLabels.toArray()}>
            {(label) => (
              <div class={style.bottomRightLabel}>
                <div class={style.preDecoratorBottom} />
                {label}
                <div class={style.postDecoratorBottom} />
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
