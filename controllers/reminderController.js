// controllers/reminderController.js
import databaseService from "../utils/databaseService.js";

const reminderController = {
  // POST /reminders - Create a new reminder
  createReminder: async (req, res) => {
    try {
      const { 
        text, 
        datetime, 
        status = 'pending',
        voiceEnabled = true,
        repeatCount = 1
      } = req.body;
      
      if (!text || text.trim() === '') {
        return res.status(400).json({ 
          success: false,
          error: "Text is required for reminder" 
        });
      }

      if (!datetime) {
        return res.status(400).json({ 
          success: false,
          error: "Datetime is required for reminder" 
        });
      }

      const reminderData = {
        text: text.trim(),
        datetime: new Date(datetime),
        status: status,
        voiceEnabled: voiceEnabled,
        repeatCount: Math.min(Math.max(repeatCount, 1), 5), // Clamp between 1-5
        snoozeCount: 0
      };

      const reminder = await databaseService.createReminder(reminderData);
      
      res.status(201).json({ 
        success: true,
        message: "Reminder created successfully", 
        data: reminder
      });
    } catch (err) {
      console.error("Error creating reminder:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to create reminder",
        details: err.message 
      });
    }
  },

  // GET /reminders - Get all reminders with filters
  getAllReminders: async (req, res) => {
    try {
      const { filter = 'all' } = req.query;
      
      let query = {};
      let reminders = [];

      // Apply filters
      if (filter === 'pending') {
        query.status = 'pending';
      } else if (filter === 'completed') {
        query.status = 'completed';
      } else if (filter === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        query.datetime = { $gte: startOfDay, $lt: endOfDay };
      }

      reminders = await databaseService.getReminders(query);

      // Separate reminders into categories
      const pendingReminders = reminders.filter(r => r.status === 'pending');
      const completedReminders = reminders.filter(r => r.status === 'completed');
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const todayReminders = reminders.filter(r => {
        const reminderDate = new Date(r.datetime);
        return reminderDate >= startOfDay && reminderDate < endOfDay;
      });

      res.json({
        success: true,
        data: {
          pending: pendingReminders,
          completed: completedReminders,
          today: todayReminders,
          total: reminders.length,
          filter
        }
      });
    } catch (err) {
      console.error("Error fetching reminders:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch reminders",
        details: err.message 
      });
    }
  },

  // GET /reminders/today - Get today's reminders
  getRemindersToday: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const reminders = await databaseService.getReminders({
        datetime: { $gte: startOfDay, $lt: endOfDay }
      });

      res.json({
        success: true,
        data: {
          reminders,
          total: reminders.length,
          date: today.toISOString().split('T')[0]
        }
      });
    } catch (err) {
      console.error("Error fetching today's reminders:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch today's reminders",
        details: err.message 
      });
    }
  },

  // PUT /reminders/:id - Update a reminder
  updateReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        text, 
        datetime, 
        status, 
        voiceEnabled, 
        repeatCount,
        snoozeCount,
        lastSnoozedAt
      } = req.body;

      // Allow status-only updates (for marking complete/incomplete)
      if (!text && !datetime && !status && voiceEnabled === undefined && !repeatCount && snoozeCount === undefined && !lastSnoozedAt) {
        return res.status(400).json({ 
          success: false,
          error: "At least one field is required for update" 
        });
      }

      const updateData = {};
      if (text && text.trim() !== '') {
        updateData.text = text.trim();
      }
      if (datetime) {
        updateData.datetime = new Date(datetime);
      }
      if (status) {
        updateData.status = status;
      }
      if (voiceEnabled !== undefined) {
        updateData.voiceEnabled = voiceEnabled;
      }
      if (repeatCount !== undefined) {
        updateData.repeatCount = Math.min(Math.max(repeatCount, 1), 5);
      }
      if (snoozeCount !== undefined) {
        updateData.snoozeCount = snoozeCount;
      }
      if (lastSnoozedAt) {
        updateData.lastSnoozedAt = new Date(lastSnoozedAt);
      }

      const reminder = await databaseService.updateReminder(id, updateData);
      
      if (!reminder) {
        return res.status(404).json({ 
          success: false,
          error: "Reminder not found" 
        });
      }

      res.json({ 
        success: true,
        message: "Reminder updated successfully", 
        data: reminder
      });
    } catch (err) {
      console.error("Error updating reminder:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to update reminder",
        details: err.message 
      });
    }
  },

  // PUT /reminders/:id/dismiss - Dismiss a reminder (mark as completed)
  dismissReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const { method = 'manual' } = req.body; // 'voice', 'push', 'manual'
      
      const reminder = await databaseService.updateReminder(id, {
        status: 'completed',
        completedAt: new Date(),
        dismissedBy: method
      });
      
      if (!reminder) {
        return res.status(404).json({ 
          success: false,
          error: "Reminder not found" 
        });
      }
      
      console.log(`✅ Reminder dismissed via ${method}:`, reminder.text);
      
      res.json({ 
        success: true,
        message: "Reminder dismissed successfully", 
        data: reminder
      });
    } catch (err) {
      console.error("Error dismissing reminder:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to dismiss reminder",
        details: err.message 
      });
    }
  },

  // DELETE /reminders/:id - Delete a reminder
  deleteReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const reminder = await databaseService.deleteReminder(id);
      
      if (!reminder) {
        return res.status(404).json({ 
          success: false,
          error: "Reminder not found" 
        });
      }
      
      res.json({ 
        success: true,
        message: "Reminder deleted successfully", 
        data: reminder
      });
    } catch (err) {
      console.error("Error deleting reminder:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to delete reminder",
        details: err.message 
      });
    }
  }
};

export default reminderController;
