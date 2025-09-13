// controllers/logController.js
import databaseService from "../utils/databaseService.js";

const logController = {
  createLog: async (req, res) => {
    try {
      const { action, time, originalInput } = req.body;
      const log = await databaseService.createLog({ action, time, originalInput });
      res.status(201).json({ 
        message: "Log added!", 
        log,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  getLogsToday: async (req, res) => {
    try {
      const logs = await databaseService.getLogsToday();
      res.json({
        logs,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  getAllLogs: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await databaseService.getAllLogs({ page, limit });
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

  deleteLog: async (req, res) => {
    try {
      const { id } = req.params;
      const log = await Log.findByIdAndDelete(id);
      
      if (!log) {
        return res.status(404).json({ 
          error: "Log not found" 
        });
      }
      
      res.json({ 
        message: "Log deleted successfully", 
        log 
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  }
};

export default logController;
