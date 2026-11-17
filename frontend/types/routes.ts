import type { Params, PathMatch, RouteDefinition } from '@solidjs/router';
import type { SupportedMaterialSymbol } from '#shared/materialSymbols';
import type { PermissionRequirement } from '#shared/permissions';

export interface RouteCrumb {
  name: string;
  href: string;
}

export interface RouteInfo {
  name: string;
  title?: string;
  icon?: SupportedMaterialSymbol;
  public?: boolean;
  permission?: PermissionRequirement;
  crumbs?: (params: Params) => RouteCrumb[];
}

export interface ExtendedRouteDefinition<
  S extends string | string[] = string,
  T = unknown,
> extends Omit<RouteDefinition<S, T>, 'info' | 'children'> {
  info: RouteInfo;
  children?: ExtendedRouteDefinition[];
}

export interface ExtendedRouteMatch extends PathMatch {
  route: ExtendedRouteDefinition;
}
