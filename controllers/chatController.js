// controllers/chatController.js
import PersonalAssistant from "../utils/PersonalAssistant.js";
import databaseService from "../utils/databaseService.js";

const assistant = new PersonalAssistant();

const chatController = {
  processMessage: async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          error: "Message is required" 
        });
      }

      const parsedInput = assistant.parseInput(message);
      
      switch (parsedInput.type) {
        case 'log':
          const log = await databaseService.createLog({
            action: parsedInput.action,
            time: parsedInput.time,
            originalInput: parsedInput.originalInput
          });
          return res.json({
            response: assistant.generateResponse(parsedInput),
            type: 'log_created',
            data: log
          });
        
        case 'reminder':
          const reminder = await databaseService.createReminder({
            text: parsedInput.text,
            time: parsedInput.time,
            originalInput: parsedInput.originalInput
          });
          return res.json({
            response: assistant.generateResponse(parsedInput),
            type: 'reminder_created',
            data: reminder
          });
        
        case 'query':
          let data = null;
          if (parsedInput.queryType === 'logs') {
            data = await databaseService.getLogsToday();
          } else if (parsedInput.queryType === 'reminders') {
            data = await databaseService.getRemindersToday();
          } else {
            const logs = await databaseService.getLogsToday();
            const reminders = await databaseService.getRemindersToday();
            data = { logs, reminders };
          }
          
          return res.json({
            response: assistant.generateQueryResponse(parsedInput.queryType, data),
            type: 'query_response',
            data: data
          });
        
        default:
          return res.json({
            response: assistant.generateResponse(parsedInput),
            type: 'unknown',
            data: null
          });
      }
    } catch (err) {
      console.error('Chat controller error:', err);
      res.status(500).json({ 
        error: err.message 
      });
    }
  },

  // Get conversation history (optional feature)
  getConversationHistory: async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      
      // Get recent logs and reminders as conversation history
      const logsResult = await databaseService.getAllLogs({ page: 1, limit: limit / 2 });
      const remindersResult = await databaseService.getAllReminders({ page: 1, limit: limit / 2 });
      
      const history = [
        ...logsResult.logs.map(log => ({
          type: 'log',
          content: log.originalInput || `${log.action} at ${log.time}`,
          timestamp: log.date
        })),
        ...remindersResult.reminders.map(reminder => ({
          type: 'reminder',
          content: reminder.originalInput || `Remind me to ${reminder.text} at ${reminder.time}`,
          timestamp: reminder.date
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
       .slice(0, limit);
      
      res.json({ 
        history,
        storage: databaseService.getStorageInfo()
      });
    } catch (err) {
      res.status(500).json({ 
        error: err.message 
      });
    }
  }
};

export default chatController;
