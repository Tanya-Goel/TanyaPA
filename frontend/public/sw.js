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
      (url.hostname === 'localhost' && (url.port === '8084' || url.port === '8080' || url.port === '8081' || url.port === '8082' || url.port === '8083'))) {
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
          url: data.url || '/',
          voiceEnabled: data.voiceEnabled !== false,
          repeatCount: data.repeatCount || 1
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
        action: 'dismiss',
        title: 'Done',
        icon: '/icon-192x192.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 10m',
        icon: '/icon-192x192.png'
      },
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );

  // Trigger voice notification if enabled
  if (notificationData.data.voiceEnabled) {
    event.waitUntil(
      triggerVoiceNotification(notificationData.body, notificationData.data.repeatCount)
    );
  }
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
  } else if (event.action === 'snooze') {
    // Snooze reminder for 10 minutes
    const reminderId = event.notification.data?.reminderId;
    if (reminderId) {
      event.waitUntil(
        fetch(`/api/reminders/${reminderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            datetime: new Date(Date.now() + 10 * 60 * 1000).toISOString()
          })
        }).then(() => {
          console.log('Reminder snoozed for 10 minutes');
        }).catch(error => {
          console.error('Error snoozing reminder:', error);
        })
      );
    }
  } else if (event.action === 'dismiss' || event.action === 'complete') {
    // Dismiss reminder using the new dismiss endpoint
    const reminderId = event.notification.data?.reminderId;
    if (reminderId) {
      event.waitUntil(
        fetch(`/api/reminders/${reminderId}/dismiss`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            method: 'push'
          })
        }).then(() => {
          console.log('Reminder dismissed via push notification');
        }).catch(error => {
          console.error('Error dismissing reminder:', error);
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

// Trigger voice notification (limited in service worker)
async function triggerVoiceNotification(text, repeatCount = 1) {
  try {
    // Service workers have limited access to Web APIs
    // We'll send a message to the main thread to handle voice
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'VOICE_REMINDER',
        text: text,
        repeatCount: repeatCount
      });
    });
    console.log('Voice notification triggered for:', text);
  } catch (error) {
    console.error('Error triggering voice notification:', error);
  }
}
