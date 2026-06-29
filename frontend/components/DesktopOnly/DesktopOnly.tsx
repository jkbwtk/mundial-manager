import { Show } from 'solid-js';
import { isMobile } from '#flib/utils';

export const DesktopOnly: ParentComponent = (props) => {
  return <Show when={isMobile() === false}>{props.children}</Show>;
};
