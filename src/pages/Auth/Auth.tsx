import { onMount } from 'solid-js';
import { isServer } from 'solid-js/web';

const Auth: Component = () => {
  onMount(() => {
    if (isServer === false) {
      const params = new URLSearchParams(location.search);
      const lifetime = 60 * 60 * 24 * 30;

      for (const [key, value] of params.entries()) {
        document.cookie = `${key}=${value}; max-age=${lifetime}; SameSite=Lax;`;
      }
    }
  });

  return <div />;
};

export default Auth;
