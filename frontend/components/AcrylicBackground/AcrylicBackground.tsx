import { onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import background from '#assets/images/background.jpg?inline';
import styles from './AcrylicBackground.module.scss';

export const AcrylicBackground: Component = () => {
  let imgRef!: HTMLImageElement;
  let overlayRef!: HTMLDivElement;

  if (!isServer) {
    onMount(() => {
      const rebuild = () => {
        imgRef.style.display = 'none';
        overlayRef.style.display = 'none';

        void imgRef.offsetWidth;
        void overlayRef.offsetWidth;

        imgRef.style.display = '';
        overlayRef.style.display = '';
      };

      window.addEventListener('resize', rebuild);
      visualViewport?.addEventListener('resize', rebuild);

      onCleanup(() => {
        window.removeEventListener('resize', rebuild);
        visualViewport?.removeEventListener('resize', rebuild);
      });
    });
  }

  return (
    <>
      <img
        ref={imgRef}
        class={styles.acrylicBackground}
        alt=""
        src={background}
      />
      <div ref={overlayRef} class={styles.overlay}>
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
