import { isDev } from '#flib/utils';
import type { PushSubscriptionSave } from '#shared/types/api/pushSubscription';

type BrowserPushSubscription = Omit<PushSubscriptionSave, 'notificationTypes'>;

const IOSUserAgentRegex = /iPad|iPhone|iPod/;

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function hasApplicationServerKey(
  subscription: PushSubscription,
  publicKey: string,
): boolean {
  const current = subscription.options.applicationServerKey;

  if (current === null) return false;

  const expected = decodeBase64Url(publicKey);
  const actual = new Uint8Array(current);

  return (
    actual.length === expected.length &&
    actual.every((byte, index) => byte === expected[index])
  );
}

function toBrowserPushSubscription(
  subscription: PushSubscription,
): BrowserPushSubscription {
  const { keys } = subscription.toJSON();

  if (!keys?.p256dh || !keys.auth) {
    throw new Error('Push subscription is missing its keys');
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  };
}

export function isIOSDevice(): boolean {
  return (
    IOSUserAgentRegex.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  );
}

export function getPushSupport():
  | 'UNSUPPORTED'
  | 'INSTALL_REQUIRED'
  | 'IOS_OUTDATED'
  | 'DENIED'
  | 'AVAILABLE' {
  if (isIOSDevice() && !isStandalone()) return 'INSTALL_REQUIRED';

  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return isIOSDevice() ? 'IOS_OUTDATED' : 'UNSUPPORTED';
  }

  if (Notification.permission === 'denied') return 'DENIED';

  return 'AVAILABLE';
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(
    isDev() ? '/dev-sw.js?dev-sw' : '/sw.js',
    { type: isDev() ? 'module' : 'classic' },
  );

  return navigator.serviceWorker.ready;
}

export async function getBrowserPushSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<BrowserPushSubscription | null> {
  const subscription = await registration.pushManager.getSubscription();

  if (subscription === null || Notification.permission !== 'granted') {
    return null;
  }

  if (!hasApplicationServerKey(subscription, publicKey)) {
    await subscription.unsubscribe();

    return null;
  }

  return toBrowserPushSubscription(subscription);
}

export async function subscribeBrowserPush(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<BrowserPushSubscription> {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeBase64Url(publicKey),
  });

  return toBrowserPushSubscription(subscription);
}
