import type {
  Component as SolidComponent,
  ParentComponent as SolidParentComponent,
} from 'solid-js';

declare global {
  // biome-ignore lint/complexity/noBannedTypes: Empty object
  type Component<P extends object = {}> = SolidComponent<P>;

  // biome-ignore lint/complexity/noBannedTypes: Empty object
  type ParentComponent<P extends object = {}> = SolidParentComponent<P>;
}
