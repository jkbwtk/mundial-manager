import type { JSX } from 'solid-js';
import { ButtonGroup, type ButtonGroupOption } from '#components/ButtonGroup';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { ThemePreferenceLabels } from '#flib/themes';
import { type ThemePreference, ThemePreferenceEnum } from '#frontend/types';
import { useTheme } from '#providers/ThemeProvider';
import style from './ThemePicker.module.scss';

export interface ThemePickerProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

const themePickerOptions: DropdownOption<ThemePreference>[] = Object.values(
  ThemePreferenceEnum,
).map((preference) => ({
  label: ThemePreferenceLabels[preference],
  value: preference,
}));

const themeDecorationsOptions: ButtonGroupOption<boolean>[] = [
  { label: 'On', value: true },
  { label: 'Off', value: false },
];

export const ThemePicker: Component<ThemePickerProps> = (props) => {
  const [state, { setPreference, setDecorationsEnabled }] = useTheme();

  return (
    <div
      classList={{
        [style.themePicker]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <div class={style.row}>
        <span class={style.label}>Theme:</span>
        <Dropdown
          options={themePickerOptions}
          value={state.preference}
          onChange={setPreference}
          ariaLabel="Theme"
          anchor="middle"
        />
      </div>

      <div class={style.row}>
        <span class={style.label}>Effects:</span>
        <ButtonGroup
          options={themeDecorationsOptions}
          value={state.decorationsEnabled}
          onChange={setDecorationsEnabled}
          ariaLabel="Theme effects"
        />
      </div>
    </div>
  );
};
