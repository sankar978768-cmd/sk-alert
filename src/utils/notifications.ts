/**
 * Multi-Platform Notification Subsystem for SK Alert.
 * Supports:
 * 1. Native Android APK Bridge (window.AndroidNotificationBridge) via Android NotificationManager & AlarmManager
 * 2. Mobile Browser / PWA Service Worker (ServiceWorkerRegistration.showNotification)
 * 3. Desktop Web Notifications API
 */

interface AndroidBridge {
  hasPermission: () => boolean;
  requestPermission: () => void;
  postNotification: (title: string, message: string, tag: string) => boolean;
  vibrate: (milliseconds: number) => void;
  scheduleAlarm: (id: number, title: string, message: string, triggerAtMillis: number) => boolean;
  cancelAlarm: (id: number) => void;
}

function getAndroidBridge(): AndroidBridge | null {
  if (typeof window !== 'undefined' && (window as unknown as { AndroidNotificationBridge?: AndroidBridge }).AndroidNotificationBridge) {
    return (window as unknown as { AndroidNotificationBridge: AndroidBridge }).AndroidNotificationBridge;
  }
  return null;
}

// Polyfill window.Notification for Android WebView if native bridge exists
if (typeof window !== 'undefined') {
  const bridge = getAndroidBridge();
  if (bridge && typeof window.Notification === 'undefined') {
    const activeBridge = bridge;
    // Inject polyfill so all standard web checks pass cleanly inside Android WebView
    (window as unknown as { Notification: unknown }).Notification = class AndroidNotificationPolyfill {
      static get permission(): NotificationPermission {
        try {
          return activeBridge.hasPermission() ? 'granted' : 'default';
        } catch {
          return 'granted';
        }
      }
      static requestPermission(): Promise<NotificationPermission> {
        try {
          activeBridge.requestPermission();
          return Promise.resolve(activeBridge.hasPermission() ? 'granted' : 'default');
        } catch {
          return Promise.resolve('granted');
        }
      }
      constructor(title: string, options?: NotificationOptions) {
        activeBridge.postNotification(title, options?.body || '', options?.tag || 'sk-alert');
      }
    };
  }
}

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) return existing;
        return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        console.warn('Failed to register service worker:', err);
        return null;
      }
    })();
  }

  return swRegistrationPromise;
}

// Automatically register SW on load in client context
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    getOrRegisterServiceWorker().catch(() => {});
  });
}

/**
 * Check current notification permission across Native Android & Web
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      return bridge.hasPermission() ? 'granted' : 'default';
    } catch {
      return 'granted';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Request notification permissions and activate Android notification channel
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      bridge.requestPermission();
      // Send activation test signal immediately
      bridge.postNotification(
        '🔔 SK Alert Notifications Active',
        'IST Alarms and time alerts are now enabled on this device.',
        'sk-alert-activation'
      );
      return bridge.hasPermission() ? 'granted' : 'default';
    } catch (err) {
      console.warn('Native bridge requestPermission error:', err);
      return 'granted';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    // 1. Ensure service worker is registered
    await getOrRegisterServiceWorker();

    // 2. Request browser permission
    const permission = await Notification.requestPermission();

    // 3. If granted, immediately send a test notification to register the Android notification channel
    if (permission === 'granted') {
      await triggerSystemNotification(
        '🔔 SK Alert Notifications Active',
        'IST Alarms and time alerts are now enabled on this device.',
        'sk-alert-activation'
      );
    }

    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission || 'denied';
  }
}

/**
 * Triggers a system notification.
 * Dispatches via Native Android Bridge when running as APK,
 * or ServiceWorker / Web Notifications when running on Web / PWA.
 */
export async function triggerSystemNotification(
  title: string,
  body: string,
  tag = 'ist-alarm'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Check Native Android Bridge first (For Cordova APK)
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      bridge.vibrate(800);
      return bridge.postNotification(title, body, tag);
    } catch (bridgeErr) {
      console.warn('Native bridge postNotification error:', bridgeErr);
    }
  }

  // 2. Mobile Hardware Vibration
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800]);
    } catch {
      // Ignore vibration error
    }
  }

  // 3. Check Web permission
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `${tag}-${Date.now()}`,
    requireInteraction: true,
    vibrate: [400, 200, 400, 200, 800],
    data: { url: window.location.href }
  };

  // 4. Try Service Worker first (Required on Android PWA & Chrome Android)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await getOrRegisterServiceWorker();
      if (reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('SW showNotification error, falling back:', swErr);
    }
  }

  // 5. Desktop window.Notification fallback
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (err) {
    console.warn('Desktop Notification fallback failed:', err);
    return false;
  }
}

/**
 * Schedule hardware AlarmManager alarm when running in Android APK
 */
export function scheduleNativeDeviceAlarm(id: number, title: string, message: string, triggerAtMillis: number): boolean {
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      return bridge.scheduleAlarm(id, title, message, triggerAtMillis);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Cancel hardware AlarmManager alarm when running in Android APK
 */
export function cancelNativeDeviceAlarm(id: number): void {
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      bridge.cancelAlarm(id);
    } catch {
      // Ignore
    }
  }
}

/**
 * Dedicated test function to send a real sample alert to the user's Android phone
 */
export async function sendTestNotificationToDevice(): Promise<{ success: boolean; message: string }> {
  const bridge = getAndroidBridge();
  if (bridge) {
    try {
      bridge.requestPermission();
      const ok = bridge.postNotification(
        '⏰ SK Alert: Test Notification',
        'Test signal received! Alarms and IST notifications will sound and pop up on your phone.',
        'test-alert'
      );
      return {
        success: ok,
        message: 'Native test notification sent to your Android status bar and lock screen!'
      };
    } catch (err) {
      return { success: false, message: `Native error: ${String(err)}` };
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, message: 'Notifications are not supported on this device/browser.' };
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was denied. Please allow notifications in your browser settings.'
      };
    }
  }

  const success = await triggerSystemNotification(
    '⏰ SK Alert: Test Notification',
    'Test signal received! Alarms and IST notifications will sound and pop up on your phone.',
    'test-alert'
  );

  return {
    success,
    message: success
      ? 'Test notification sent to your device! Check your status bar and notifications.'
      : 'Could not deliver notification. Check your browser notification settings.'
  };
}
