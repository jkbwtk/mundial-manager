import { DriftLayer } from '#components/DriftLayer';
import { useTheme } from '#providers/ThemeProvider';
import style from './Christmas.module.scss';

export const ChristmasSnowfall: Component = () => {
  const [state] = useTheme();

  return (
    <>
      <DriftLayer
        color="#ffffff"
        count={Math.round(40 + 60 * state.progress)}
        size={5}
        front={0.25}
      />
      <DriftLayer
        color="#ffffff"
        particleClass={style.flake}
        spin={360}
        count={Math.round(6 + 10 * state.progress)}
        duration={16}
        size={14}
        front={0.5}
      />
    </>
  );
};
