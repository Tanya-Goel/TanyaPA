// controllers/logController.js
import Log from "../models/Log.js";
import databaseService from "../utils/databaseService.js";

const logController = {
  // POST /logs - Create a new log entry
  createLog: async (req, res) => {
    try {
      const { text, category = 'general' } = req.body;
      
      if (!text || text.trim() === '') {
        return res.status(400).json({ 
          error: "Text is required for log entry" 
        });
      }

      const logData = {
        text: text.trim(),
        category: category.trim(),
        createdAt: new Date()
      };

      const log = await databaseService.createLog(logData);
      
      res.status(201).json({ 
        success: true,
        message: "Log created successfully", 
        data: log
      });
    } catch (err) {
      console.error("Error creating log:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to create log entry",
        details: err.message 
      });
    }
  },

  // GET /logs - Get all logs with filters
  getAllLogs: async (req, res) => {
    try {
      const { filter = 'all', category } = req.query;
      
      let query = {};
      let logs = [];

      // Apply filters
      if (filter === 'today') {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        query.createdAt = { $gte: startOfDay, $lt: endOfDay };
      } else if (filter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.createdAt = { $gte: sevenDaysAgo };
      }

      if (category) {
        query.category = category;
      }

      logs = await databaseService.getLogs(query);

      // Group logs by day
      const groupedLogs = logs.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(log);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          logs: groupedLogs,
          total: logs.length,
          filter,
          category: category || 'all'
        }
      });
    } catch (err) {
      console.error("Error fetching logs:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch logs",
        details: err.message 
      });
    }
  },

  // GET /logs/today - Get today's logs
  getLogsToday: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const logs = await databaseService.getLogs({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      res.json({
        success: true,
        data: {
          logs,
          total: logs.length,
          date: today.toISOString().split('T')[0]
        }
      });
    } catch (err) {
      console.error("Error fetching today's logs:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch today's logs",
        details: err.message 
      });
    }
  },

  // PUT /logs/:id - Update a log entry
  updateLog: async (req, res) => {
    try {
      const { id } = req.params;
      const { text, category } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ 
          success: false,
          error: "Text is required for log entry" 
        });
      }

      const updateData = {
        text: text.trim(),
        ...(category && { category: category.trim() })
      };

      const log = await databaseService.updateLog(id, updateData);
      
      if (!log) {
        return res.status(404).json({ 
          success: false,
          error: "Log not found" 
        });
      }

      res.json({ 
        success: true,
        message: "Log updated successfully", 
        data: log
      });
    } catch (err) {
      console.error("Error updating log:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to update log",
        details: err.message 
      });
    }
  },

  // DELETE /logs/:id - Delete a log entry
  deleteLog: async (req, res) => {
    try {
      const { id } = req.params;
      const log = await databaseService.deleteLog(id);
      
      if (!log) {
        return res.status(404).json({ 
          success: false,
          error: "Log not found" 
        });
      }
      
      res.json({ 
        success: true,
        message: "Log deleted successfully", 
        data: log
      });
    } catch (err) {
      console.error("Error deleting log:", err);
      res.status(500).json({ 
        success: false,
        error: "Failed to delete log",
        details: err.message 
      });
    }
  }
};

export default logController;
