// Service Worker for SK Alert / ChronosIST Alarms & System Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the main window (e.g. trigger notification from SW context)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || '⏰ IST Alarm', {
      body: options?.body || 'Your scheduled IST time has arrived!',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/icon-192.png',
      tag: options?.tag || 'ist-alarm',
      vibrate: options?.vibrate || [400, 200, 400, 200, 800],
      requireInteraction: true,
      data: options?.data || { url: '/' }
    });
  }
});

// Handle notification click on Android / Mobile / Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing open tab if available
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open the app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
