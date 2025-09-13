// controllers/reminderController.js
import databaseService from "../utils/databaseService.js";

const reminderController = {
  createReminder: async (req, res) => {
    try {
      const { text, time, originalInput } = req.body;
      const reminder = await databaseService.createReminder({ text, time, originalInput });
      res.status(201).json({ 
        message: "Reminder set!", 
        reminder,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  getRemindersToday: async (req, res) => {
    try {
      const reminders = await databaseService.getRemindersToday();
      res.json({
        reminders,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  getAllReminders: async (req, res) => {
    try {
      const { page = 1, limit = 10, completed } = req.query;
      const result = await databaseService.getAllReminders({ page, limit, completed });
      res.json({
        ...result,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  updateReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const { completed, text, time } = req.body;
      
      const updateData = {};
      if (completed !== undefined) updateData.completed = completed;
      if (text) updateData.text = text;
      if (time) updateData.time = time;
      
      const reminder = await Reminder.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true }
      );
      
      if (!reminder) {
        return res.status(404).json({ 
          error: "Reminder not found" 
        });
      }
      
      res.json({ 
        message: "Reminder updated successfully", 
        reminder 
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  deleteReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const reminder = await Reminder.findByIdAndDelete(id);
      
      if (!reminder) {
        return res.status(404).json({ 
          error: "Reminder not found" 
        });
      }
      
      res.json({ 
        message: "Reminder deleted successfully", 
        reminder 
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  }
};

export default reminderController;
