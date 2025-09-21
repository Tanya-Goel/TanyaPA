// Push Notification Service for Tanya's Personal Assistant
class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  // Initialize service worker and push notifications
  async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');

      // Initialize push notifications
      await this.initializePushNotifications();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Initialize push notifications
  async initializePushNotifications(): Promise<void> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return;
    }

    try {
      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.log('Push messaging not supported');
        return;
      }

      // Check current subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Request permission and subscribe
        await this.requestPermissionAndSubscribe();
      } else {
        console.log('Push subscription already exists');
        // Send subscription to server
        await this.sendSubscriptionToServer(this.subscription);
      }
    } catch (error) {
      console.error('Push notification initialization failed:', error);
    }
  }

  // Request permission and subscribe to push notifications
  async requestPermissionAndSubscribe(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'denied') {
        throw new Error('Notification permission was denied. Please enable notifications in your browser settings.');
      }
      
      if (permission !== 'granted') {
        console.log('Notification permission not granted:', permission);
        return false;
      }

      // Subscribe to push notifications
      this.subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BPlinQJGEEtxEVkwoofywLGCuQxpJRFzzPmGGQocRnnJjBu5fsCzR-cApWCQlKp7IQ4Y5QywqcI5B4bmiAhop28'
        )
      });

      console.log('Push subscription created:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Push subscription sent to server successfully');
      } else {
        console.error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const result = await this.subscription.unsubscribe();
        if (result) {
          this.subscription = null;
          console.log('Push subscription removed');
          
          // Notify server
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: this.subscription?.endpoint
            })
          });
        }
        return result;
      }
      return false;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if user has granted permission
  async hasPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  // Get current subscription
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (for testing)
  async showLocalNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return;
    }

    try {
      await this.registration.showNotification(title, {
        ...options,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [100, 50, 100]
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
