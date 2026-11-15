import variables from '#styles/variables.module.scss';

const AMBIENT_FRAME_MS = Number.parseFloat(variables.ambientFrame);

export function snapToAmbientFrame(ms: number, frames = 1): number {
  const step = AMBIENT_FRAME_MS * frames;

  return Math.round(ms / step) * step;
}

export function getAmbientSteps(durationMs: number, frames = 1): string {
  return `steps(${Math.max(1, Math.round(durationMs / (AMBIENT_FRAME_MS * frames)))})`;
}
