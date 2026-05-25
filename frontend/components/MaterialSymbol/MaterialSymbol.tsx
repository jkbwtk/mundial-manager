import { type JSX, mergeProps } from 'solid-js';
import {
  getMaterialSymbolGlyph,
  type SupportedMaterialSymbol,
} from '#flib/supportedMaterialSymbols';
import { quickSwitch, type RequiredDefaults } from '#shared/utils';

import style from './MaterialSymbol.module.scss';

export type SymbolColorType =
  | 'gray'
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'primary'
  | 'inherit';
export type SymbolHighlightColorType = SymbolColorType | 'none';

export type MaterialSymbolProps = {
  symbol: SupportedMaterialSymbol;
  color?: SymbolColorType;
  interactive?: boolean;
  highlightColor?: SymbolHighlightColorType;
  filled?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  active?: boolean;
};

export const defaultProps: RequiredDefaults<MaterialSymbolProps> = {
  color: 'inherit',
  interactive: false,
  highlightColor: 'none',
  filled: false,
  class: '',
  classList: {},
  active: false,
};

export const MaterialSymbol: Component<MaterialSymbolProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);
  const symbolGlyph = getMaterialSymbolGlyph(props.symbol);

  const colorClass = quickSwitch<string, SymbolColorType>(props.color, {
    gray: style.gray,
    red: style.red,
    green: style.green,
    blue: style.blue,
    yellow: style.yellow,
    primary: style.primary,
    inherit: style.inherit,
    default: style.inherit,
  });

  const highlightColorClass = quickSwitch<string, SymbolHighlightColorType>(
    props.highlightColor,
    {
      gray: style.grayHighlight,
      red: style.redHighlight,
      green: style.greenHighlight,
      blue: style.blueHighlight,
      yellow: style.yellowHighlight,
      primary: style.primaryHighlight,
      inherit: style.inherit,

      none: '__ms_no_h__',
      default: '__ms_no_h__',
    },
  );

  style.red;

  return (
    <span
      classList={{
        [style.materialSymbol]: true,
        [colorClass]: true,
        [style.medium]: true,
        [style.interactive]: props.interactive,
        [highlightColorClass]: props.interactive,
        [style.filled]: props.filled,
        [style.active]: props.active,
        [props.class]: true,

        ...props.classList,
      }}
    >
      {symbolGlyph}
    </span>
  );
};
