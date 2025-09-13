// server-simple-working.js - Personal Assistant API with simple string parsing
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// In-memory storage
let logs = [];
let reminders = [];

// Simple Personal Assistant class
class PersonalAssistant {
  parseInput(input) {
    const lowerInput = input.toLowerCase().trim();
    
    // Check for queries first
    if (lowerInput.includes('what did i log') || lowerInput.includes('show me my logs')) {
      return { type: 'query', queryType: 'logs', originalInput: input };
    }
    
    if (lowerInput.includes('what are my reminders') || lowerInput.includes('show me my reminders')) {
      return { type: 'query', queryType: 'reminders', originalInput: input };
    }
    
    if (lowerInput.includes('what do i have') || lowerInput.includes('tell me about my day')) {
      return { type: 'query', queryType: 'both', originalInput: input };
    }
    
    // Check for log patterns
    if (lowerInput.startsWith('log that') || lowerInput.startsWith('log ')) {
      const action = input.replace(/^log\s+(?:that\s+)?/i, '').trim();
      const timeMatch = action.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
      const time = timeMatch ? timeMatch[1] : 'unknown time';
      const cleanAction = action.replace(/\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?/i, '').trim();
      
      return {
        type: 'log',
        action: cleanAction || 'activity',
        time: time,
        originalInput: input
      };
    }
    
    // Check for "I did X at Y" patterns
    if (lowerInput.match(/^i\s+(?:woke\s+up|got\s+up|started|did|completed|finished)/)) {
      const timeMatch = input.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
      const time = timeMatch ? timeMatch[1] : 'unknown time';
      const action = input.replace(/^i\s+(?:woke\s+up|got\s+up|started|did|completed|finished)\s+/i, '')
                         .replace(/\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?/i, '')
                         .trim();
      
      return {
        type: 'log',
        action: action || 'activity',
        time: time,
        originalInput: input
      };
    }
    
    // Check for reminder patterns
    if (lowerInput.startsWith('remind me') || lowerInput.startsWith('set a reminder')) {
      const text = input.replace(/^(?:remind\s+me\s+(?:to\s+)?|set\s+a\s+reminder\s+(?:to\s+)?)/i, '').trim();
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
      const time = timeMatch ? timeMatch[1] : 'no specific time';
      const cleanText = text.replace(/\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?/i, '').trim();
      
      return {
        type: 'reminder',
        text: cleanText || 'something',
        time: time,
        originalInput: input
      };
    }
    
    return { type: 'unknown', originalInput: input };
  }

  generateResponse(parsedInput, data = null) {
    switch (parsedInput.type) {
      case 'log':
        return `✅ Got it! I've logged "${parsedInput.action}" at ${parsedInput.time}.`;
      
      case 'reminder':
        return `🔔 Reminder set! I'll remind you to "${parsedInput.text}" at ${parsedInput.time}.`;
      
      case 'query':
        return this.generateQueryResponse(parsedInput.queryType, data);
      
      default:
        return `🤔 I'm not sure what you mean. Try saying something like "Log that I woke up at 7:30 AM" or "Remind me to call mom at 9 PM".`;
    }
  }

  generateQueryResponse(queryType, data) {
    if (!data || data.length === 0) {
      switch (queryType) {
        case 'logs':
          return "📝 You haven't logged anything today yet.";
        case 'reminders':
          return "🔔 You don't have any reminders set for today.";
        default:
          return "📋 You don't have any logs or reminders for today.";
      }
    }

    if (queryType === 'logs') {
      const logs = data.map(log => `• ${log.action} at ${log.time}`);
      return `📝 Here's what you've logged today:\n${logs.join('\n')}`;
    }
    
    if (queryType === 'reminders') {
      const reminders = data.map(reminder => `• ${reminder.text} at ${reminder.time}`);
      return `🔔 Here are your reminders for today:\n${reminders.join('\n')}`;
    }
    
    // Both logs and reminders
    const logs = data.logs || [];
    const reminders = data.reminders || [];
    
    let response = "";
    if (logs.length > 0) {
      response += `📝 Today's logs:\n${logs.map(log => `• ${log.action} at ${log.time}`).join('\n')}\n\n`;
    }
    if (reminders.length > 0) {
      response += `🔔 Today's reminders:\n${reminders.map(reminder => `• ${reminder.text} at ${reminder.time}`).join('\n')}`;
    }
    
    return response || "📋 You don't have any logs or reminders for today.";
  }
}

const assistant = new PersonalAssistant();

// Try to connect to MongoDB (optional)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.log("📝 No MongoDB URI configured, using in-memory storage");
      return;
    }
    
    console.log("🔄 Attempting to connect to MongoDB...");
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    
    console.log("✅ MongoDB connected successfully");
    
  } catch (err) {
    console.log("🔄 MongoDB connection failed, using in-memory storage");
    console.log(`❌ Error: ${err.message}`);
  }
};

// Initialize database connection
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
});

// ================== ROUTES ==================

// Chat endpoint (main conversational interface)
app.post("/api/chat", async (req, res) => {
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
        const log = {
          id: Date.now(),
          action: parsedInput.action,
          time: parsedInput.time,
          originalInput: parsedInput.originalInput,
          date: new Date()
        };
        logs.unshift(log);
        return res.json({
          response: assistant.generateResponse(parsedInput),
          type: 'log_created',
          data: log
        });
      
      case 'reminder':
        const reminder = {
          id: Date.now(),
          text: parsedInput.text,
          time: parsedInput.time,
          originalInput: parsedInput.originalInput,
          date: new Date(),
          completed: false
        };
        reminders.unshift(reminder);
        return res.json({
          response: assistant.generateResponse(parsedInput),
          type: 'reminder_created',
          data: reminder
        });
      
      case 'query':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let data = null;
        if (parsedInput.queryType === 'logs') {
          data = logs.filter(log => log.date >= today);
        } else if (parsedInput.queryType === 'reminders') {
          data = reminders.filter(reminder => reminder.date >= today);
        } else {
          const todayLogs = logs.filter(log => log.date >= today);
          const todayReminders = reminders.filter(reminder => reminder.date >= today);
          data = { logs: todayLogs, reminders: todayReminders };
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
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Personal Assistant API is running!",
    timestamp: new Date().toISOString(),
    storage: "in-memory",
    stats: {
      totalLogs: logs.length,
      totalReminders: reminders.length
    }
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Personal Assistant API",
    version: "1.0.0",
    storage: "in-memory",
    endpoints: {
      chat: "POST /api/chat",
      health: "GET /api/health"
    },
    examples: {
      log: "Log that I woke up at 7:30 AM",
      reminder: "Remind me to call mom at 9 PM",
      query: "What did I log today?"
    },
    stats: {
      totalLogs: logs.length,
      totalReminders: reminders.length
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ================== SERVER START ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Personal Assistant API running on http://localhost:${PORT}`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`📊 Health check: GET http://localhost:${PORT}/api/health`);
  console.log(`📖 API docs: GET http://localhost:${PORT}/`);
  console.log(`🗄️  Storage: In-Memory (MongoDB optional)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
