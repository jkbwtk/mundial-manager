import { createEffect, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';

export interface AmbientLightSource {
  x: string;
  y: string;
  size: string;
  color: string;
  strength?: number;
}

export interface AmbientLightProps {
  lights: AmbientLightSource[];
  vignette?: number;
}

const AMBIENT_BACKDROP_PROPERTY = '--ambient-backdrop';

const ambientBackdrops = new Map<symbol, string>();

function formatAmbientLight(light: AmbientLightSource): string {
  const color = `color-mix(in srgb, ${light.color} calc(var(--ambient-intensity) * ${(light.strength ?? 0.5) * 100}%), transparent)`;

  return `radial-gradient(circle calc(${light.size} / 2) at ${light.x} ${light.y}, ${color} 0%, color-mix(in srgb, ${color} 40%, transparent) 50%, transparent 100%)`;
}

function syncAmbientBackdrop(): void {
  if (isServer) return;

  const backdrop = [...ambientBackdrops.values()].join(', ');
  const root = document.documentElement;

  if (backdrop === '') {
    root.style.removeProperty(AMBIENT_BACKDROP_PROPERTY);

    return;
  }

  root.style.setProperty(AMBIENT_BACKDROP_PROPERTY, backdrop);
}

export const AmbientLight: Component<AmbientLightProps> = (props) => {
  const key = Symbol('AmbientLight');

  const backdrop = () =>
    [
      ...(props.vignette
        ? [
            `radial-gradient(ellipse at center, transparent 45%, rgba(0, 0, 0, ${props.vignette}) 100%)`,
          ]
        : []),
      ...props.lights.map(formatAmbientLight),
    ].join(', ');

  createEffect(() => {
    ambientBackdrops.set(key, backdrop());
    syncAmbientBackdrop();
  });

  onCleanup(() => {
    ambientBackdrops.delete(key);
    syncAmbientBackdrop();
  });

  return null;
};
