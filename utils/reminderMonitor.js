// utils/reminderMonitor.js - Backend reminder monitoring service
import Reminder from "../models/Reminder.js";
import databaseService from "./databaseService.js";
import pushNotificationService from "./pushNotificationService.js";

class ReminderMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 1000; // Check every 1 second for exact timing
    this.notificationClients = new Map(); // Store connected clients for notifications
  }

  // Start monitoring reminders
  start() {
    if (this.isRunning) {
      console.log('🔄 Reminder monitor already running');
      return;
    }

    console.log('🚀 Starting reminder monitor...');
    this.isRunning = true;
    
    // Check immediately
    this.checkReminders();
    
    // Then check every 1 second for exact timing
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, this.checkIntervalMs);
  }

  // Stop monitoring
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Reminder monitor stopped');
  }

  // Check for due reminders
  async checkReminders() {
    try {
      const now = new Date();
      const currentTimeString = now.toTimeString().slice(0, 5);
      const currentDateString = now.toISOString().split('T')[0];

      // Get all active reminders
      const reminders = await this.getActiveReminders();
      
      for (const reminder of reminders) {
        if (this.isReminderDue(reminder, currentTimeString, currentDateString, now)) {
          console.log(`🔔 Found due reminder: ${reminder.text} (ID: ${reminder._id})`);
          // Mark as notified BEFORE triggering to prevent duplicates
          await this.markReminderAsNotified(reminder._id);
          await this.triggerReminder(reminder);
        }
      }
      
      // Clean up old reminders (older than 7 days) - temporarily disabled to fix errors
      // await this.cleanupOldReminders();
    } catch (error) {
      console.error('❌ Error checking reminders:', error);
    }
  }

  // Get active reminders (not completed, not notified)
  async getActiveReminders() {
    try {
      if (databaseService.isMongoConnected) {
        // Get reminders using new datetime field OR legacy time/date fields
        return await Reminder.find({
          $and: [
            { status: { $ne: 'completed' } },
            { notified: { $ne: true } },
            {
              $or: [
                // New system: datetime field
                { datetime: { $exists: true, $ne: null } },
                // Legacy system: time and date fields
                { 
                  $and: [
                    { time: { $exists: true, $ne: null } },
                    { date: { $exists: true, $ne: null } }
                  ]
                }
              ]
            }
          ]
        });
      } else {
        // Fallback to in-memory storage
        return databaseService.inMemoryStorage.reminders.filter(reminder => 
          reminder.status !== 'completed' && 
          !reminder.notified && 
          (reminder.datetime || (reminder.time && reminder.date))
        );
      }
    } catch (error) {
      console.error('❌ Error getting active reminders:', error);
      return [];
    }
  }

  // Check if reminder is due
  isReminderDue(reminder, currentTimeString, currentDateString, now) {
    // New system: check datetime field
    if (reminder.datetime) {
      const reminderTime = new Date(reminder.datetime);
      // Only trigger when the reminder time has been reached or just passed (within 30 seconds tolerance)
      // This ensures reminders are scheduled for the future and don't fire immediately
      const timeDiff = now.getTime() - reminderTime.getTime();
      return timeDiff >= 0 && timeDiff <= 30000; // Within 30 seconds of exact time
    }
    
    // Legacy system: check time and date fields
    if (reminder.time && reminder.date) {
      return reminder.time === currentTimeString && 
             reminder.date === currentDateString;
    }
    
    return false;
  }

  // Trigger a reminder
  async triggerReminder(reminder) {
    try {
      const reminderTime = reminder.datetime ? new Date(reminder.datetime).toLocaleTimeString() : reminder.time;
      console.log(`🔔 Triggering reminder: ${reminder.text} at ${reminderTime}`);
      
      // Send push notification to all subscribers
      const pushResult = await pushNotificationService.sendReminderNotification(reminder);
      console.log(`📱 Push notification result:`, pushResult);
      
      // Send notification to connected clients
      this.sendNotificationToClients({
        type: 'reminder_alert',
        reminder: {
          id: reminder._id,
          text: reminder.text,
          time: reminderTime,
          date: reminder.date || (reminder.datetime ? new Date(reminder.datetime).toISOString().split('T')[0] : null),
          dateWord: reminder.dateWord || 'today',
          datetime: reminder.datetime,
          voiceEnabled: reminder.voiceEnabled !== false,
          repeatCount: reminder.repeatCount || 1
        },
        message: `🚨 REMINDER ALERT: ${reminder.text}`
      });
      
      // Auto-complete the reminder after a delay to allow user interaction
      setTimeout(async () => {
        await this.autoCompleteReminder(reminder._id);
        console.log(`✅ Reminder auto-completed after delay: ${reminder.text}`);
      }, 300000); // 5 minute delay to allow voice alerts to play and user to interact
      
      console.log(`✅ Reminder triggered: ${reminder.text}`);
      
    } catch (error) {
      console.error('❌ Error triggering reminder:', error);
    }
  }

  // Mark reminder as notified
  async markReminderAsNotified(reminderId) {
    try {
      if (databaseService.isMongoConnected) {
        const result = await Reminder.findByIdAndUpdate(reminderId, { notified: true }, { new: true });
        console.log(`✅ Marked reminder ${reminderId} as notified:`, result ? 'success' : 'not found');
      } else {
        // Update in-memory storage
        const reminder = databaseService.inMemoryStorage.reminders.find(r => r._id === reminderId);
        if (reminder) {
          reminder.notified = true;
          console.log(`✅ Marked reminder ${reminderId} as notified in memory`);
        }
      }
    } catch (error) {
      console.error('❌ Error marking reminder as notified:', error);
    }
  }

  // Auto-complete reminder after delay
  async autoCompleteReminder(reminderId) {
    try {
      if (databaseService.isMongoConnected) {
        await Reminder.findByIdAndUpdate(reminderId, { 
          status: 'completed',
          completedAt: new Date(),
          dismissedBy: 'auto'
        });
      } else {
        // Update in-memory storage
        const reminder = databaseService.inMemoryStorage.reminders.find(r => r._id === reminderId);
        if (reminder) {
          reminder.status = 'completed';
          reminder.completedAt = new Date();
          reminder.dismissedBy = 'auto';
        }
      }
    } catch (error) {
      console.error('❌ Error auto-completing reminder:', error);
    }
  }

  // Add client for notifications (WebSocket or SSE)
  addNotificationClient(clientId, client) {
    this.notificationClients.set(clientId, client);
    console.log(`📱 Added notification client: ${clientId}`);
  }

  // Remove client
  removeNotificationClient(clientId) {
    this.notificationClients.delete(clientId);
    console.log(`📱 Removed notification client: ${clientId}`);
  }

  // Send notification to all connected clients
  sendNotificationToClients(notification) {
    const notificationData = JSON.stringify(notification);
    console.log(`📤 Sending WebSocket notification to ${this.notificationClients.size} clients:`, notification);
    
    this.notificationClients.forEach((client, clientId) => {
      try {
        if (client.readyState === 1) { // WebSocket open
          client.send(notificationData);
          console.log(`✅ WebSocket notification sent to client ${clientId}`);
        } else {
          console.log(`❌ Client ${clientId} not ready (state: ${client.readyState}), removing`);
          // Remove disconnected clients
          this.removeNotificationClient(clientId);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to client ${clientId}:`, error);
        this.removeNotificationClient(clientId);
      }
    });
  }

  // Clean up old reminders (older than 7 days)
  async cleanupOldReminders() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      if (databaseService.isMongoConnected) {
        const result = await Reminder.deleteMany({
          $or: [
            // Delete completed reminders older than 7 days
            {
              status: 'completed',
              datetime: { $lt: sevenDaysAgo }
            },
            // Delete old pending reminders that are way overdue (older than 7 days)
            {
              status: 'pending',
              datetime: { $lt: sevenDaysAgo }
            }
          ]
        });
        
        if (result.deletedCount > 0) {
          console.log(`🧹 Cleaned up ${result.deletedCount} old reminders`);
        }
      } else {
        // Clean up in-memory storage
        const initialCount = databaseService.inMemoryStorage.reminders.length;
        databaseService.inMemoryStorage.reminders = databaseService.inMemoryStorage.reminders.filter(reminder => {
          const reminderDate = new Date(reminder.datetime || reminder.date);
          return reminderDate >= sevenDaysAgo;
        });
        
        const cleanedCount = initialCount - databaseService.inMemoryStorage.reminders.length;
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} old reminders from memory`);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up old reminders:', error);
    }
  }

  // Get monitoring status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      connectedClients: this.notificationClients.size,
      nextCheck: this.isRunning ? new Date(Date.now() + this.checkIntervalMs) : null
    };
  }

  // Manual reminder check (for testing)
  async manualCheck() {
    console.log('🔍 Manual reminder check triggered');
    await this.checkReminders();
  }
}

// Create singleton instance
const reminderMonitor = new ReminderMonitor();

export default reminderMonitor;
