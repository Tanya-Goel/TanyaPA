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

  createLogInMemory(data) {
    const log = {
      _id: Date.now().toString(),
      ...data,
      date: new Date(),
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
        today.setHours(0, 0, 0, 0);
        return await Log.find({ date: { $gte: today } }).sort({ date: -1 });
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
    today.setHours(0, 0, 0, 0);
    return this.inMemoryStorage.logs.filter(log => log.date >= today);
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

  createReminderInMemory(data) {
    const reminder = {
      _id: Date.now().toString(),
      ...data,
      date: new Date(),
      completed: false,
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
        today.setHours(0, 0, 0, 0);
        return await Reminder.find({ date: { $gte: today } }).sort({ date: -1 });
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
    today.setHours(0, 0, 0, 0);
    return this.inMemoryStorage.reminders.filter(reminder => reminder.date >= today);
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
