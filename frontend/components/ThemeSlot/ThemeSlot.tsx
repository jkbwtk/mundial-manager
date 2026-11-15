import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { ThemeSlotName } from '#frontend/types';
import { useTheme } from '#providers/ThemeProvider';

export interface ThemeSlotProps {
  name: ThemeSlotName;
}

export const ThemeSlot: ParentComponent<ThemeSlotProps> = (props) => {
  const [state] = useTheme();

  const slot = () => state.decorations?.slots?.[props.name];

  return (
    <Show when={slot()} fallback={props.children}>
      {(slot) => <Dynamic component={slot()}>{props.children}</Dynamic>}
    </Show>
  );
};
