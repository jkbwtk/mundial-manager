import type { PathMatch, RouteDefinition } from '@solidjs/router';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';

export interface RouteInfo {
  name: string;
  title?: string;
  icon?: SupportedMaterialSymbol;
  public?: boolean;
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
