import style from './Christmas.module.scss';
import treeSvg from './tree.svg?raw';

export interface ChristmasTreeArtProps {
  lit: number;
}

export const CHRISTMAS_ORNAMENT_COUNT = 14;

export const ChristmasTreeArt: Component<ChristmasTreeArtProps> = (props) => (
  <div
    class={style.treeArt}
    data-lit={props.lit}
    aria-hidden="true"
    innerHTML={treeSvg}
  />
);
