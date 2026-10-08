import type { PathMatch, RouteDefinition } from '@solidjs/router';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { PermissionRequirement } from '#shared/permissions';

export interface RouteInfo {
  name: string;
  title?: string;
  icon?: SupportedMaterialSymbol;
  public?: boolean;
  permission?: PermissionRequirement;
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
