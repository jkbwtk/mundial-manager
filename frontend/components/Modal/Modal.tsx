import {
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js';
import { Widget, type WidgetPropsWithoutComponent } from '#components/Widget';
import { clamp } from '#shared/utils';
import style from './Modal.module.scss';

export type ModalProps = WidgetPropsWithoutComponent<'div'>;

export const Modal: Component<ModalProps> = (userProps) => {
  const [pickedProps, props] = splitProps(userProps, ['children']);

  const [isDragging, setIsDragging] = createSignal(false);

  // biome-ignore lint/style/useConst: yeah
  let modalRef = document.createElement('div');

  let offsetX = 0;
  let offsetY = 0;

  let startX = 0;
  let startY = 0;

  const clampOffset = (): { x: number; y: number } => {
    const box = modalRef.getBoundingClientRect();
    const parentbox = modalRef.parentElement!.getBoundingClientRect();

    console.log(parentbox);

    const clampedX = clamp(
      -((parentbox.width - box.width) / 2) + 30,
      (parentbox.width - box.width) / 2 - 30,
      offsetX,
    );
    const clampedY = clamp(
      -((parentbox.height - box.height) / 2) + 30,
      (parentbox.height - box.height) / 2 - 30,
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

    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('mousemove', onDrag);

    setTimeout(() => {
      setIsDragging(false);
    });
  };

  const onDragStart: JSX.DOMAttributes<HTMLDivElement>['onMouseDown'] = (
    ev,
  ) => {
    ev.preventDefault();

    const { x: clampedX, y: clampedY } = clampOffset();

    startX = ev.clientX - clampedX;
    startY = ev.clientY - clampedY;

    setIsDragging(true);

    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('mousemove', onDrag);
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
    <Widget
      {...props}
      ref={modalRef}
      onMouseDown={onDragStart}
      classList={{
        [props.class ?? '']: true,
        [style.modal]: true,

        ...(props.classList ?? {}),
      }}
    >
      {pickedProps.children}
    </Widget>
  );
};
