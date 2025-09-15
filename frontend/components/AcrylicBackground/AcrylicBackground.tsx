import background from '#assets/images/background.png?inline';
import styles from './AcrylicBackground.module.scss';

export const AcrylicBackground: Component = () => {
  return (
    <>
      <img class={styles.acrylicBackground} alt="" src={background} />
      <div class={styles.overlay}>
        <svg
          class={styles.noisePattern}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <filter id="acrylicNoise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="1"
                seed="1"
              />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            filter="url(#acrylicNoise)"
            fill="white"
          />
        </svg>
      </div>
    </>
  );
};
