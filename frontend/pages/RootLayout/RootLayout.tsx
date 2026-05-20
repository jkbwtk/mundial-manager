import { useCurrentMatches } from '@solidjs/router';
import { createEffect, createMemo } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useSSRUtils } from '#providers/SSRUtilsProvider';

export const RootLayout: ParentComponent = (props) => {
  const location = useCurrentMatches();
  const [, { setTitle }] = useSSRUtils();

  const title = createMemo(
    () => location().at(-1)?.route.info?.title ?? 'Mundial Manager',
  );

  if (isServer) {
    setTitle(title());
  }

  createEffect(() => {
    document.title = title();
  });

  return <>{props.children}</>;
};
