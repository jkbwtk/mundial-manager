import { MaterialSymbol } from '#components/MaterialSymbol';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import style from './Sidebar.module.scss';

export interface SidebarButtonProps {
  symbol: SupportedMaterialSymbol;
  label: string;

  onClick: () => void;
}

export const SidebarButton: Component<SidebarButtonProps> = (props) => (
  <button
    type="button"
    classList={{
      'no-style': true,
      [style.routeLink]: true,
      [style.actionButton]: true,
    }}
    onClick={() => props.onClick()}
  >
    <MaterialSymbol symbol={props.symbol} />
    <span> {props.label}</span>
  </button>
);
