import { revalidate, useLocation } from '@solidjs/router';
import { createEffect, ErrorBoundary, on, onCleanup, onMount } from 'solid-js';
import z from 'zod';
import { isChunkLoadError } from '#flib/lazyRoute';
import { onReconnect, reportRequestSuccess } from '#flib/network';
import { hasUnsavedChanges } from '#flib/unsavedChanges';
import {
  type ErrorConfig,
  errors,
  GenericErrorPage,
} from '#pages/GenericErrorPage';
import { jsonCodec } from '#shared/zod';

interface RouteErrorFallbackProps {
  error: Error;

  reset: () => void;
}

const AUTO_RELOAD_KEY = 'chunkErrorReloads';
const AUTO_RELOAD_LIMIT = 2;
const AUTO_RELOAD_WINDOW_MS = 300_000;
const CONNECTION_PROBE_INTERVAL_MS = 5000;

const AutoReloadTimes = jsonCodec(z.array(z.number()));

const chunkLoadErrorConfig: ErrorConfig = {
  message:
    'The page could not be loaded, it reloads once the connection is back',
};

let isReloading = false;

function trackAutoReload(): boolean {
  try {
    const now = Date.now();
    const stored = AutoReloadTimes.safeDecode(
      sessionStorage.getItem(AUTO_RELOAD_KEY) ?? '[]',
    );
    const recent = (stored.success ? stored.data : []).filter(
      (time) => now - time < AUTO_RELOAD_WINDOW_MS,
    );

    if (recent.length >= AUTO_RELOAD_LIMIT) return false;

    sessionStorage.setItem(
      AUTO_RELOAD_KEY,
      AutoReloadTimes.encode([...recent, now]),
    );
  } catch {}

  return true;
}

function reloadAfterReconnect(): void {
  if (isReloading || hasUnsavedChanges() || !trackAutoReload()) return;

  isReloading = true;
  window.location.reload();
}

function startConnectionProbe(): () => void {
  const intervalRef = setInterval(async () => {
    if (document.visibilityState !== 'visible') return;

    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (!response.ok) return;

      clearInterval(intervalRef);
      reportRequestSuccess();
      reloadAfterReconnect();
    } catch {}
  }, CONNECTION_PROBE_INTERVAL_MS);

  return () => clearInterval(intervalRef);
}

const RouteErrorFallback: Component<RouteErrorFallbackProps> = (props) => {
  const location = useLocation();

  const isChunkError = isChunkLoadError(props.error);

  const retry = () => {
    revalidate();
    props.reset();
  };

  const reload = () => window.location.reload();

  createEffect(
    on(
      () => location.pathname,
      () => props.reset(),
      { defer: true },
    ),
  );

  onMount(() => {
    onCleanup(onReconnect(isChunkError ? reloadAfterReconnect : retry));

    if (!isChunkError) return;

    onCleanup(startConnectionProbe());
  });

  return (
    <GenericErrorPage
      config={isChunkError ? chunkLoadErrorConfig : errors.internalError}
      error={props.error}
      reset={isChunkError ? reload : retry}
    />
  );
};

export const RouteErrorBoundary: ParentComponent = (props) => (
  <ErrorBoundary
    fallback={(error, reset) => (
      <RouteErrorFallback error={error} reset={reset} />
    )}
  >
    {props.children}
  </ErrorBoundary>
);
