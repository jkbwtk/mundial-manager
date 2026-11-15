import { EdgeStrand } from '#components/EdgeStrand';
import { useTheme } from '#providers/ThemeProvider';
import style from './Christmas.module.scss';
import snowUrl from './snow.svg';

const SNOW_CAP_MIN_HEIGHT = 3;
const SNOW_CAP_MAX_HEIGHT = 10;

export const ChristmasSnowCap: Component = () => {
  const [state] = useTheme();

  return (
    <EdgeStrand
      class={style.snowCap}
      segment={snowUrl}
      spacing={56}
      height={
        SNOW_CAP_MIN_HEIGHT +
        (SNOW_CAP_MAX_HEIGHT - SNOW_CAP_MIN_HEIGHT) * state.progress
      }
    />
  );
};
