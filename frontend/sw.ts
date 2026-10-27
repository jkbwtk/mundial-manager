/// <reference lib="webworker" />

import { PushNotificationPayload } from '#shared/types/api/pushNotification';

declare const self: ServiceWorkerGlobalScope;

const FALLBACK_NOTIFICATION = {
  title: 'Mundial Manager',
  body: 'Something happened in your league',
};

function readPushPayload(data: PushMessageData | null): unknown {
  try {
    return data?.json() ?? null;
  } catch {
    return null;
  }
}

async function openNavigateUrl(url: string): Promise<void> {
  const windows = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  const existing = windows.find((client) => client.url === url) ?? windows[0];

  if (existing === undefined) {
    await self.clients.openWindow(url);

    return;
  }

  await existing.focus();

  if (existing.url !== url) await existing.navigate(url);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('push', (ev) => {
  const payload = PushNotificationPayload.safeParse(readPushPayload(ev.data));

  // Safari revokes the subscription of a site whose push shows nothing
  const { title, navigate, ...options } = payload.success
    ? payload.data.notification
    : { ...FALLBACK_NOTIFICATION, navigate: self.registration.scope };

  ev.waitUntil(
    self.registration.showNotification(title, {
      ...options,
      icon: '/favicon.png',
      data: { navigate },
    }),
  );
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();

  const navigate: unknown = ev.notification.data?.navigate;

  if (typeof navigate !== 'string') return;

  ev.waitUntil(openNavigateUrl(navigate));
});
