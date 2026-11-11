/**
 * Web Browser Notifications, Android Service Worker & Vibration Helpers
 */

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

// Automatically register SW on module load in client context
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    getOrRegisterServiceWorker().catch(() => {});
  });
}

/**
 * Request notification permissions and activate Android notification channel
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    // 1. Ensure service worker is registered
    const reg = await getOrRegisterServiceWorker();

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

export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Triggers a system notification.
 * On Android / mobile browsers, it uses ServiceWorkerRegistration.showNotification()
 * which is REQUIRED by Android to show notifications and enable system settings.
 */
export async function triggerSystemNotification(
  title: string,
  body: string,
  tag = 'ist-alarm'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Mobile Hardware Vibration
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800]);
    } catch {
      // Ignore vibration error
    }
  }

  // 2. Check permission
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

  // 3. Try Service Worker first (Required on Android PWA & Chrome Android)
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

  // 4. Desktop window.Notification fallback
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
 * Dedicated test function to send a real sample alert to the user's Android phone
 */
export async function sendTestNotificationToDevice(): Promise<{ success: boolean; message: string }> {
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
