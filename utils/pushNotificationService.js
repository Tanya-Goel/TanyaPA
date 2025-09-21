// Backend Push Notification Service
import webpush from 'web-push';
import databaseService from './databaseService.js';

class PushNotificationService {
  constructor() {
    this.initializeVapidKeys();
  }

  // Initialize VAPID keys
  initializeVapidKeys() {
    // In production, these should be environment variables
    const vapidKeys = {
      publicKey: 'BPlinQJGEEtxEVkwoofywLGCuQxpJRFzzPmGGQocRnnJjBu5fsCzR-cApWCQlKp7IQ4Y5QywqcI5B4bmiAhop28',
      privateKey: 'Hxcud2_yMTKKNgQIMcMf5KZqztxRaC_zirFf4zhknCc'
    };

    webpush.setVapidDetails(
      'mailto:tanya@example.com', // Replace with your email
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('🔔 Push notification service initialized');
  }

  // Store push subscription
  async storeSubscription(subscription, userAgent, timestamp) {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent,
        timestamp,
        createdAt: new Date(),
        isActive: true
      };

      if (databaseService.isMongoConnected) {
        // Store in MongoDB
        const PushSubscription = (await import('../models/PushSubscription.js')).default;
        await PushSubscription.findOneAndUpdate(
          { endpoint: subscription.endpoint },
          subscriptionData,
          { upsert: true, new: true }
        );
      } else {
        // Store in memory
        if (!databaseService.inMemoryStorage.pushSubscriptions) {
          databaseService.inMemoryStorage.pushSubscriptions = [];
        }
        
        const existingIndex = databaseService.inMemoryStorage.pushSubscriptions.findIndex(
          sub => sub.endpoint === subscription.endpoint
        );
        
        if (existingIndex >= 0) {
          databaseService.inMemoryStorage.pushSubscriptions[existingIndex] = subscriptionData;
        } else {
          databaseService.inMemoryStorage.pushSubscriptions.push(subscriptionData);
        }
      }

      console.log('📱 Push subscription stored:', subscription.endpoint);
      return true;
    } catch (error) {
      console.error('❌ Error storing push subscription:', error);
      return false;
    }
  }

  // Remove push subscription
  async removeSubscription(endpoint) {
    try {
      if (databaseService.isMongoConnected) {
        const PushSubscription = (await import('../models/PushSubscription.js')).default;
        await PushSubscription.findOneAndDelete({ endpoint });
      } else {
        if (databaseService.inMemoryStorage.pushSubscriptions) {
          databaseService.inMemoryStorage.pushSubscriptions = 
            databaseService.inMemoryStorage.pushSubscriptions.filter(
              sub => sub.endpoint !== endpoint
            );
        }
      }

      console.log('📱 Push subscription removed:', endpoint);
      return true;
    } catch (error) {
      console.error('❌ Error removing push subscription:', error);
      return false;
    }
  }

  // Get all active subscriptions
  async getActiveSubscriptions() {
    try {
      if (databaseService.isMongoConnected) {
        const PushSubscription = (await import('../models/PushSubscription.js')).default;
        return await PushSubscription.find({ isActive: true });
      } else {
        return databaseService.inMemoryStorage.pushSubscriptions?.filter(
          sub => sub.isActive
        ) || [];
      }
    } catch (error) {
      console.error('❌ Error getting active subscriptions:', error);
      return [];
    }
  }

  // Send push notification to all subscribers
  async sendNotificationToAll(title, body, data = {}) {
    try {
      const subscriptions = await this.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        console.log('📱 No active push subscriptions found');
        return { sent: 0, failed: 0 };
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'reminder-notification',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });

      let sent = 0;
      let failed = 0;

      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            payload
          );
          sent++;
          console.log('📱 Push notification sent to:', subscription.endpoint);
        } catch (error) {
          failed++;
          console.error('❌ Failed to send push notification:', error);
          
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.removeSubscription(subscription.endpoint);
          }
        }
      });

      await Promise.all(promises);

      console.log(`📱 Push notifications sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('❌ Error sending push notifications:', error);
      return { sent: 0, failed: 0 };
    }
  }

  // Send reminder notification with action buttons
  async sendReminderNotification(reminder) {
    const title = '🔔 Reminder Alert';
    const body = reminder.text;
    const data = {
      reminderId: reminder._id || reminder.id,
      type: 'reminder',
      url: '/',
      actions: [
        {
          action: 'dismiss',
          title: 'Done',
          icon: '/icon-72x72.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 10min',
          icon: '/icon-72x72.png'
        }
      ]
    };

    return await this.sendNotificationToAll(title, body, data);
  }

  // Test push notification
  async sendTestNotification() {
    const title = '🧪 Test Notification';
    const body = 'This is a test push notification from Tanya\'s PA';
    const data = {
      type: 'test',
      url: '/'
    };

    return await this.sendNotificationToAll(title, body, data);
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: true,
      vapidKeysConfigured: true,
      activeSubscriptions: databaseService.inMemoryStorage.pushSubscriptions?.length || 0
    };
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
