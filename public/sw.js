// Service Worker for Tanya's Personal Assistant PWA
const CACHE_NAME = 'tanya-pa-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip Vite development resources and API calls
  if (url.pathname.startsWith('/@vite/') || 
      url.pathname.startsWith('/@react-refresh') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/api/') ||
      url.hostname === 'localhost' && (url.port === '8084' || url.port === '8080' || url.port === '8081' || url.port === '8082' || url.port === '8083')) {
    // Let Vite dev server handle these requests
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.error('Service Worker fetch error:', error);
        // Fallback to network request
        return fetch(event.request);
      })
  );
});

// Handle background sync for reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'reminder-sync') {
    console.log('Background sync for reminders');
    event.waitUntil(handleReminderSync());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Tanya\'s PA Reminder',
    body: 'You have a reminder!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'reminder-notification',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: {
          ...notificationData.data,
          ...data.data,
          reminderId: data.reminderId,
          url: data.url || '/'
        }
      };
    } catch (e) {
      // Fallback to text data
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    ...notificationData,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Reminder',
        icon: '/icon-192x192.png'
      },
      {
        action: 'complete',
        title: 'Mark Complete',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to reminders section
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'complete') {
    // Mark reminder as complete
    const reminderId = event.notification.data?.reminderId;
    if (reminderId) {
      event.waitUntil(
        fetch(`/api/reminders/${reminderId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(() => {
          console.log('Reminder marked as complete');
        }).catch(error => {
          console.error('Error marking reminder complete:', error);
        })
      );
    }
  } else if (event.action === 'close') {
    // Just close the notification
    console.log('Notification closed');
  } else {
    // Default action - open the app
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    console.log('Scheduling reminder:', event.data.reminder);
    scheduleReminder(event.data.reminder);
  }
});

// Schedule a reminder
function scheduleReminder(reminder) {
  // This would integrate with a background task scheduler
  // For now, we'll just log it
  console.log('Reminder scheduled:', reminder);
}

// Handle reminder sync
async function handleReminderSync() {
  try {
    // Sync reminders with the server
    const response = await fetch('/api/reminders/sync');
    if (response.ok) {
      console.log('Reminders synced successfully');
    }
  } catch (error) {
    console.error('Error syncing reminders:', error);
  }
}
