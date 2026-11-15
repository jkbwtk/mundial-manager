import { useTheme } from '#providers/ThemeProvider';
import style from './Christmas.module.scss';
import { CHRISTMAS_ORNAMENT_COUNT, ChristmasTreeArt } from './ChristmasArt';
import { ChristmasStars } from './ChristmasEffects';

export const ChristmasTree: Component = () => {
  const [state, { playEffect }] = useTheme();

  const litOrnaments = () =>
    1 + Math.floor(state.progress * (CHRISTMAS_ORNAMENT_COUNT - 1));

  return (
    <button
      type="button"
      class={style.tree}
      title={`${litOrnaments()} of ${CHRISTMAS_ORNAMENT_COUNT} ornaments lit`}
      aria-label="Advent Christmas tree"
      onClick={() => playEffect(ChristmasStars)}
    >
      <ChristmasTreeArt lit={litOrnaments()} />
    </button>
  );
};
