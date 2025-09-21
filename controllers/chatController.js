// controllers/chatController.js
import PersonalAssistant from "../utils/PersonalAssistant.js";
import databaseService from "../utils/databaseService.js";

// Utility function for consistent date handling
const createDate = (year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) => {
  const date = new Date(year, month, day, hour, minute, second, millisecond);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date created, using current time');
    return new Date();
  }
  return date;
};

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
            text: parsedInput.action,
            category: 'general',
            createdAt: new Date()
          });
          return res.json({
            response: assistant.generateResponse(parsedInput),
            type: 'log_created',
            data: log
          });
        
        case 'reminder':
          // Use datetime from PersonalAssistant if available, otherwise create from date and time
          let datetime = parsedInput.datetime || new Date();
          
          // If we have a datetime from PersonalAssistant, use it directly
          if (parsedInput.datetime) {
            datetime = new Date(parsedInput.datetime);
          } else if (parsedInput.date && parsedInput.time) {
            // Create datetime from date and time strings
            const [hours, minutes] = parsedInput.time.split(':');
            const dateParts = parsedInput.date.split('-'); // YYYY-MM-DD format
            if (dateParts.length === 3) {
              datetime = createDate(
                parseInt(dateParts[0]), // year
                parseInt(dateParts[1]) - 1, // month (0-indexed)
                parseInt(dateParts[2]), // day
                parseInt(hours), // hour
                parseInt(minutes), // minute
                0, // second
                0  // millisecond
              );
            } else {
              // Fallback to current date if date format is invalid
              datetime = new Date();
              datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }
          } else if (parsedInput.date) {
            // If only date is provided, set to 9 AM
            const dateParts = parsedInput.date.split('-');
            if (dateParts.length === 3) {
              datetime = createDate(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2]),
                9, 0, 0, 0
              );
            } else {
              datetime = new Date();
            }
          }
          
          // Ensure datetime is valid
          if (isNaN(datetime.getTime())) {
            console.warn('Invalid datetime created, using current time:', parsedInput);
            datetime = new Date();
          }
          
          const reminder = await databaseService.createReminder({
            text: parsedInput.text,
            datetime: datetime,
            status: 'pending',
            voiceEnabled: true,
            repeatCount: 1,
            snoozeCount: 0,
            // Keep legacy fields for backward compatibility
            time: parsedInput.time,
            date: parsedInput.date,
            dateWord: parsedInput.dateWord,
            originalTime: parsedInput.originalTime,
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
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            data = await databaseService.getLogs({
              createdAt: { $gte: startOfDay, $lt: endOfDay }
            });
          } else if (parsedInput.queryType === 'reminders') {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            data = await databaseService.getReminders({
              datetime: { $gte: startOfDay, $lt: endOfDay }
            });
          } else {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            const logs = await databaseService.getLogs({
              createdAt: { $gte: startOfDay, $lt: endOfDay }
            });
            const reminders = await databaseService.getReminders({
              datetime: { $gte: startOfDay, $lt: endOfDay }
            });
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
      const logs = await databaseService.getLogs({});
      const reminders = await databaseService.getReminders({});
      
      const history = [
        ...logs.slice(0, limit / 2).map(log => ({
          type: 'log',
          content: log.originalInput || log.text,
          timestamp: log.createdAt
        })),
        ...reminders.slice(0, limit / 2).map(reminder => ({
          type: 'reminder',
          content: reminder.originalInput || `Remind me to ${reminder.text}`,
          timestamp: reminder.datetime
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
