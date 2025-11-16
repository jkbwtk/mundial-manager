import { A } from '@solidjs/router';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import style from './MundialCalculatorLink.module.scss';

const VISIBILITY_THRESHOLD = 100;

export const MundialCalculatorLink: Component = () => {
  const [hidden, setHidden] = createSignal(false);

  // biome-ignore lint/style/useConst: yeah
  let ref: HTMLAnchorElement = null!;

  const handleScroll = () => {
    const parent = ref.parentElement;

    if (parent === null) return;

    const rect = parent.getBoundingClientRect();

    const hidden = rect.top < -VISIBILITY_THRESHOLD;
    setHidden(hidden);
  };

  onMount(() => {
    if (isServer === false) {
      document.addEventListener('scroll', handleScroll);
    }
  });

  onCleanup(() => {
    if (isServer === false) {
      document.removeEventListener('scroll', handleScroll);
    }
  });

  return (
    <A
      ref={ref}
      classList={{
        [style.container]: true,
        [style.hidden]: hidden(),
        'no-style': true,
      }}
      href="/mundial-calculator"
    >
      +
    </A>
  );
};
