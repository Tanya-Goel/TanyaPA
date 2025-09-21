// utils/databaseService.js - Database service with MongoDB and in-memory fallback
import mongoose from "mongoose";
import Log from "../models/Log.js";
import Reminder from "../models/Reminder.js";

class DatabaseService {
  constructor() {
    this.isMongoConnected = false;
    this.inMemoryStorage = {
      logs: [],
      reminders: []
    };
    
    // Check MongoDB connection status
    this.checkConnection();
  }

  checkConnection() {
    this.isMongoConnected = mongoose.connection.readyState === 1;
    
    // Listen for connection changes
    mongoose.connection.on('connected', () => {
      this.isMongoConnected = true;
      console.log('🔄 Database service: MongoDB connected');
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isMongoConnected = false;
      console.log('🔄 Database service: MongoDB disconnected, using in-memory storage');
    });
  }

  // Log operations
  async createLog(data) {
    if (this.isMongoConnected) {
      try {
        const log = new Log(data);
        await log.save();
        return log;
      } catch (error) {
        console.error('MongoDB log creation failed, falling back to in-memory:', error.message);
        return this.createLogInMemory(data);
      }
    } else {
      return this.createLogInMemory(data);
    }
  }

  async getLogs(query = {}) {
    if (this.isMongoConnected) {
      try {
        return await Log.find(query).sort({ createdAt: -1 });
      } catch (error) {
        console.error('MongoDB log retrieval failed, falling back to in-memory:', error.message);
        return this.getLogsInMemory(query);
      }
    } else {
      return this.getLogsInMemory(query);
    }
  }

  getLogsInMemory(query = {}) {
    let logs = [...this.inMemoryStorage.logs];
    
    // Apply filters
    if (query.createdAt) {
      const { $gte, $lt } = query.createdAt;
      logs = logs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate >= $gte && logDate < $lt;
      });
    }
    
    if (query.category) {
      logs = logs.filter(log => log.category === query.category);
    }
    
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async updateLog(id, updateData) {
    if (this.isMongoConnected) {
      try {
        return await Log.findByIdAndUpdate(id, updateData, { new: true });
      } catch (error) {
        console.error('MongoDB log update failed, falling back to in-memory:', error.message);
        return this.updateLogInMemory(id, updateData);
      }
    } else {
      return this.updateLogInMemory(id, updateData);
    }
  }

  updateLogInMemory(id, updateData) {
    const index = this.inMemoryStorage.logs.findIndex(log => log._id === id);
    if (index !== -1) {
      this.inMemoryStorage.logs[index] = { ...this.inMemoryStorage.logs[index], ...updateData };
      return this.inMemoryStorage.logs[index];
    }
    return null;
  }

  async deleteLog(id) {
    if (this.isMongoConnected) {
      try {
        return await Log.findByIdAndDelete(id);
      } catch (error) {
        console.error('MongoDB log deletion failed, falling back to in-memory:', error.message);
        return this.deleteLogInMemory(id);
      }
    } else {
      return this.deleteLogInMemory(id);
    }
  }

  deleteLogInMemory(id) {
    const index = this.inMemoryStorage.logs.findIndex(log => log._id === id);
    if (index !== -1) {
      return this.inMemoryStorage.logs.splice(index, 1)[0];
    }
    return null;
  }

  createLogInMemory(data) {
    const log = {
      _id: Date.now().toString(),
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      created: new Date().toLocaleTimeString(),
      toObject: () => log,
      toJSON: () => log
    };
    this.inMemoryStorage.logs.push(log);
    return log;
  }

  async getLogsToday() {
    if (this.isMongoConnected) {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
        return await Log.find({ 
          createdAt: { $gte: startOfDay, $lt: endOfDay } 
        }).sort({ createdAt: -1 });
      } catch (error) {
        console.error('MongoDB log retrieval failed, falling back to in-memory:', error.message);
        return this.getLogsTodayInMemory();
      }
    } else {
      return this.getLogsTodayInMemory();
    }
  }

  getLogsTodayInMemory() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
    return this.inMemoryStorage.logs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= startOfDay && logDate < endOfDay;
    });
  }

  async getAllLogs(options = {}) {
    if (this.isMongoConnected) {
      try {
        const { page = 1, limit = 10 } = options;
        const logs = await Log.find()
          .sort({ date: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);
        
        const total = await Log.countDocuments();
        
        return {
          logs,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        };
      } catch (error) {
        console.error('MongoDB log retrieval failed, falling back to in-memory:', error.message);
        return this.getAllLogsInMemory(options);
      }
    } else {
      return this.getAllLogsInMemory(options);
    }
  }

  getAllLogsInMemory(options = {}) {
    const { page = 1, limit = 10 } = options;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = this.inMemoryStorage.logs.slice(startIndex, endIndex);
    
    return {
      logs: paginatedLogs,
      totalPages: Math.ceil(this.inMemoryStorage.logs.length / limit),
      currentPage: parseInt(page),
      total: this.inMemoryStorage.logs.length
    };
  }

  // Reminder operations
  async createReminder(data) {
    if (this.isMongoConnected) {
      try {
        const reminder = new Reminder(data);
        await reminder.save();
        return reminder;
      } catch (error) {
        console.error('MongoDB reminder creation failed, falling back to in-memory:', error.message);
        return this.createReminderInMemory(data);
      }
    } else {
      return this.createReminderInMemory(data);
    }
  }

  async getReminders(query = {}) {
    if (this.isMongoConnected) {
      try {
        return await Reminder.find(query).sort({ datetime: 1 });
      } catch (error) {
        console.error('MongoDB reminder retrieval failed, falling back to in-memory:', error.message);
        return this.getRemindersInMemory(query);
      }
    } else {
      return this.getRemindersInMemory(query);
    }
  }

  getRemindersInMemory(query = {}) {
    let reminders = [...this.inMemoryStorage.reminders];
    
    // Apply filters
    if (query.status) {
      reminders = reminders.filter(reminder => reminder.status === query.status);
    }
    
    if (query.datetime) {
      const { $gte, $lt } = query.datetime;
      reminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.datetime);
        return reminderDate >= $gte && reminderDate < $lt;
      });
    }
    
    return reminders.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }

  async updateReminder(id, updateData) {
    if (this.isMongoConnected) {
      try {
        return await Reminder.findByIdAndUpdate(id, updateData, { new: true });
      } catch (error) {
        console.error('MongoDB reminder update failed, falling back to in-memory:', error.message);
        return this.updateReminderInMemory(id, updateData);
      }
    } else {
      return this.updateReminderInMemory(id, updateData);
    }
  }

  updateReminderInMemory(id, updateData) {
    const index = this.inMemoryStorage.reminders.findIndex(reminder => reminder._id === id);
    if (index !== -1) {
      this.inMemoryStorage.reminders[index] = { ...this.inMemoryStorage.reminders[index], ...updateData };
      return this.inMemoryStorage.reminders[index];
    }
    return null;
  }

  async deleteReminder(id) {
    if (this.isMongoConnected) {
      try {
        return await Reminder.findByIdAndDelete(id);
      } catch (error) {
        console.error('MongoDB reminder deletion failed, falling back to in-memory:', error.message);
        return this.deleteReminderInMemory(id);
      }
    } else {
      return this.deleteReminderInMemory(id);
    }
  }

  deleteReminderInMemory(id) {
    const index = this.inMemoryStorage.reminders.findIndex(reminder => reminder._id === id);
    if (index !== -1) {
      return this.inMemoryStorage.reminders.splice(index, 1)[0];
    }
    return null;
  }

  createReminderInMemory(data) {
    const now = new Date();
    const reminder = {
      _id: Date.now().toString(),
      ...data,
      datetime: data.datetime || now,
      status: data.status || 'pending',
      // Legacy fields for backward compatibility - preserve full time with seconds
      date: data.date || now.toISOString().split('T')[0],
      time: data.time || now.toTimeString().slice(0, 8), // Include seconds: HH:MM:SS
      completed: data.status === 'completed',
      notified: data.notified || false,
      voiceEnabled: data.voiceEnabled !== false,
      repeatCount: data.repeatCount || 1,
      snoozeCount: data.snoozeCount || 0,
      toObject: () => reminder,
      toJSON: () => reminder
    };
    this.inMemoryStorage.reminders.push(reminder);
    return reminder;
  }

  async getRemindersToday() {
    if (this.isMongoConnected) {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
        return await Reminder.find({ 
          datetime: { $gte: startOfDay, $lt: endOfDay } 
        }).sort({ datetime: 1 });
      } catch (error) {
        console.error('MongoDB reminder retrieval failed, falling back to in-memory:', error.message);
        return this.getRemindersTodayInMemory();
      }
    } else {
      return this.getRemindersTodayInMemory();
    }
  }

  getRemindersTodayInMemory() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
    return this.inMemoryStorage.reminders.filter(reminder => {
      const reminderDate = new Date(reminder.datetime);
      return reminderDate >= startOfDay && reminderDate < endOfDay;
    });
  }

  async getAllReminders(options = {}) {
    if (this.isMongoConnected) {
      try {
        const { page = 1, limit = 10, completed } = options;
        const filter = {};
        
        if (completed !== undefined) {
          filter.completed = completed === 'true';
        }
        
        const reminders = await Reminder.find(filter)
          .sort({ date: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);
        
        const total = await Reminder.countDocuments(filter);
        
        return {
          reminders,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        };
      } catch (error) {
        console.error('MongoDB reminder retrieval failed, falling back to in-memory:', error.message);
        return this.getAllRemindersInMemory(options);
      }
    } else {
      return this.getAllRemindersInMemory(options);
    }
  }

  getAllRemindersInMemory(options = {}) {
    const { page = 1, limit = 10, completed } = options;
    let filteredReminders = [...this.inMemoryStorage.reminders];
    
    if (completed !== undefined) {
      filteredReminders = filteredReminders.filter(reminder => reminder.completed === (completed === 'true'));
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReminders = filteredReminders.slice(startIndex, endIndex);
    
    return {
      reminders: paginatedReminders,
      totalPages: Math.ceil(filteredReminders.length / limit),
      currentPage: parseInt(page),
      total: filteredReminders.length
    };
  }

  // Get storage status
  getStorageInfo() {
    return {
      type: this.isMongoConnected ? 'MongoDB' : 'In-Memory',
      connected: this.isMongoConnected,
      stats: {
        totalLogs: this.inMemoryStorage.logs.length,
        totalReminders: this.inMemoryStorage.reminders.length
      }
    };
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
