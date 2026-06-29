import { Show } from 'solid-js';
import { isMobile } from '#flib/utils';

export const MobileOnly: ParentComponent = (props) => {
  return <Show when={isMobile()}>{props.children}</Show>;
};
