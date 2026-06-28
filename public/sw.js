self.addEventListener('fetch', function(event) {
  // Empty fetch handler makes the PWA installable
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Waktu untuk aktivitas berikutnya!',
    icon: '/icon.jpg',
    badge: '/icon.jpg',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Progress Tracker', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
