import express from 'express';
import pushNotificationService from '../utils/pushNotificationService.js';
import databaseService from '../utils/databaseService.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userAgent, timestamp } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    const success = await pushNotificationService.storeSubscription(
      subscription,
      userAgent,
      timestamp
    );

    if (success) {
      res.json({
        success: true,
        message: 'Push subscription stored successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to store push subscription'
      });
    }
  } catch (error) {
    console.error('Error in push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    const success = await pushNotificationService.removeSubscription(endpoint);

    if (success) {
      res.json({
        success: true,
        message: 'Push subscription removed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to remove push subscription'
      });
    }
  } catch (error) {
    console.error('Error in push unsubscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const result = await pushNotificationService.sendTestNotification();
    
    res.json({
      success: true,
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Handle push notification actions (dismiss, snooze)
router.post('/action', async (req, res) => {
  try {
    const { reminderId, action } = req.body;

    if (!reminderId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Reminder ID and action are required'
      });
    }

    if (action === 'dismiss') {
      // Dismiss the reminder
      const reminder = await databaseService.updateReminder(reminderId, {
        status: 'completed',
        completedAt: new Date(),
        dismissedBy: 'push'
      });

      if (!reminder) {
        return res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
      }

      console.log('✅ Reminder dismissed via push notification:', reminder.text);

      res.json({
        success: true,
        message: 'Reminder dismissed successfully',
        data: reminder
      });
    } else if (action === 'snooze') {
      // Snooze the reminder for 10 minutes
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 10);

      const reminder = await databaseService.updateReminder(reminderId, {
        datetime: snoozeTime,
        snoozeCount: (reminder.snoozeCount || 0) + 1,
        lastSnoozedAt: new Date(),
        notified: false
      });

      if (!reminder) {
        return res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
      }

      console.log('⏰ Reminder snoozed via push notification:', reminder.text);

      res.json({
        success: true,
        message: 'Reminder snoozed for 10 minutes',
        data: reminder
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Supported actions: dismiss, snooze'
      });
    }
  } catch (error) {
    console.error('Error handling push notification action:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get push notification status
router.get('/status', async (req, res) => {
  try {
    const status = pushNotificationService.getStatus();
    const subscriptions = await pushNotificationService.getActiveSubscriptions();
    
    res.json({
      success: true,
      data: {
        ...status,
        activeSubscriptions: subscriptions.length,
        subscriptions: subscriptions.map(sub => ({
          endpoint: sub.endpoint,
          userAgent: sub.userAgent,
          createdAt: sub.createdAt,
          isActive: sub.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Error getting push status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get push status'
    });
  }
});

export default router;
