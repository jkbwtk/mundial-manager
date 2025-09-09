import { A, type RouteDefinition } from '@solidjs/router';
import { For } from 'solid-js';
import { Directory, type TreeNode } from '#components/FileTree';
import { Widget } from '#components/Widget';
import { arrayFrom } from '#shared/utils';
import { routes } from '../../routes';
import style from './RouteMap.module.scss';

const RouteMap: Component = () => {
  const mapRoutes = (route: RouteDefinition): TreeNode => {
    const name = route.info?.title ?? route.path;

    const children = route.children
      ? arrayFrom(route.children).map(mapRoutes)
      : null;

    return {
      name,
      children,
    };
  };

  const routeTree: TreeNode = {
    name: 'routes',
    children: routes.map(mapRoutes),
  };

  const flatRoutes = routes
    .flatMap((route) => [
      route,
      ...arrayFrom(route.children ?? []).map((child) => ({
        ...child,
        path: (route.path === '/' ? '' : route.path) + (child.path ?? ''),
      })),
    ])
    .filter((route) => route.component);

  return (
    <div>
      <Widget title="Route List" class={style.container}>
        <For each={flatRoutes}>
          {(route, index) => (
            <div>
              <strong>{index() + 1}</strong>:{' '}
              <A href={route.path}>{route.info?.title ?? route.path}</A>
            </div>
          )}
        </For>
      </Widget>

      <Widget title="Route Map" class={style.container}>
        <Directory node={routeTree} levels={[]} parentNames={[]} last={true} />
      </Widget>
    </div>
  );
};

export default RouteMap;
