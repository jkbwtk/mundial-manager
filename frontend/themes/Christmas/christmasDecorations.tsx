import { AmbientLight } from '#components/AmbientLight';
import { Bokeh } from '#components/Bokeh';
import { isMobile } from '#flib/utils';
import type { ThemeDecorations } from '#frontend/types';
import style from './Christmas.module.scss';
import { ChristmasHat } from './ChristmasHat';
import { CHRISTMAS_LIGHT_COLORS, ChristmasLights } from './ChristmasLights';
import { ChristmasSnowCap } from './ChristmasSnowCap';
import { ChristmasSnowfall } from './ChristmasSnowfall';
import { ChristmasTree } from './ChristmasTree';

export const christmasDecorations: ThemeDecorations = {
  layers: [
    () => (
      <AmbientLight
        lights={[
          // {
          //   x: '50%',
          //   y: '108%',
          //   size: '75vmax',
          //   color: '#ff8c3a',
          //   strength: 0.26,
          // },
          {
            x: '6%',
            y: '4%',
            size: '50vmax',
            color: '#9fc4ff',
            strength: 0.12,
          },
        ]}
        vignette={0.4}
      />
    ),
    () => <Bokeh colors={CHRISTMAS_LIGHT_COLORS} count={8} size={8} />,
    ChristmasSnowfall,
    () => (
      <ChristmasLights
        class={style.garland}
        count={isMobile() ? 16 : 48}
        spacing={isMobile() ? 30 : 48}
        size={isMobile() ? 7 : 12}
      />
    ),
  ],
  slots: {
    widget: ChristmasSnowCap,
    modal: () => (
      <ChristmasLights
        class={style.modalLights}
        count={24}
        spacing={34}
        size={7}
      />
    ),
    logo: ChristmasHat,
    sidebar: ChristmasTree,
  },
  spinnerFrames: ['·', '•', '●', '•'],
};
